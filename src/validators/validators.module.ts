import { Module } from '@nestjs/common';
import { IsService } from './IsService.validator';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../services/service.schema';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  providers: [IsService],
  exports: [IsService, MongooseModule],
})
export class ValidatorsModule {}
