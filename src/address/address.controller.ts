import { Controller, Res, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { response } from '../utility/ApiResponse';
import { AddressService } from './address.service';

@ApiTags('Google Address')
@ApiBadRequestResponse()
@ApiOkResponse()
@Controller('google-address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get(':input')
  @ApiParam({ type: 'string', description: 'Search filter', name: 'input' })
  async fetchAddress(@Res() res: Response, @Param('input') input: string) {
    return response(res, await this.addressService.fetchAddresses(input));
  }
}
