import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEmployees(rowCount: number = 20000) {
    const startTime = Date.now();

    const positions = ['Software Engineer', 'QA Engineer', 'Product Manager', 'Designer', 'HR Specialist', 'DevOps', 'Data Scientist', 'Project Manager', 'Marketing', 'Sales'];

    const employees = Array.from({ length: rowCount }).map((_, i) => ({
        name: `Employee ${i + 1}`,
        age: Math.floor(Math.random() * 45) + 20,
        position: positions[Math.floor(Math.random() * positions.length)],
        salary: Math.floor(Math.random() * 20000000) + 5000000,
    }));

    const chunkSize = 5000;
    let totalCreated = 0;

    try {
        for (let i = 0; i < employees.length; i += chunkSize) {
            const chunk = employees.slice(i, i + chunkSize);
            const result = await prisma.employee.createMany({
                data: chunk,
                skipDuplicates: true,
            });
            totalCreated += result.count;
            console.log(`Inserted chunk ${i / chunkSize + 1} (${totalCreated}/${rowCount})`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`Successfully seeded ${totalCreated} employees in ${duration}s!`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

const count = parseInt(process.argv[2]) || 20000;
seedEmployees(count);
