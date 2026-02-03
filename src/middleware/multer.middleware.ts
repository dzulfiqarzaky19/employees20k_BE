import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { createAppError } from '../errors/AppError';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({ storage });

const uploadCSV = upload.single('file');

export const handleCSVUpload = (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];


    if (!contentType || !contentType.includes('multipart/form-data')) {
        return next(createAppError(400, "Request must be multipart/form-data"));
    }

    uploadCSV(req, res, (err) => {
        if (err) {
            if (err.message === 'Multipart: Boundary not found') {
                return next(createAppError(400, "Invalid multipart request (Boundary missing)"));
            }

            return next(createAppError(400, err.message));
        }
        next();
    });
};