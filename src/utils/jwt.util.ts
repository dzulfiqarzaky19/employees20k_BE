import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signToken = (payload: object, expiresIn: string | number = '24h') => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, env.JWT_SECRET);
};
