import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsIn,
  IsStrongPassword,
  IsNotEmpty,
  IsPhoneNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ required: true, example: 'Arawole' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: true, example: 'Mercy' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ required: true, example: 'mercyarawole@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true, example: 'Admin1234$' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ required: true, example: '09023007788' })
  @IsPhoneNumber('NG')
  phone: string;

  @ApiProperty({
    required: true,
    example: 'Nigeria',
  })
  @IsString()
  @IsIn(['Nigeria'])
  country: string;

  @ApiProperty({ required: true, example: 'artisan' })
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  @IsIn(['artisan', 'client'])
  type: string;
}

export class ResetPasswordDto {
  @ApiProperty({ required: true, example: 'Admin1234$' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ required: true, example: '123456' })
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class LoginDto {
  @ApiProperty({ required: true, example: 'oluwagbemiro@gmail.com' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: true, example: 'Admin1234$' })
  @IsNotEmpty()
  password: string;
}

export class changePasswordDto {
  @ApiProperty({ required: true, example: 'Admin1234$' })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ required: true, example: 'Admin1234$' })
  @IsStrongPassword()
  newPassword: string;
}
