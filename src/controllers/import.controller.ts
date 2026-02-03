import { createAppError } from "../errors/AppError";
import { NextFunction, Response } from "express";
import { ImportService } from "../services/import.service";
import { IAuthRequest } from "../middleware/auth.middleware";

const importService = new ImportService();

export const importCSV = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
        const { file } = req;

        if (!file) {
            return next(createAppError(400, 'File not provided'));
        }

        const userId = req.adminId;

        const result = await importService.queueImport({
            filePath: file.path,
            userId,
            filename: file.filename
        });

        res.status(202).json(result);
    } catch (error) {
        return next(error);
    }
}