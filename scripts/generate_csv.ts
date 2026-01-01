import fs from 'fs';
import path from 'path';

const generateLargeCSV = (rowCount: number) => {
    const filePath = path.join(__dirname, 'large_employees.csv');
    const writer = fs.createWriteStream(filePath);
    writer.write('name,age,position,salary\n');

    for (let i = 1; i <= rowCount; i++) {
        const name = `Employee ${i}`;
        const age = Math.floor(Math.random() * 40) + 20;
        const positions = ['Software Engineer', 'QA Engineer', 'Product Manager', 'Designer', 'HR Specialist'];
        const position = positions[Math.floor(Math.random() * positions.length)];
        const salary = Math.floor(Math.random() * 20000000) + 5000000;
        writer.write(`${name},${age},${position},${salary}\n`);
    }

    writer.end();
    console.log(`Generated ${rowCount} rows in ${filePath}`);
};

const rowCount = parseInt(process.argv[2]) || 20000;
generateLargeCSV(rowCount);
