import { Injectable, HttpStatus } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ApiResponse } from '../utility/ApiResponse';
import * as cloudinary from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { File, FileDocument } from './file.schema';
import { cloudinaryReturnType } from './file.dto';
import { InjectModel } from '@nestjs/mongoose';

const allFileExtensions = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg'],
  video: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mpeg', 'mpg', '3gp', 'mkv'],
  audio: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a'],
  document: [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'rtf',
    'csv',
    'vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};
const { config, uploader } = cloudinary.v2;

@Injectable()
export class FileService {
  constructor(
    private configService: ConfigService,
    @InjectModel(File.name) private fileModel: Model<File>,
  ) {
    config({
      cloud_name: this.configService.get<string>('CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  validateFile(
    file: Express.Multer.File,
    type: string = 'image',
    size: number = 5,
  ) {
    const fileExtension = file.mimetype.split('/')[1];
    if (!allFileExtensions[type].includes(fileExtension)) {
      return ApiResponse.fail(
        'File type is not supported',
        HttpStatus.BAD_REQUEST,
        null,
      );
    }
    const fileSize = file.size / 1024 / 1024; // size in MB

    if (fileSize > size) {
      return ApiResponse.fail(
        'File size is not allowed',
        HttpStatus.BAD_REQUEST,
        null,
      );
    }
    return ApiResponse.success('File', HttpStatus.OK, file);
  }

  async deleteFiles(fileIds: Types.ObjectId[]) {
    try {
      for (let _id of fileIds) {
        const file = await this.fileModel.findOneAndDelete({ _id });
        await uploader.destroy(file.public_id);
      }
      return ApiResponse.success('Files Deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }

  async uploadFile(
    file: Buffer,
    folder: string = undefined,
    public_id: string = undefined,
  ): Promise<cloudinaryReturnType> {
    return new Promise<cloudinaryReturnType>((resolve, reject) => {
      const options: {
        resource_type: 'image' | 'auto' | 'video' | 'raw';
        folder: string;
        public_id: string;
      } = { resource_type: 'auto', folder, public_id };

      if (!public_id) delete options.public_id;
      if (!folder) delete options.folder;
      uploader
        .upload_stream(options, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(file);
    });
  }

  async createFiles(
    files: Express.Multer.File[],
    userId: Types.ObjectId,
    type: string,
  ) {
    const uploadedFiles = [];
    try {
      if (type !== 'any') {
        for (let file of files) {
          const validationResult = this.validateFile(file, type);
          if (!validationResult.status) return validationResult;
        }
      }
      for (let file of files) {
        const { url, public_id, format, bytes, resource_type } =
          await this.uploadFile(file.buffer, file.fieldname);
        const createdFile = await this.fileModel.create({
          name: file.fieldname,
          originalname: file.originalname,
          url,
          public_id,
          format,
          type:
            type === 'any' && resource_type === 'raw'
              ? 'document'
              : resource_type,
          uploadedBy: userId,
          size: bytes,
        });
        uploadedFiles.push(createdFile._id);
      }
      return ApiResponse.success(
        'Files Uploaded',
        HttpStatus.OK,
        uploadedFiles,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async editFile(fileId: any, file: Express.Multer.File, type: string) {
    try {
      const uploadedFile = await this.fileModel.findById(fileId);
      if (!uploadedFile)
        return ApiResponse.fail(
          'File does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      const validationResult = this.validateFile(file, type);
      if (!validationResult.status) return validationResult;
      const editedFile = await this.uploadFile(
        file.buffer,
        undefined,
        uploadedFile.public_id,
      );
      uploadedFile.url = editedFile.url;
      await uploadedFile.save();
      return ApiResponse.success(
        'File Edited',
        HttpStatus.OK,
        uploadedFile._id,
      );
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
  async fetchFiles(fileIds: Types.ObjectId[] = []) {
    try {
      const files = [];
      for (let id of fileIds) {
        const file = await this.fileModel.findById(id);
        if (file) files.push(file);
      }
      return ApiResponse.success('Files', HttpStatus.OK, files);
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, error);
    }
  }
}
