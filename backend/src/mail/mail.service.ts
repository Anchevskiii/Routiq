import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: AppConfigService,
  ) {}

  async sendGroupInvitation(
    to: string,
    inviterName: string,
    groupName: string,
    groupId: string,
  ) {
    const frontendUrl = this.configService.getFrontendUrl();
    const inviteUrl = `${frontendUrl}/groups?invitation=${groupId}`;

    try {
      await this.mailerService.sendMail({
        to,
        subject: `You've been invited to join ${groupName} on Routiq!`,
        template: './group-invitation',
        context: {
          inviterName,
          groupName,
          inviteUrl,
        },
      });
      this.logger.log(`Invitation email sent to ${to} for group ${groupName}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to send invitation email to ${to}:`,
        errorMessage,
      );
      // We don't throw here to avoid breaking the invitation flow if mail fails,
      // but in production, you might want to handle this differently.
    }
  }
}
