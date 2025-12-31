import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { createAppError } from "../utils/appError";

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, age, position, salary } = req.body;

        const employee = await prisma.employee.create({
            data: {
                name,
                age: parseInt(age, 10),
                position,
                salary: Number(salary),
            },
        });

        return res.json(employee);
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

        console.log(id)
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
