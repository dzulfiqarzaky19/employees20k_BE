import { importQueue } from "../config/queue";

export class ImportService {
    async queueImport(data: any) {
        const { filePath, userId, filename } = data;

        await importQueue.add('import-queue', { filePath, userId });

        return {
            message: 'CSV import started. You will receive real-time updates.',
            fileId: filename
        };
    }
}
