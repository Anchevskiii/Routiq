export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number; // issued at - added by JWT library
  exp?: number; // expiration - added by JWT library
}
