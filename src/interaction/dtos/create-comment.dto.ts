import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great photo!' })
  @IsString()
  @MinLength(1)
  content: string;
}
