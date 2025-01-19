import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserService } from '../services/user.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserProfileDto } from '../dtos/user-profile.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile',
    type: UserProfileDto,
  })
  async getProfile(
    @Param('username') username: string,
  ): Promise<UserProfileDto> {
    return this.userService.getProfile(username);
  }

  @Post('follow/:username')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'Successfully followed user' })
  async followUser(
    @Request() req: { user: { sub: string } },
    @Param('username') username: string,
  ): Promise<void> {
    await this.userService.followUser(req.user.sub, username);
  }

  @Delete('unfollow/:username')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'Successfully unfollowed user' })
  async unfollowUser(
    @Request() req: { user: { sub: string } },
    @Param('username') username: string,
  ): Promise<void> {
    await this.userService.unfollowUser(req.user.sub, username);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileDto,
  })
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.userService.updateProfile(req.user.sub, updateProfileDto);
  }
}
