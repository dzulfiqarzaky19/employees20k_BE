import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

jest.mock('../config/prisma', () => ({
    __esModule: true,
    default: {
        admin: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

import prisma from '../config/prisma';
import authRoutes from '../routes/auth.routes';
import { authentication } from '../middlewares/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const middlewareApp = express();
middlewareApp.use(express.json());
middlewareApp.get('/protected', authentication, (req: any, res) => {
    res.json({ adminId: req.adminId, adminEmail: req.adminEmail });
});

describe('Authentication Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
    });

    describe('POST /api/auth/login - Login', () => {
        it('should return token for valid credentials with username', async () => {
            const mockAdmin = {
                id: 'admin_123',
                username: 'admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('password', 10),
            };

            (prisma.admin.findFirst as jest.Mock).mockResolvedValue(mockAdmin);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    loginIdentifier: 'admin',
                    password: 'password',
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(prisma.admin.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { username: 'admin' },
                        { email: 'admin' },
                    ],
                },
            });

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as any;
            expect(decoded.adminId).toBe('admin_123');
        });

        it('should return token for valid credentials with email', async () => {
            const mockAdmin = {
                id: 'admin_456',
                username: 'admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('password123', 10),
            };

            (prisma.admin.findFirst as jest.Mock).mockResolvedValue(mockAdmin);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    loginIdentifier: 'admin@example.com',
                    password: 'password123',
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(prisma.admin.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { username: 'admin@example.com' },
                        { email: 'admin@example.com' },
                    ],
                },
            });
        });

        it('should fail for invalid credentials (wrong password)', async () => {
            const mockAdmin = {
                id: 'admin_123',
                username: 'admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('correctpassword', 10),
            };

            (prisma.admin.findFirst as jest.Mock).mockResolvedValue(mockAdmin);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    loginIdentifier: 'admin',
                    password: 'wrongpassword',
                });

            expect(res.status).toBe(401);
        });

        it('should fail for non-existent user', async () => {
            (prisma.admin.findFirst as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    loginIdentifier: 'nonexistent',
                    password: 'password',
                });

            expect(res.status).toBe(401);
        });

        it('should verify JWT token structure and expiration', async () => {
            const mockAdmin = {
                id: 'admin_789',
                username: 'testuser',
                email: 'test@example.com',
                password: await bcrypt.hash('testpass', 10),
            };

            (prisma.admin.findFirst as jest.Mock).mockResolvedValue(mockAdmin);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    loginIdentifier: 'testuser',
                    password: 'testpass',
                });

            expect(res.status).toBe(200);

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as any;
            expect(decoded.adminId).toBe('admin_789');
            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();

            const expiresIn = decoded.exp - decoded.iat;
            expect(expiresIn).toBe(86400);
        });
    });

    describe('GET /api/auth/me - Get Current User', () => {
        it('should return admin profile for valid token', async () => {
            const mockAdmin = {
                id: 'admin_123',
                username: 'admin',
                email: 'admin@example.com',
                password: 'hashedpassword',
            };

            (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);

            const token = jwt.sign({ adminId: 'admin_123' }, process.env.JWT_SECRET!, { expiresIn: '24h' });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                id: 'admin_123',
                username: 'admin',
                email: 'admin@example.com',
            });
            expect(res.body).not.toHaveProperty('password');
        });

        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
        });

        it('should fail with missing authorization header', async () => {
            const res = await request(app).get('/api/auth/me');

            expect(res.status).toBe(401);
        });

        it('should fail for non-existent admin', async () => {
            (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

            const token = jwt.sign({ adminId: 'nonexistent' }, process.env.JWT_SECRET!, { expiresIn: '24h' });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(401);
        });
    });

    describe('Authentication Middleware', () => {
        it('should allow access with valid token', async () => {
            const token = jwt.sign(
                { adminId: 'admin_123', adminEmail: 'admin@example.com' },
                process.env.JWT_SECRET!,
                { expiresIn: '24h' }
            );

            const res = await request(middlewareApp)
                .get('/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                adminId: 'admin_123',
                adminEmail: 'admin@example.com',
            });
        });

        it('should reject request with missing authorization header', async () => {
            const res = await request(middlewareApp).get('/protected');

            expect(res.status).toBe(401);
        });

        it('should reject request with invalid token format', async () => {
            const res = await request(middlewareApp)
                .get('/protected')
                .set('Authorization', 'InvalidFormat token123');

            expect(res.status).toBe(401);
        });

        it('should reject request with malformed token', async () => {
            const res = await request(middlewareApp)
                .get('/protected')
                .set('Authorization', 'Bearer malformed.token.here');

            expect(res.status).toBe(401);
        });

        it('should reject expired token', async () => {
            const expiredToken = jwt.sign(
                { adminId: 'admin_123', adminEmail: 'admin@example.com' },
                process.env.JWT_SECRET!,
                { expiresIn: '-1h' }
            );

            const res = await request(middlewareApp)
                .get('/protected')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(res.status).toBe(401);
        });

        it('should reject token with invalid payload structure', async () => {
            const invalidToken = jwt.sign(
                { userId: 'user_123' },
                process.env.JWT_SECRET!,
                { expiresIn: '24h' }
            );

            const res = await request(middlewareApp)
                .get('/protected')
                .set('Authorization', `Bearer ${invalidToken}`);

            expect(res.status).toBe(401);
        });
    });
});
