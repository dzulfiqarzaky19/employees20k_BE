import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma before importing anything else
jest.mock('../config/prisma', () => ({
    __esModule: true,
    default: {
        employee: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
        },
    },
}));

// Mock the queue
jest.mock('../config/queue', () => ({
    employeeQueue: {
        add: jest.fn().mockResolvedValue({ id: 'job_123' }),
    },
    connection: {},
}));

// Mock authentication middleware
jest.mock('../middlewares/auth', () => ({
    authentication: (req: any, res: any, next: any) => {
        req.adminId = 'admin_123';
        next();
    },
    IAuthRequest: {},
}));

import prisma from '../config/prisma';
import { employeeQueue } from '../config/queue';
import employeeRoutes from '../routes/employee.routes';

const app = express();
app.use(express.json());
app.use('/api/employees', employeeRoutes);

describe('Employee CRUD Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/employees - Create Employee', () => {
        it('should add job to queue and return 202 status', async () => {
            const employeeData = {
                name: 'John Doe',
                age: '30',
                position: 'Software Engineer',
                salary: '75000',
            };

            const res = await request(app)
                .post('/api/employees')
                .send(employeeData);

            expect(res.status).toBe(202);
            expect(res.body).toHaveProperty('message', 'Employee creation is being processed');
            expect(employeeQueue.add).toHaveBeenCalledWith('create-employee', {
                userId: 'admin_123',
                name: 'John Doe',
                age: 30,
                position: 'Software Engineer',
                salary: 75000,
            });
        });

        it('should parse age and salary correctly', async () => {
            const employeeData = {
                name: 'Jane Smith',
                age: '25',
                position: 'Designer',
                salary: '60000.50',
            };

            await request(app)
                .post('/api/employees')
                .send(employeeData);

            expect(employeeQueue.add).toHaveBeenCalledWith('create-employee', {
                userId: 'admin_123',
                name: 'Jane Smith',
                age: 25,
                position: 'Designer',
                salary: 60000.50,
            });
        });
    });

    describe('GET /api/employees - List Employees', () => {
        it('should return paginated employees with metadata', async () => {
            const mockEmployees = [
                { id: '1', name: 'John Doe', age: 30, position: 'Engineer', salary: 75000, createdAt: new Date() },
                { id: '2', name: 'Jane Smith', age: 25, position: 'Designer', salary: 60000, createdAt: new Date() },
            ];

            const mockAggregate = {
                _count: 10,
                _sum: { salary: 650000 },
            };

            (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
            (prisma.employee.aggregate as jest.Mock).mockResolvedValue(mockAggregate);

            const res = await request(app)
                .get('/api/employees')
                .query({ page: 1, limit: 10 });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0]).toMatchObject({
                id: '1',
                name: 'John Doe',
                age: 30,
                position: 'Engineer',
                salary: 75000,
            });
            expect(res.body.meta).toEqual({
                total: 10,
                page: 1,
                limit: 10,
                totalPages: 1,
                totalSalary: 650000,
            });
        });

        it('should handle search query', async () => {
            const mockEmployees = [
                { id: '1', name: 'John Doe', age: 30, position: 'Engineer', salary: 75000, createdAt: new Date() },
            ];

            (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
            (prisma.employee.aggregate as jest.Mock).mockResolvedValue({
                _count: 1,
                _sum: { salary: 75000 },
            });

            const res = await request(app)
                .get('/api/employees')
                .query({ search: 'John' });

            expect(res.status).toBe(200);
            expect(prisma.employee.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: 'John', mode: 'insensitive' } },
                        { position: { contains: 'John', mode: 'insensitive' } },
                    ],
                },
                skip: 0,
                take: 10,
                orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            });
        });

        it('should handle sorting parameters', async () => {
            (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.employee.aggregate as jest.Mock).mockResolvedValue({
                _count: 0,
                _sum: { salary: null },
            });

            await request(app)
                .get('/api/employees')
                .query({ sortBy: 'name', order: 'asc' });

            expect(prisma.employee.findMany).toHaveBeenCalledWith({
                where: {},
                skip: 0,
                take: 10,
                orderBy: [{ name: 'asc' }, { id: 'asc' }],
            });
        });

        it('should handle pagination correctly', async () => {
            (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.employee.aggregate as jest.Mock).mockResolvedValue({
                _count: 50,
                _sum: { salary: 1000000 },
            });

            const res = await request(app)
                .get('/api/employees')
                .query({ page: 3, limit: 20 });

            expect(res.body.meta).toEqual({
                total: 50,
                page: 3,
                limit: 20,
                totalPages: 3,
                totalSalary: 1000000,
            });

            expect(prisma.employee.findMany).toHaveBeenCalledWith({
                where: {},
                skip: 40, 
                take: 20,
                orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            });
        });

        it('should handle empty results', async () => {
            (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.employee.aggregate as jest.Mock).mockResolvedValue({
                _count: 0,
                _sum: { salary: null },
            });

            const res = await request(app).get('/api/employees');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
            expect(res.body.meta.total).toBe(0);
        });
    });

    describe('GET /api/employees/:id - Get Employee Detail', () => {
        it('should return employee by ID', async () => {
            const mockEmployee = {
                id: '123',
                name: 'John Doe',
                age: 30,
                position: 'Engineer',
                salary: 75000,
                createdAt: new Date(),
            };

            (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployee);

            const res = await request(app).get('/api/employees/123');

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: '123',
                name: 'John Doe',
                age: 30,
                position: 'Engineer',
                salary: 75000,
            });
            expect(prisma.employee.findUnique).toHaveBeenCalledWith({
                where: { id: '123' },
            });
        });

        it('should return null for non-existent employee', async () => {
            (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

            const res = await request(app).get('/api/employees/999');

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });
    });

    describe('PATCH /api/employees/:id - Update Employee', () => {
        it('should update employee fields', async () => {
            const updatedEmployee = {
                id: '123',
                name: 'John Updated',
                age: 31,
                position: 'Senior Engineer',
                salary: 85000,
                createdAt: new Date(),
            };

            (prisma.employee.update as jest.Mock).mockResolvedValue(updatedEmployee);

            const res = await request(app)
                .patch('/api/employees/123')
                .send({
                    name: 'John Updated',
                    age: '31',
                    position: 'Senior Engineer',
                    salary: '85000',
                });

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: '123',
                name: 'John Updated',
                age: 31,
                position: 'Senior Engineer',
                salary: 85000,
            });
            expect(prisma.employee.update).toHaveBeenCalledWith({
                where: { id: '123' },
                data: {
                    name: 'John Updated',
                    age: 31,
                    position: 'Senior Engineer',
                    salary: 85000,
                },
            });
        });

        it('should handle partial updates', async () => {
            const updatedEmployee = {
                id: '123',
                name: 'John Doe',
                age: 30,
                position: 'Senior Engineer',
                salary: 75000,
                createdAt: new Date(),
            };

            (prisma.employee.update as jest.Mock).mockResolvedValue(updatedEmployee);

            const res = await request(app)
                .patch('/api/employees/123')
                .send({ position: 'Senior Engineer' });

            expect(res.status).toBe(200);
            expect(prisma.employee.update).toHaveBeenCalledWith({
                where: { id: '123' },
                data: {
                    name: undefined,
                    age: undefined,
                    position: 'Senior Engineer',
                    salary: undefined,
                },
            });
        });

        it('should parse numeric fields correctly', async () => {
            (prisma.employee.update as jest.Mock).mockResolvedValue({});

            await request(app)
                .patch('/api/employees/123')
                .send({
                    age: '35',
                    salary: '95000.75',
                });

            expect(prisma.employee.update).toHaveBeenCalledWith({
                where: { id: '123' },
                data: {
                    name: undefined,
                    age: 35,
                    position: undefined,
                    salary: 95000.75,
                },
            });
        });
    });

    describe('DELETE /api/employees/:id - Delete Employee', () => {
        it('should delete employee by ID', async () => {
            const deletedEmployee = {
                id: '123',
                name: 'John Doe',
                age: 30,
                position: 'Engineer',
                salary: 75000,
                createdAt: new Date(),
            };

            (prisma.employee.delete as jest.Mock).mockResolvedValue(deletedEmployee);

            const res = await request(app).delete('/api/employees/123');

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: '123',
                name: 'John Doe',
                age: 30,
                position: 'Engineer',
                salary: 75000,
            });
            expect(prisma.employee.delete).toHaveBeenCalledWith({
                where: { id: '123' },
            });
        });

        it('should handle deletion of non-existent employee', async () => {
            const error = new Error('Record not found');
            (prisma.employee.delete as jest.Mock).mockRejectedValue(error);

            const res = await request(app).delete('/api/employees/999');

            expect(res.status).toBe(500);
        });
    });
});
