import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/domain/entities/user.entity';
import { Photo } from './src/domain/entities/photo.entity';
import { Like } from './src/domain/entities/like.entity';
import { Comment } from './src/domain/entities/comment.entity';
import { Follow } from './src/domain/entities/follow.entity';
import { Notification } from './src/domain/entities/notification.entity';

dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'photo_inc',
  entities: [User, Photo, Like, Comment, Follow, Notification],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV !== 'production',
};

export default new DataSource(config);
