import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createAppError } from '../utils/appError';

interface AdminPayload {
    adminId: string;
    iat?: number;
    exp?: number;
}

const isAdminPayload = (payload: any): payload is AdminPayload => {
    return payload && typeof payload.adminId === 'string';
}

export interface IAuthRequest extends Request {
    adminId?: string;
}

export const authentication = (req: IAuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(createAppError(401));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)

        if (!isAdminPayload(decoded)) {
            return next(createAppError(401));

        }

        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        return next(createAppError(401));
    }
};
