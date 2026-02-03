import prisma from "../config/database";

export class AuthRepository {
    async findAdminByUsernameOrEmail(identifier: string) {
        return prisma.admin.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            }
        });
    }

    async findAdminById(id: string) {
        return prisma.admin.findUnique({
            where: {
                id: id
            }
        });
    }
}
