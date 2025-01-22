import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PhotoModule } from './photo/photo.module';
import { FeedModule } from './feed/feed.module';
import { InteractionModule } from './interaction/interaction.module';
import { SearchModule } from './search/search.module';
import { NotificationModule } from './notification/notification.module';
import * as entities from './domain/entities';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'photo_inc',
      entities: Object.values(entities) as EntityClassOrSchema[],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UserModule,
    PhotoModule,
    FeedModule,
    InteractionModule,
    SearchModule,
    NotificationModule,
  ],
})
export class AppModule {}
