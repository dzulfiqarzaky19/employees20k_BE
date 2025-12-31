import { Worker, Job } from 'bullmq';
import { connection } from '../config/queue';
import prisma from '../config/prisma';
import { getIO } from '../config/socket';

export const employeeWorker = new Worker(
    'employee-queue',
    async (job: Job) => {
        const io = getIO();

        const { userId, name, age, position, salary } = job.data;

        console.log(`Processing job ${job.id}: Create employee ${job.data.name}`);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const employee = await prisma.employee.create({
            data: {
                name,
                age,
                position,
                salary,
            },
        });


        io.to(userId).emit('notification', {
            type: 'EMPLOYEE_CREATED',
            message: `Employee ${employee.name} has been successfully added.`,
            data: employee,
        });

        return employee;
    },
    { connection }
);

employeeWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

employeeWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
});
