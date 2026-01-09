import { Worker, Job } from 'bullmq';
import fs from 'fs';
import { connection } from '../config/queue';
import prisma from '../config/prisma';
import { getIO } from '../config/socket';
import { parse } from 'csv-parse';
import { Prisma } from '@prisma/client';

interface ImportJobData {
    filePath: string;
    userId?: string;
    totalRows?: number;
    lastProcessedRow?: number;  // For resumability
}

interface ImportJobResult {
    count: number;
}

interface ImportProgress {
    percentage: number;
    count: number;
}

const isImportProgress = (progress: unknown): progress is ImportProgress => (
    typeof progress === 'object' &&
    progress !== null &&
    'percentage' in progress &&
    'count' in progress
);

export const importWorker = new Worker<ImportJobData, ImportJobResult>(
    'import-queue',
    async (job) => {
        const { filePath, lastProcessedRow = 0 } = job.data;
        let count = lastProcessedRow;  // Resume from last processed count
        let currentRow = 0;
        let batch: Prisma.EmployeeCreateManyInput[] = [];
        const BATCH_SIZE = 1000;

        if (!fs.existsSync(filePath)) {
            throw new Error('File not found at ' + filePath);
        }

        const parser = fs.createReadStream(filePath).pipe(
            parse({
                columns: true,
                skip_empty_lines: true,
                trim: true,
            })
        );

        for await (const record of parser) {
            currentRow++;

            // Skip already processed rows (resumability)
            if (currentRow <= lastProcessedRow) continue;

            if (!record.name || isNaN(parseInt(record.age))) continue;

            batch.push({
                name: record.name,
                age: parseInt(record.age),
                position: record.position || 'Unknown',
                salary: parseFloat(record.salary) || 0,
            });

            if (batch.length >= BATCH_SIZE) {
                await prisma.employee.createMany({ data: batch, skipDuplicates: true });
                count += batch.length;
                batch = [];
                const total = job.data.totalRows || 20000;

                // Persist progress for resumability
                await job.updateData({
                    ...job.data,
                    lastProcessedRow: currentRow,
                });

                await job.updateProgress({
                    percentage: Math.min(Math.round((count / total) * 100), 99),
                    count
                });
            }
        }

        if (batch.length > 0) {
            await prisma.employee.createMany({ data: batch });
            count += batch.length;
        }

        await job.updateProgress({ percentage: 100, count });

        // Only delete file on successful completion
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up file: ${filePath}`);
        }

        return { count };
    },
    { connection }
);

importWorker.on('progress', (job, progress) => {
    if (!isImportProgress(progress)) return;

    const io = getIO();
    io.emit('import-progress', {
        jobId: job.id,
        progress: progress.percentage,
        count: progress.count
    });
});

importWorker.on('completed', (job, result) => {
    console.log(`Import job ${job.id} completed!`);
    const io = getIO();
    io.emit('notification', {
        type: 'IMPORT_SUCCESS',
        message: `Import complete! ${result.count.toLocaleString()} employees added to the database.`,
    });
});

importWorker.on('failed', (job, err) => {
    console.error(`Import job ${job?.id} failed with ${err.message}`);
    const io = getIO();
    io.emit('notification', {
        type: 'IMPORT_ERROR',
        message: `Import failed: ${err.message}`,
    });
});

