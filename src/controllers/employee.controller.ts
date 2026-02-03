import { NextFunction, Request, Response } from "express";
import { EmployeeService } from "../services/employee.service";
import { createAppError } from "../errors/AppError";
import { IAuthRequest } from "../middleware/auth.middleware";

const employeeService = new EmployeeService();

export const createEmployee = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.adminId;
        const result = await employeeService.queueCreation(userId, req.body);
        res.status(202).json(result);
    } catch (error) {
        return next(error);
    }
}

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await employeeService.getEmployees(req.query);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
}

export const getEmployeeDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.getEmployee(id);
        if (!employee) {
            return next(createAppError(404, 'Employee not found'));
        }
        return res.json(employee);
    } catch (error) {
        return next(error);
    }
}

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.updateEmployee(id, req.body);
        return res.json(employee);
    } catch (error) {
        return next(error);
    }
}

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.deleteEmployee(id);
        return res.json(employee);
    } catch (error) {
        return next(error);
    }
}
