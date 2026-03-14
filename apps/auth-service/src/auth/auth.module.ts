import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User, Session, Otp } from '../../../../libs/database/src/entities';
import { JwtConfigService } from '../../../../libs/config/src/jwt-config.service';
import { EventPublisher } from '../../../../libs/events/src/event-publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Otp]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy, LocalStrategy, EventPublisher],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
