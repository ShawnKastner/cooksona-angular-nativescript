// libs/core/auth/src/lib/models/auth.models.ts
export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}
