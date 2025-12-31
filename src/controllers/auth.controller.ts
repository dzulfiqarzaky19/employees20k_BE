import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAuthRequest } from '../middlewares/auth';
import { createAppError } from '../utils/appError';
import prisma from '../config/prisma';


export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { loginIdentifier, password } = req.body;


        const admin = await prisma.admin.findFirst({
            where: {
                OR: [
                    { username: loginIdentifier },
                    { email: loginIdentifier }
                ]
            }
        });


        if (!admin) {
            return next(createAppError(401))
        }

        const isMatch = await bcrypt.compare(password, admin.password);


        if (!isMatch) {
            return next(createAppError(401))
        }

        const token = jwt.sign(
            { adminId: admin.id },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        return res.json({ token });
    } catch (error) {
        return next(createAppError(error))
    }
}

export const getMe = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {

        const adminId = req.adminId;

        const admin = await prisma.admin.findUnique({
            where: {
                id: adminId
            }
        });

        if (!admin) {
            return next(createAppError(401))
        }

        return res.json({
            id: admin.id,
            username: admin.username,
            email: admin.email
        });
    } catch (error) {
        return next(createAppError(error))
    }
}