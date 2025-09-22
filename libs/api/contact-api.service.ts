import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Message } from '@cooksona/models/contact.models';

@Injectable({ providedIn: 'root' })
export class ContactApiService {
  constructor(private readonly api: ApiService) {}

  fetchContactRequests(): Promise<Message[] | undefined> {
    return this.api.get<Message[]>('/contact');
  }

  createContactRequest(data: {
    userId?: string;
    email?: string;
    requestType: Message['requestType'];
    message: string;
  }): Promise<Message | undefined> {
    return this.api.post<Message>('/contact', data);
  }

  fetchUserContactRequests(userId: string): Promise<Message[] | undefined> {
    return this.api.get<Message[]>(`/contact/user/${userId}`);
  }

  updateContactRequest(
    id: string,
    data: Partial<Pick<Message, 'status' | 'reply'>> & { userId?: string },
  ): Promise<Message | undefined> {
    return this.api.put<Message>(`/contact/${id}`, data);
  }

  deleteContactRequest(id: string): Promise<void | undefined> {
    return this.api.delete<void>(`/contact/${id}`);
  }
}
