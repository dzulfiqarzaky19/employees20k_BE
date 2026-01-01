import { PrismaClient } from '@prisma/client';
import { employeeQueue, importQueue, connection } from '../src/config/queue';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanSlate() {
    console.log('🚀 Starting clean slate reset...');

    try {
        // 1. Clear BullMQ Queues
        console.log('🧹 Clearing queues...');
        await employeeQueue.drain();
        await employeeQueue.obliterate({ force: true });
        await importQueue.drain();
        await importQueue.obliterate({ force: true });
        console.log('✅ Queues cleared.');

        // 2. Clear Database
        console.log('🗑️  Emptying Employee table...');
        await prisma.employee.deleteMany({});
        console.log('✅ Employee table emptied.');

        // 3. Ensure Admin exists
        console.log('👤 Ensuring admin user exists...');
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
        console.log('✅ Admin user ready.');

    } catch (error) {
        console.error('❌ Reset failed:', error);
    } finally {
        await prisma.$disconnect();
        await connection.quit();
        process.exit(0);
    }
}

cleanSlate();
