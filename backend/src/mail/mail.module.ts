import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { ConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        transport: {
          host: config.getMailHost(),
          port: config.getMailPort(),
          secure: config.getMailPort() === 465, // true for 465, false for other ports
          auth: {
            user: config.getMailUser(),
            pass: config.getMailPass(),
          },
        },
        defaults: {
          from: `"Routiq Travel" <${config.getMailFrom()}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
