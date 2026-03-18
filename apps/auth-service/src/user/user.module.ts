import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserAddress, UserDevice } from '../../../../libs/database/src/entities';
import { EventPublisher } from '../../../../libs/events/src/event-publisher.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAddress, UserDevice])],
  controllers: [UserController],
  providers: [UserService, EventPublisher],
  exports: [UserService],
})
export class UserModule {}
