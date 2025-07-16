import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from 'dotenv';
import { ApiResponse } from '../utility/ApiResponse';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '../admin/admin.service';
import { InjectModel } from '@nestjs/mongoose';
import { Settings } from '../admin/settings.schema';
import { Model } from 'mongoose';

config();

@Injectable()
export class AddressService {
  private googleKey: string;
  constructor(
    private configService: ConfigService,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {
    this.googleKey = this.configService.get<string>('GOOGLE_API_KEY');
  }
  async fetchAddresses(input: string) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&components=country:NG&key=${this.googleKey}`,
      );
      const result = response?.data?.predictions?.map((address) => ({
        location: address.description,
        placeId: address.place_id,
      }));
      return ApiResponse.success('Addresses', HttpStatus.OK, result);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  // async verifyPlaceId(placeId: string) {
  //   try {
  //     const response = await axios.get(
  //       `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${process.env.GOOGLE_API_KEY}`,
  //     );
  //     const location = response.data.result.formatted_address;
  //     const geometry = response.data.result.geometry.location;
  //     const data = { ...geometry, location, placeId };
  //     return ApiResponse.success('Place Id Verified', HttpStatus.OK, data);
  //   } catch (error) {
  //     return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
  //   }
  // }
  async getDistance(origin: string, destination: string) {
    const response = await axios(
      `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=place_id:${origin}&destinations=place_id:${destination}&key=${this.googleKey}`,
    );
    const distance = (
      response.data?.rows[0]?.elements[0]?.distance?.value / 1000
    ).toFixed(2);
    return distance;
  }
  async fetchCloseObjects(
    destination: string,
    data: any = [],
    type: string = 'user',
  ) {
    try {
      const closeObjects = [];
      const settings = await this.settingsModel.findOne();
      for (let item of data) {
        const origin =
          type === 'user'
            ? item?.about?.officeAddress?.placeId
            : type === 'job'
              ? item?.address?.placeId
              : '';
        const distance = await this.getDistance(origin, destination);
        if (+distance <= settings.distance) closeObjects.push(item);
        console.log(distance);
      }
      return ApiResponse.success(
        'Objects Fetched',
        HttpStatus.OK,
        closeObjects,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
