import { Queue, DefaultJobOptions } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const defaultJobOptions: DefaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: true,
};

export const employeeQueue = new Queue('employee-queue', { connection, defaultJobOptions });
export const importQueue = new Queue('import-queue', { connection, defaultJobOptions });

export { connection };
