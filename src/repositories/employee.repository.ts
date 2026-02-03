import prisma from "../config/database";

export class EmployeeRepository {
    async create(data: any) {
        return prisma.employee.create({ data });
    }

    async findAll(where: any, skip: number, take: number, sortBy: string, order: 'asc' | 'desc') {
        return prisma.employee.findMany({
            where,
            skip,
            take,
            orderBy: [
                { [sortBy]: order },
                { id: 'asc' }
            ]
        });
    }

    async count(where: any) {
        return prisma.employee.count({ where });
    }

    async aggregate(where: any) {
        return prisma.employee.aggregate({
            where,
            _count: true,
            _sum: { salary: true }
        });
    }

    async groupByPosition(where: any) {
        return prisma.employee.groupBy({
            by: ['position'],
            where,
            _count: true,
        });
    }

    async findById(id: string) {
        return prisma.employee.findUnique({ where: { id } });
    }

    async update(id: string, data: any) {
        return prisma.employee.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.employee.delete({ where: { id } });
    }
}
