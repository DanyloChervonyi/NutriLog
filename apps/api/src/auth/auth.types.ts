import type { UserRole } from '../../generated/prisma/enums.js';

export type AuthenticatedUser = Readonly<{
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
}>;

export type AuthenticatedRequest = Express.Request & Readonly<{
  user: AuthenticatedUser;
}>;

export type AuthPayload = Readonly<{
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthenticatedUser;
}>;

export type TokenPair = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;
