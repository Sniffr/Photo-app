import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePhotoDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  hashtags?: string[];
}
