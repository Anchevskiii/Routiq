import { ParseFilePipe } from '@nestjs/common';
import {
  createAvatarFileValidationPipe,
  MAX_AVATAR_SIZE,
  ALLOWED_AVATAR_TYPES,
} from './file.validator';

describe('file.validator', () => {
  it('should define MAX_AVATAR_SIZE and ALLOWED_AVATAR_TYPES', () => {
    expect(MAX_AVATAR_SIZE).toBe(5242880);
    expect(ALLOWED_AVATAR_TYPES).toContain('image/jpeg');
    expect(ALLOWED_AVATAR_TYPES).toContain('image/png');
    expect(ALLOWED_AVATAR_TYPES).toContain('image/webp');
    expect(ALLOWED_AVATAR_TYPES).toContain('image/gif');
  });

  it('should return a ParseFilePipe with validators configured', () => {
    const pipe = createAvatarFileValidationPipe();
    expect(pipe).toBeInstanceOf(ParseFilePipe);
  });
});
