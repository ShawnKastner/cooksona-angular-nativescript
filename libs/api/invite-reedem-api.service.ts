import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface InviteRedeemPayload {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class InviteRedeemApiService {
  constructor(private readonly api: ApiService) {}

  redeemInvite<T = unknown>(token: string, userData: InviteRedeemPayload): Promise<T | undefined> {
    const safeToken = encodeURIComponent(token);
    return this.api.post<T>(`/invites/redeem/${safeToken}`, userData);
  }
}

