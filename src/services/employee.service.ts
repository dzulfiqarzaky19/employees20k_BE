import { EmployeeRepository } from '../repositories/employee.repository';
// import { employeeQueue } from '../config/queue'; // Assuming queue config exists or needs migration too. 
// Note: original code imported employeeQueue from '../config/queue'. I should verify if that file exists or needs moving.
// Based on file introspection it was in src/config/queue.ts. 
// I will keep the import for now, assuming config folder structure.

import { employeeQueue } from '../config/queue';

export class EmployeeService {
    private employeeRepository: EmployeeRepository;

    constructor() {
        this.employeeRepository = new EmployeeRepository();
    }

    async queueCreation(userId: any, data: any) {
        // Business logic for queuing
        await employeeQueue.add('create-employee', {
            userId,
            name: data.name,
            age: parseInt(data.age),
            position: data.position,
            salary: parseFloat(data.salary),
        });
        return { message: 'Employee creation is being processed' };
    }

    async getEmployees(query: any) {
        const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where = search ? {
            OR: [
                { name: { contains: String(search), mode: 'insensitive' as const } },
                { position: { contains: String(search), mode: 'insensitive' as const } },
            ],
        } : {};

        const [employees, meta, uniquePosition] = await Promise.all([
            this.employeeRepository.findAll(where, skip, take, String(sortBy), order as 'asc' | 'desc'),
            this.employeeRepository.aggregate(where),
            this.employeeRepository.groupByPosition(where)
        ]);

        return {
            data: employees,
            meta: {
                total: meta._count || 0,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil((meta._count || 0) / Number(limit)),
                totalSalary: meta._sum?.salary || 0,
                totalDepartement: uniquePosition?.length || 0,
            }
        };
    }

    async getEmployee(id: string) {
        return this.employeeRepository.findById(id);
    }

    async updateEmployee(id: string, data: any) {
        // Logic to parse numbers
        const updateData = {
            name: data.name,
            age: data.age ? parseInt(data.age, 10) : undefined,
            position: data.position,
            salary: data.salary ? Number(data.salary) : undefined,
        };
        // Remove undefined keys
        Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);

        return this.employeeRepository.update(id, updateData);
    }

    async deleteEmployee(id: string) {
        return this.employeeRepository.delete(id);
    }
}
