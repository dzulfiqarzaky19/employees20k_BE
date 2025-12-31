import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const employeeQueue = new Queue('employee-queue', { connection });
export const importQueue = new Queue('import-queue', { connection });

// Debugging: Listen for the actual connection event
connection.on('connect', () => {
    console.log('✅ Redis connected successfully via Docker');
});

connection.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
});

export { connection };
