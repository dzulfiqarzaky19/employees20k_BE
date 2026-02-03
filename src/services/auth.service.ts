import { AuthRepository } from '../repositories/auth.repository';
import { createAppError } from '../errors/AppError';
import { LoginDto } from '../dtos/login.dto';
import { comparePassword } from '../utils/hash.util';
import { signToken } from '../utils/jwt.util';

export class AuthService {
    private authRepository: AuthRepository;

    constructor() {
        this.authRepository = new AuthRepository();
    }

    async login(data: LoginDto) {
        const { loginIdentifier, password } = data;

        const admin = await this.authRepository.findAdminByUsernameOrEmail(loginIdentifier);

        if (!admin) {
            throw createAppError(401, 'Invalid credentials');
        }

        const isMatch = await comparePassword(password, admin.password);

        if (!isMatch) {
            throw createAppError(401, 'Invalid credentials');
        }

        const token = signToken({ adminId: admin.id });

        return { token };
    }

    async getMe(adminId: string) {
        const admin = await this.authRepository.findAdminById(adminId);

        if (!admin) {
            throw createAppError(401, 'User not found');
        }

        return {
            id: admin.id,
            username: admin.username,
            email: admin.email
        };
    }
}
