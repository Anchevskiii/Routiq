export interface Profile {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileDto {
  name?: string
  email?: string
  avatarUrl?: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface AvatarUploadResponse {
  url: string
  filename: string
}
