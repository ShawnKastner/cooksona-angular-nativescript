import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Invite, CreateInviteRequest } from '@cooksona/models/invite.models';

@Injectable({ providedIn: 'root' })
export class InvitesApiService {
  constructor(private readonly api: ApiService) {}

  getAllInvites(): Promise<Invite[] | undefined> {
    return this.api.get<Invite[]>('/admin/invites');
  }

  deleteInvite(id: string): Promise<void | undefined> {
    return this.api.delete<void>(`/admin/invites/${encodeURIComponent(id)}`);
  }

  createInvite(data: CreateInviteRequest): Promise<Invite | undefined> {
    return this.api.post<Invite>('/admin/invites', data);
  }
}
