import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { Follow } from '../../domain/entities/follow.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserProfileDto } from '../dtos/user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  async getProfile(username: string): Promise<UserProfileDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { username },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const [followersCount, followingCount, photosCount] = await Promise.all([
        this.followRepository.count({ where: { following_id: user.id } }),
        this.followRepository.count({ where: { follower_id: user.id } }),
        this.photoRepository.count({ where: { user_id: user.id } }),
      ]);

      return {
        id: user.id,
        username: user.username,
        bio: user.bio,
        followersCount,
        followingCount,
        photosCount,
        createdAt: user.created_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(error.message);
    }
  }

  async followUser(followerId: string, username: string): Promise<void> {
    const userToFollow = await this.userRepository.findOne({
      where: { username },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    if (followerId === userToFollow.id) {
      throw new ConflictException('Users cannot follow themselves');
    }

    const existingFollow = await this.followRepository.findOne({
      where: {
        follower_id: followerId,
        following_id: userToFollow.id,
      },
    });

    if (existingFollow) {
      throw new ConflictException('Already following this user');
    }

    const follow = this.followRepository.create({
      follower_id: followerId,
      following_id: userToFollow.id,
    });

    await this.followRepository.save(follow);
  }

  async unfollowUser(followerId: string, username: string): Promise<void> {
    const userToUnfollow = await this.userRepository.findOne({
      where: { username },
    });

    if (!userToUnfollow) {
      throw new NotFoundException('User not found');
    }

    const follow = await this.followRepository.findOne({
      where: {
        follower_id: followerId,
        following_id: userToUnfollow.id,
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this user');
    }

    await this.followRepository.remove(follow);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username already taken');
      }

      user.username = updateProfileDto.username;
    }

    if (updateProfileDto.bio !== undefined) {
      user.bio = updateProfileDto.bio;
    }

    await this.userRepository.save(user);

    return this.getProfile(user.username);
  }
}
