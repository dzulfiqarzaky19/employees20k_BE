
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

export const createAppError = (input: any) => {
    if (typeof input === 'number') {
        return {
            statusCode: input,
            message: ErrorMessages[input] || 'An error occurred',
            isOperational: true,
        };
    }

    if (input.code && PrismaErrorMap[input.code]) {
        const prismaMap = PrismaErrorMap[input.code];
        return {
            statusCode: prismaMap.status,
            message: prismaMap.message,
            isOperational: true,
            stack: input.stack,
        };
    }

    return {
        statusCode: input.statusCode || 500,
        message: input.message || 'Internal Server Error',
        isOperational: input.isOperational || false,
        stack: input.stack,
    };
};