import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Service } from './service.schema';
import { Model, Types } from 'mongoose';
import { ApiResponse } from '../utility/ApiResponse';
import paginateFunction from '../utility/paginateFunction';
import { Skill } from './skill.schema';
import { FileService } from '../File/file.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
    @InjectModel(Skill.name) private skillModel: Model<Service>,
    private fileService: FileService,
  ) {}
  async fetchServices(page?: number, limit?: number) {
    return await paginateFunction(this.serviceModel, page, limit, {
      path: 'image',
      select: 'url',
    });
  }
  async fetchService(filter: any) {
    try {
      const service = await this.serviceModel
        .findOne(filter)
        .populate({ path: 'image', select: 'url' });
      if (!service) throw new Error('Service does not exist');
      return ApiResponse.success('Services', HttpStatus.OK, service);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async addService(
    title: string,
    image: Express.Multer.File,
    userId: Types.ObjectId,
  ) {
    try {
      const existingService = await this.serviceModel.findOne({ title });
      if (existingService) throw new Error('Service exist already');
      if (!image) throw new Error('Image was not uploaded');
      if (title.length < 3) throw new Error('Invalid service title');
      const file = await this.fileService.createFiles([image], userId, 'image');
      if (!file.status) return file;
      const service = await this.serviceModel.create({
        title,
        image: file.data[0],
      });
      const imageDetails = (await this.fileService.fetchFiles(file.data))
        .data[0];
      return ApiResponse.success('Service created', HttpStatus.OK, {
        ...service.toObject(),
        image: { _id: imageDetails._id, url: imageDetails.url },
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async deleteService(serviceId: Types.ObjectId) {
    try {
      const service = await this.serviceModel.findOneAndDelete({
        _id: serviceId,
      });
      if (!service)
        return ApiResponse.fail(
          'Service does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      await this.fileService.deleteFiles([service.image]);
      return ApiResponse.success('Service deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async editService(
    serviceId: Types.ObjectId,
    image?: Express.Multer.File,
    title?: string,
  ) {
    try {
      const service = await this.serviceModel.findById(serviceId);
      if (!service)
        return ApiResponse.fail(
          'Service does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      let file;
      if (image) {
        file = await this.fileService.editFile(service.image, image, 'image');
        if (!file.status) return file;
        service.image = file.data;
      }
      service.title = title || service.title;
      await service.save();
      return ApiResponse.success('Service updated');
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchServiceImages() {
    try {
      const services = await this.serviceModel
        .find()
        .populate({ path: 'image', select: 'url' })
        .select('image');
      return ApiResponse.success('Services url', HttpStatus.OK, services);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async addSkill(title: string) {
    try {
      const existingSkill = await this.skillModel.findOne({ title });
      if (existingSkill) throw new Error('Skill exist already');
      if (title.length < 3) throw new Error('Invalid skill title');
      const skill = await this.skillModel.create({ title });
      return ApiResponse.success('Skill created', HttpStatus.OK, skill);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async fetchSkills(page?: number, limit?: number) {
    return await paginateFunction(this.skillModel, page, limit);
  }

  async deleteSkill(skillId: Types.ObjectId) {
    try {
      await this.skillModel.deleteOne({ _id: skillId });
      return ApiResponse.success('Skill deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
