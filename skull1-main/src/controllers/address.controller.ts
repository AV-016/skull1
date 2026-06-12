import { Request, Response, NextFunction } from 'express';
import { AddressService } from '../services/address.service';

const addressService = new AddressService();

export class AddressController {
  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const addresses = await addressService.getAddresses(userId);
      res.status(200).json({
        success: true,
        message: 'Addresses retrieved successfully',
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const address = await addressService.createAddress(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAddressById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const addressId = req.params.id;
      const address = await addressService.getAddressById(userId, addressId);
      res.status(200).json({
        success: true,
        message: 'Address retrieved successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const addressId = req.params.id;
      const address = await addressService.updateAddress(userId, addressId, req.body);
      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const addressId = req.params.id;
      await addressService.deleteAddress(userId, addressId);
      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const addressId = req.params.id;
      const address = await addressService.setDefaultAddress(userId, addressId);
      res.status(200).json({
        success: true,
        message: 'Default address updated successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AddressController;
