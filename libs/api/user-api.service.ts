import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User } from '@cooksona/models/user.models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private readonly api: ApiService) {}

  getAllUsers(): Promise<User[] | undefined> {
    return this.api.get<User[]>('/admin/users');
  }

  updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    return this.api.patch<User>(`/admin/users/${encodeURIComponent(id)}`, data);
  }

  deleteUser(id: string): Promise<void | undefined> {
    return this.api.delete<void>(`/admin/users/${encodeURIComponent(id)}`);
  }

  verifyEmail(token: string): Promise<{ ok: boolean } | undefined> {
    return this.api.post<{ ok: boolean }>('/auth/verify', { token });
  }
}
