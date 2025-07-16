import {
  Controller,
  Delete,
  Get,
  Post,
  Res,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { response } from '../utility/ApiResponse';
import { AuthUser } from '../decorators/user.decorator';
import { UserDocument } from '../user/user.schema';
import { Types } from 'mongoose';
import {
  ApiBody,
  ApiParam,
  ApiTags,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/auth.guard';
import { ValidateAdmin } from '../guards/validateAdmin.guard';
import { EditServiceDto } from './services.dto';

@ApiTags('Services')
@ApiBadRequestResponse()
@ApiOkResponse()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}
  @Get()
  @ApiQuery({ name: 'page', type: 'number', example: 1, required: false })
  @ApiQuery({ name: 'limit', type: 'number', example: 1, required: false })
  async fetchServices(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(res, await this.servicesService.fetchServices(page, limit));
  }

  @Get('service-images')
  async fetchImages(@Res() res: Response) {
    return response(res, await this.servicesService.fetchServiceImages());
  }

  @UseGuards(ValidateAdmin)
  @Post('add')
  @UseInterceptors(FileInterceptor('serviceImage'))
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        serviceImage: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  async addService(
    @Res() res: Response,
    @Body('title') title: string,
    @UploadedFile() serviceImage: Express.Multer.File,
    @AuthUser('_id') userId: Types.ObjectId,
  ) {
    return response(
      res,
      await this.servicesService.addService(title, serviceImage, userId),
    );
  }

  @ApiNotFoundResponse()
  @UseGuards(ValidateAdmin)
  @Delete(':serviceId')
  @ApiParam({ name: 'serviceId', type: 'string', required: true })
  async deleteService(
    @Res() res: Response,
    @Param('serviceId') serviceId: Types.ObjectId,
  ) {
    return response(res, await this.servicesService.deleteService(serviceId));
  }

  @ApiNotFoundResponse()
  @UseGuards(ValidateAdmin)
  @Put('edit')
  @UseInterceptors(FileInterceptor('serviceImage'))
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        serviceImage: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
        },
        serviceId: { type: 'string' },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  async editService(
    @Res() res: Response,
    @Body() editDetails: EditServiceDto,
    @UploadedFile() serviceImage: Express.Multer.File,
  ) {
    return response(
      res,
      await this.servicesService.editService(
        editDetails.serviceId,
        serviceImage,
        editDetails.title,
      ),
    );
  }

  @Get('skills')
  @ApiQuery({ name: 'page', type: 'number', example: 1, required: false })
  @ApiQuery({ name: 'limit', type: 'number', example: 1, required: false })
  async fetchSkills(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return response(res, await this.servicesService.fetchSkills(page, limit));
  }

  @UseGuards(ValidateAdmin)
  @Post('add-skill')
  @ApiBody({
    schema: {
      properties: { title: { type: 'string', example: 'excellent' } },
    },
  })
  async addSkill(@Res() res: Response, @Body('title') title: string) {
    return response(res, await this.servicesService.addSkill(title));
  }

  @UseGuards(ValidateAdmin)
  @Delete('skill/:skillId')
  @ApiParam({ name: 'skillId', type: 'string', required: true })
  async deleteSkill(
    @Res() res: Response,
    @Param('skillId') skillId: Types.ObjectId,
  ) {
    return response(res, await this.servicesService.deleteSkill(skillId));
  }
}
