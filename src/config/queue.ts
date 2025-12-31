import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const employeeQueue = new Queue('employee-queue', { connection });
export const importQueue = new Queue('import-queue', { connection });

export { connection };
