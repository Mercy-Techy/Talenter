import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from './service.schema';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { FileModule } from '../File/file.module';
import { Skill, SkillSchema } from './skill.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    MongooseModule.forFeature([{ name: Skill.name, schema: SkillSchema }]),
    FileModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, MongooseModule],
})
export class ServicesModule {}
