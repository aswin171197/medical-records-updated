import { IsEmail, IsNotEmpty, IsString, ValidateIf, IsMobilePhone } from 'class-validator';

export class LoginDto {
  @ValidateIf(o => !o.mobile || o.email)
  @IsEmail()
  email?: string;

  @ValidateIf(o => !o.email || o.mobile)
  @IsString()
  mobile?: string;

  @IsNotEmpty()
  password: string;
}
