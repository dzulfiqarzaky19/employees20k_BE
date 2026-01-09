import { createAppError } from "../utils/appError";
import { NextFunction, Response } from "express";
import { IAuthRequest } from "../middlewares/auth";
import { importQueue } from "../config/queue";

export const importCSV = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
        const { file } = req;

        if (!file) {
            return next(createAppError(400));
        }

        const filePath = file.path;
        const userId = req.adminId;

        await importQueue.add('import-queue', { filePath, userId });

        res.status(202).json({
            message: 'CSV import started. You will receive real-time updates.',
            fileId: file?.filename
        });
    } catch (error) {
        return next(createAppError(error));
    }
}