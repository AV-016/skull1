import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/error.middleware';
import MESSAGES from '../constants/messages';
import { formatUserProfile, UserProfileDTO } from '../dto/user.dto';
import { prisma } from '../config/database';

const userRepository = new UserRepository();

export class UserService {
  async getProfile(userId: string): Promise<UserProfileDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, MESSAGES.AUTH.USER_NOT_FOUND);
    }
    return formatUserProfile(user);
  }

  async updateProfile(userId: string, data: any): Promise<UserProfileDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, MESSAGES.AUTH.USER_NOT_FOUND);
    }

    const updatedUser = await userRepository.update(userId, {
      name: data.name,
      email: data.email, // in production we might verify email change
    });

    return formatUserProfile(updatedUser);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, MESSAGES.AUTH.USER_NOT_FOUND);
    }
    await userRepository.delete(userId);
  }

  async getUserDashboard(userId: string): Promise<any> {
    const [ordersCount, reviewsCount, customRequestsCount] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.customRequest.count({ where: { userId } }),
    ]);

    return {
      ordersCount,
      reviewsCount,
      customRequestsCount,
    };
  }

  async getUserActivity(userId: string): Promise<any> {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

export default UserService;
