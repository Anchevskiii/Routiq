import { MailerService } from '@nestjs-modules/mailer';
import { AppConfigService } from '../config/config.service';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mockMailerService: {
    sendMail: jest.Mock;
  };
  let mockConfigService: {
    getFrontendUrl: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMailerService = {
      sendMail: jest.fn(),
    };
    mockConfigService = {
      getFrontendUrl: jest.fn().mockReturnValue('https://routiq.test'),
    };
    service = new MailService(
      mockMailerService as unknown as MailerService,
      mockConfigService as unknown as AppConfigService,
    );
  });

  it('should successfully send a group invitation email', async () => {
    mockMailerService.sendMail.mockResolvedValue({});

    await service.sendGroupInvitation('user@test.com', 'Alice', 'Paris Trip', 'group-123');

    expect(mockConfigService.getFrontendUrl).toHaveBeenCalled();
    expect(mockMailerService.sendMail).toHaveBeenCalledWith({
      to: 'user@test.com',
      subject: "You've been invited to join Paris Trip on Routiq!",
      template: './group-invitation',
      context: {
        inviterName: 'Alice',
        groupName: 'Paris Trip',
        inviteUrl: 'https://routiq.test/groups?invitation=group-123',
      },
    });
  });

  it('should catch errors when sendMail fails and log them without throwing', async () => {
    mockMailerService.sendMail.mockRejectedValue(new Error('SMTP Error'));

    await expect(
      service.sendGroupInvitation('user@test.com', 'Alice', 'Paris Trip', 'group-123')
    ).resolves.not.toThrow();

    expect(mockMailerService.sendMail).toHaveBeenCalled();
  });
});
