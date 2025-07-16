import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Service } from '../services/service.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
@ValidatorConstraint({ name: 'IsService', async: true })
export class IsService implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
  ) {}
  async validate(serviceArray: string[], args: ValidationArguments) {
    for (let service of serviceArray) {
      const existingService = await this.serviceModel.findOne({
        title: service,
      });
      if (!existingService) return false;
      return true;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Service does not exist';
  }
}
