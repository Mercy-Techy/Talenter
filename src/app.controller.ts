import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Service } from './services/service.schema';
// import { Settings } from './models/settings.model';

@ApiTags('App')
@Controller()
export class AppController {
  // constructor(
  //   // @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  //   @InjectModel(Service.name) private service: Model<Service>,
  // ) {
  //   const arr = [
  //     'contruction worker',
  //     'builder',
  //     'graphics designer',
  //     'chef',
  //     'footbal player',
  //     'software developer',
  //     'manager',
  //     'fashion designer',
  //     'baker',
  //   ];
  //   // this.settingsModel.create({ distance: 5000 });
  //   for (let title of arr) {
  //     this.service.create({ title });
  //   }
  // }
  @Get('health-check')
  Hello() {
    return 'Hello World';
  }
}
