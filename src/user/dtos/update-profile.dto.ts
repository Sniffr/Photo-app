import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'johndoe', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  username?: string;

  @ApiProperty({ example: 'Photography enthusiast', required: false })
  @IsString()
  @IsOptional()
  bio?: string;
}
