import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { createAppError } from '../utils/appError';

const upload = multer({ dest: 'uploads/' });

const uploadCSV = upload.single('file');

export const handleCSVUpload = (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];


    if (!contentType || !contentType.includes('multipart/form-data')) {
        return next(createAppError(400, "Request must be multipart/form-data"));
    }

    uploadCSV(req, res, (err) => {
        console.log(req);
        if (err) {
            if (err.message === 'Multipart: Boundary not found') {
                return next(createAppError(400, "Invalid multipart request (Boundary missing)"));
            }

            return next(createAppError(400, err.message));
        }
        next();
    });
};