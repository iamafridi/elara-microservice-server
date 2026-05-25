import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { FcmModule } from '../fcm/fcm.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { User } from '../../../../libs/database/src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    FcmModule,
    EmailModule,
    SmsModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
