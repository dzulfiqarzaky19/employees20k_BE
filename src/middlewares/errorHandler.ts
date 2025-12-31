import { NextFunction, Request, Response } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;

    if (!err.isOperational) {
        console.error('SERVER_BUG:', err);
    }

    res.status(statusCode).json({
        status: statusCode >= 500 ? 'error' : 'fail',
        message: err.message,
    });
};