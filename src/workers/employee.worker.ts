import { Worker, Job } from 'bullmq';
import { connection } from '../config/queue';
import prisma from '../config/database';
import { getIO } from '../config/socket';

export const employeeWorker = new Worker(
    'employee-queue',
    async (job: Job) => {
        const { name, age, position, salary } = job.data;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const employee = await prisma.employee.create({
            data: {
                name,
                age,
                position,
                salary,
            },
        });

        return employee;
    },
    { connection }
);

employeeWorker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed!`);
    const io = getIO();
    io.emit('notification', {
        type: 'EMPLOYEE_CREATED',
        message: `Employee ${result.name} has been successfully added.`,
        data: result,
    });

});

employeeWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
    const io = getIO();
    io.emit('notification', {
        type: 'EMPLOYEE_ERROR',
        message: `Failed to create employee ${job?.data.name}: ${err.message}`,
    });
});
