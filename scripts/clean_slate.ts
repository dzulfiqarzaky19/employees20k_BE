import { PrismaClient } from '@prisma/client';
import { employeeQueue, importQueue, connection } from '../src/config/queue';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanSlate() {
    try {
        await employeeQueue.drain();
        await employeeQueue.obliterate({ force: true });
        await importQueue.drain();
        await importQueue.obliterate({ force: true });

        await prisma.employee.deleteMany({});

        const adminEmail = 'admin@admin.com';
        const adminUsername = 'admin';
        const adminPassword = 'password';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await prisma.admin.upsert({
            where: { email: adminEmail },
            update: { password: hashedPassword },
            create: {
                email: adminEmail,
                username: adminUsername,
                password: hashedPassword,
            },
        });

    } catch (error) {
        console.error('Reset failed:', error);
    } finally {
        await prisma.$disconnect();
        await connection.quit();
        process.exit(0);
    }
}

cleanSlate();
