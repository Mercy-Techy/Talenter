import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from '../auth/auth.dto';
import { ApiResponse, ApiResponseType } from '../utility/ApiResponse';
import { FileService } from '../File/file.service';
import { WalletService } from '../wallet/wallet.service';
import { AddressService } from '../address/address.service';
import paginateFunction from '../utility/paginateFunction';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private fileService: FileService,
    private walletService: WalletService,
    private addressService: AddressService,
  ) {}

  async createUser(userData: CreateUserDto, admin: boolean = false) {
    try {
      const existingEmail = await this.userModel.findOne({
        email: userData.email,
      });
      const existingPhone = await this.userModel.findOne({
        phone: userData.phone,
      });
      if (existingEmail)
        throw new Error('A user with this email exist already');
      if (existingPhone)
        throw new Error('A user with this phone number exist already');
      const user = await this.userModel.create({
        ...userData,
        emailVerified: admin,
      });
      const walletDetails = await this.walletService.createWallet(user._id);
      const updatedUser = await this.userModel.findOneAndUpdate(
        { _id: user._id },
        { wallet: walletDetails.data._id },
        { new: true },
      );
      return ApiResponse.success(
        'User created',
        HttpStatus.CREATED,
        updatedUser,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async getUser(userIdentifier: any, selectPassword: boolean = false) {
    try {
      const select = selectPassword ? '+password' : null;
      const user = await this.userModel
        .findOne(userIdentifier)
        .select(select)
        .populate([
          {
            path: 'avatar',
            select: 'url',
          },
          {
            path: 'wallet',
            select: 'currentBalance pendingBalance',
          },
          { path: 'officialDocuments.uploads', select: 'url' },
          { path: 'utilityBills.uploads', select: 'url' },
          { path: 'workPlacePhotos.uploads', select: 'url' },
        ]);
      if (!user)
        return ApiResponse.fail(
          'User does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      return ApiResponse.success('User', HttpStatus.OK, user);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async getUsers(
    usersIdentifier: any,
    controller: boolean = false,
    page?: number,
    limit?: number,
  ) {
    if (controller) {
      return await paginateFunction(
        this.userModel,
        page,
        limit,
        [
          {
            path: 'avatar',
            select: 'url',
          },
          {
            path: 'wallet',
            select: 'currentBalance pendingBalance',
          },
          { path: 'officialDocuments.uploads', select: 'url' },
          { path: 'utilityBills.uploads', select: 'url' },
          { path: 'workPlacePhotos.uploads', select: 'url' },
        ],
        usersIdentifier,
      );
    } else {
      try {
        const users = await this.userModel.find(usersIdentifier);
        return ApiResponse.success('Users', HttpStatus.OK, users);
      } catch (error) {
        return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
      }
    }
  }
  async updateUser(_id: Types.ObjectId, update: any) {
    try {
      if (update.about) {
        const userDetails = await this.userModel.findById(_id);
        if (userDetails) {
          const updatedAbout = {
            ...userDetails.toObject()?.about,
            ...update.about,
          };
          update.about = updatedAbout;
        }
      }
      const user = await this.userModel.findOneAndUpdate({ _id }, update, {
        new: true,
      });
      if (!user)
        return ApiResponse.fail(
          'User does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      return ApiResponse.success('User Updated', HttpStatus.OK, user);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async uploadAvatar(avatar: Express.Multer.File, user: UserDocument) {
    try {
      if (!avatar)
        return ApiResponse.fail('Image is missing', HttpStatus.NOT_FOUND, null);
      if (user.avatar) {
        const editResult = await this.fileService.editFile(
          user.avatar,
          avatar,
          'image',
        );
        if (!editResult.status) return editResult;
      } else {
        const uploadResult = await this.fileService.createFiles(
          [avatar],
          user._id,
          'image',
        );
        if (!uploadResult.status) return uploadResult;
        user.avatar = uploadResult.data[0];
        await user.save();
      }
      return ApiResponse.success('Avatar Uploaded', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async verifyAccount(
    user: UserDocument,
    files: {
      workPlacePhotos?: Express.Multer.File[];
      utilityBills?: Express.Multer.File[];
      officialDocuments?: Express.Multer.File[];
    },
  ) {
    try {
      if (files?.workPlacePhotos?.length) {
        if (user?.workPlacePhotos) {
          await this.fileService.deleteFiles(user?.workPlacePhotos?.uploads);
        }
        const uploadedFiles = await this.fileService.createFiles(
          files.workPlacePhotos,
          user._id,
          'image',
        );
        if (!uploadedFiles.status) return uploadedFiles;
        user.workPlacePhotos = {
          uploads: uploadedFiles.data,
          status: 'Not Verified',
        };
      }
      if (files?.utilityBills?.length) {
        if (user?.utilityBills) {
          await this.fileService.deleteFiles(user?.utilityBills?.uploads);
        }
        const uploadedFiles = await this.fileService.createFiles(
          files.utilityBills,
          user._id,
          'image',
        );
        if (!uploadedFiles.status) return uploadedFiles;
        user.utilityBills = {
          uploads: uploadedFiles.data,
          status: 'Not Verified',
        };
      }
      if (files?.officialDocuments?.length) {
        if (user?.officialDocuments) {
          await this.fileService.deleteFiles(user?.officialDocuments?.uploads);
        }
        const uploadedFiles = await this.fileService.createFiles(
          files.officialDocuments,
          user._id,
          'image',
        );
        if (!uploadedFiles.status) return uploadedFiles;
        user.officialDocuments = {
          uploads: uploadedFiles.data,
          status: 'Not Verified',
        };
      }
      await user.save();
      //find a way of informing the admin
      return ApiResponse.success('Files Uploaded', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchArtisans(
    service: string,
    placeId?: string,
    controller: boolean = false,
    page?: number,
  ) {
    try {
      let artisans: ApiResponseType;
      const filter = service
        ? { type: 'artisan', skills: { $in: [service] } }
        : { type: 'artisan' };
      const details = await this.getUsers(filter, true, page, 20);
      if (!details.status) return details;
      if (placeId) {
        artisans = await this.addressService.fetchCloseObjects(
          placeId,
          details.data.data,
        );
      }
      if (artisans.status) {
        details.data.data = artisans.data;
      }
      if (controller) return details;
      artisans = details?.data?.data?.map((worker) => worker._id);
      return ApiResponse.success('Artisans', HttpStatus.OK, artisans);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async deleteAccount(userId: Types.ObjectId) {
    try {
      const user = await this.userModel.findOneAndDelete({ _id: userId });
      await this.walletService.deleteWallet(user.wallet);
      return ApiResponse.success('User deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async clientSearch(
    page: number,
    limit: number,
    address?: string,
    service?: string,
  ) {
    try {
      const addressRegex = new RegExp(address, 'i');
      const serviceRegex = new RegExp(service, 'i');
      let filter: any = { type: 'artisan' };
      if (address) {
        filter = {
          ...filter,
          'about.officeAddress.location': { $regex: addressRegex },
        };
      }
      if (service) {
        filter = {
          ...filter,
          skills: { $elemMatch: { $regex: serviceRegex } },
        };
      }
      return await paginateFunction(
        this.userModel,
        page,
        limit,
        {
          path: 'avatar',
          select: 'url',
        },
        filter,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async verifyUserOfficialDocument(userId: Types.ObjectId) {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        {
          'officialDocuments.status': 'verified',
          'utilityBills.status': 'verified',
          'workPlacePhotos.status': 'verified',
          status: 'active',
        },
        { new: true },
      );
      if (!user)
        return ApiResponse.fail('User does not exist', HttpStatus.OK, null);
      return ApiResponse.success('User updated', HttpStatus.OK, user);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.OK, error);
    }
  }

  async userNo(filter: any = {}) {
    return await this.userModel.countDocuments(filter);
  }
}
