import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { createAppError } from '../errors/AppError'; // Updated import path
import { IAuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.login(req.body);
        return res.json(result);
    } catch (error) {
        return next(error); // Pass the error directly, AppError logic handles it or middleware
    }
}

export const getMe = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
        const adminId = req.adminId;
        if (!adminId) { // extra safety
            return next(createAppError(401, 'Unauthorized'));
        }

        const result = await authService.getMe(adminId);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
}