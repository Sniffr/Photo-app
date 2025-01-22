import {
  Controller,
  Get,
  Post,
  Param,
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
import { NotificationService } from '../services/notification.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Returns list of notifications' })
  async getUserNotifications(@Request() req: { user: { sub: string } }) {
    return this.notificationService.getUserNotifications(req.user.sub);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Request() req: { user: { sub: string } },
    @Param('id') notificationId: string,
  ) {
    await this.notificationService.markAsRead(req.user.sub, notificationId);
    return { message: 'Notification marked as read' };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req: { user: { sub: string } }) {
    await this.notificationService.markAllAsRead(req.user.sub);
    return { message: 'All notifications marked as read' };
  }
}
