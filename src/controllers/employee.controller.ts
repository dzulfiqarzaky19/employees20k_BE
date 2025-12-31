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
    try {
        const employees = await prisma.employee.findMany();
        return res.json(employees);
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
