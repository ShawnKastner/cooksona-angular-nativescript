import { AuthUser } from '@cooksona/auth';

export type User = AuthUser & {
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};
