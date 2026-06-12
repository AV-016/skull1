import { prisma } from '../config/database';
import { Address } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

export class AddressService {
  async getAddresses(userId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(userId: string, data: any): Promise<Address> {
    return prisma.$transaction(async (tx) => {
      // If setting this address as default, turn off default on other addresses
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      // Check if this is the first address, set default automatically
      const count = await tx.address.count({ where: { userId } });
      const isDefault = count === 0 ? true : !!data.isDefault;

      return tx.address.create({
        data: {
          userId,
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          isDefault,
        },
      });
    });
  }

  async getAddressById(userId: string, id: string): Promise<Address> {
    const address = await prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new AppError(404, 'Address not found');
    }
    return address;
  }

  async updateAddress(userId: string, id: string, data: any): Promise<Address> {
    // Verify ownership
    await this.getAddressById(userId, id);

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data,
      });
    });
  }

  async deleteAddress(userId: string, id: string): Promise<void> {
    // Verify ownership
    const address = await this.getAddressById(userId, id);

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id },
      });

      // If we deleted the default address, set another one as default
      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId },
        });
        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }

  async setDefaultAddress(userId: string, id: string): Promise<Address> {
    await this.getAddressById(userId, id);

    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }
}

export default AddressService;
