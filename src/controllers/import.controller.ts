import { createAppError } from "../utils/appError";
import { NextFunction, Request, Response } from "express";

export const importCSV = async (req: Request, res: Response, next: NextFunction) => {
    try {


        const { file, body } = req;

        console.log(body)
        if (!file) {
            return next(createAppError(400));
        }

        return res.json(file);
    } catch (error) {
        return next(createAppError(error));
    }
}