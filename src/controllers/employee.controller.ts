import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { createAppError } from "../utils/appError";
import { employeeQueue } from "../config/queue";
import { IAuthRequest } from "../middlewares/auth";

export const createEmployee = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, age, position, salary } = req.body;
        const userId = req.adminId;

        await employeeQueue.add('create-employee', {
            userId,
            name,
            age: parseInt(age),
            position,
            salary: parseFloat(salary),
        });

        res.status(202).json({ message: 'Employee creation is being processed' });
    } catch (error) {
        return next(createAppError(error));
    }
}

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    try {
        const where = search ? {
            OR: [
                { name: { contains: String(search), mode: 'insensitive' as const } },
                { position: { contains: String(search), mode: 'insensitive' as const } },
            ],
        } : {};

        const orderBy = [
            {
                [String(sortBy)]: order as 'asc' | 'desc'
            }, {
                id: 'asc' as const
            }
        ] as any

        const [employees, meta] = await Promise.all([
            prisma.employee.findMany({ where, skip, take, orderBy }),
            prisma.employee.aggregate({
                where,
                _count: true,
                _sum: { salary: true }
            })
        ]);

        return res.json({
            data: employees,
            meta: {
                total: meta._count || 0,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil((meta._count || 0) / Number(limit)),
                totalSalary: meta._sum?.salary || 0,
            }
        });
    } catch (error) {
        return next(createAppError(error));
    }
}

export const getEmployeeDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: {
                id,
            },
        });
        return res.json(employee);
    } catch (error) {
        return next(createAppError(error));
    }
}

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, age, position, salary } = req.body;

        const employee = await prisma.employee.update({
            where: {
                id,
            },
            data: {
                name,
                age: age ? parseInt(age, 10) : undefined,
                position,
                salary: salary ? Number(salary) : undefined,
            },
        });
        return res.json(employee);
    } catch (error) {
        return next(createAppError(error));
    }
}

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.delete({
            where: {
                id,
            },
        });
        return res.json(employee);
    } catch (error) {
        return next(createAppError(error));
    }
}
