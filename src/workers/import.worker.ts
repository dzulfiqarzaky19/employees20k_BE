import { Worker, Job } from 'bullmq';
import fs from 'fs';
import { connection } from '../config/queue';
import prisma from '../config/prisma';
import { getIO } from '../config/socket';
import { parse } from 'csv-parse';

export const importWorker = new Worker(
    'import-queue',
    async (job: Job) => {
        const { filePath, userId } = job.data;
        const io = getIO();
        let count = 0;
        let batch: any[] = [];
        const BATCH_SIZE = 1000;

        try {
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

                    io.emit('import-progress', {
                        progress: Math.min(Math.round((count / total) * 100), 99),
                        count
                    });
                }
            }

            if (batch.length > 0) {
                await prisma.employee.createMany({ data: batch });
                count += batch.length;
            }

            io.emit('import-progress', { progress: 100, count });

            io.emit('notification', {
                type: 'IMPORT_SUCCESS',
                message: `Import complete! ${count.toLocaleString()} employees added to the database.`,
            });

        } catch (error: any) {
            io.emit('notification', {
                type: 'IMPORT_ERROR',
                message: `Import failed: ${error.message}`,
            });

            throw error;
        } finally {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up file: ${filePath}`);
            }
        }

        return { count };
    },
    { connection }
);
