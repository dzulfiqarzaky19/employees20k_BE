import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAuthRequest } from '../middlewares/auth';
import { createAppError } from '../utils/appError';

const admin = {
    id: 1,
    password: '$2b$10$lG4JwNaWbWJTB16JMgPwVOT5SIDWaU.cj7hEWiBXt9krWhu.BA.T6',
    username: 'admin'
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;

        const passwordHash = await bcrypt.hash(password, 10);

        const isMatch = await bcrypt.compare(password, admin.password);

        console.log(password, admin.password, passwordHash)

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
    }
}

export const getMe = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {

        const adminId = req.adminId;

        return res.json({
            id: admin.id,
            username: admin.username
        });
    } catch (error) {
        return next(createAppError(500))
    }
}