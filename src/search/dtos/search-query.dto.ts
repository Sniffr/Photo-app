import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username?: string;

  // Add  searches by hashtag
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  hashtag?: string;
}
