// create-photo.dto.ts
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }): string[] => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as string | string[];
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  hashtags?: string[];
}
