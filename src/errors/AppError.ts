export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const ErrorMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized Access',
    404: 'Resource Not Found',
    500: 'Internal Server Error',
};

export const PrismaErrorMap: Record<string, { status: number; message: string }> = {
    P2002: { status: 400, message: 'This unique value is already taken.' },
    P2025: { status: 404, message: 'The record you are looking for does not exist.' },
    P2003: { status: 400, message: 'This operation violates a database relationship.' },
};

export const createAppError = (input: any, message?: string) => {
    if (message && typeof input === 'number') {
        return new AppError(message, input);
    }

    if (typeof input === 'number') {
        return new AppError(ErrorMessages[input] || 'An error occurred', input);
    }

    if (input.code && PrismaErrorMap[input.code]) {
        const prismaMap = PrismaErrorMap[input.code];
        return new AppError(prismaMap.message, prismaMap.status);
    }

    if (input instanceof AppError) {
        return input;
    }

    // Default/Generic error wrapping
    const err = new AppError(input.message || 'Internal Server Error', input.statusCode || 500, input.isOperational || false);
    if (input.stack) err.stack = input.stack;
    return err;
};
