export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

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
