import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

/**
 * Maximum file size for avatar uploads: 5MB
 */
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Allowed image MIME types for avatars
 */
export const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Create a file validation pipe for avatar uploads
 */
export function createAvatarFileValidationPipe(): ParseFilePipe {
  return new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({
        maxSize: MAX_AVATAR_SIZE,
        message: 'File size must be less than 5MB',
      }),
      new FileTypeValidator({
        fileType: new RegExp(ALLOWED_AVATAR_TYPES.join('|')),
      }),
    ],
    fileIsRequired: true,
  });
}
