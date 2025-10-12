import { TestBed } from '@angular/core/testing';
import { ContactApiService } from './contact-api.service';
import { ApiService } from './api.service';
import { Message } from '@cooksona/models/contact.models';

describe('ContactApiService', () => {
  let service: ContactApiService;
  let apiServiceMock: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceMock = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'put',
      'delete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ContactApiService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(ContactApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch contact requests', async () => {
    const mockMessages: Message[] = [
      {
        id: '1',
        email: 'user@example.com',
        requestType: 'support',
        message: 'Need help',
        status: 'open',
      } as Message,
    ];

    apiServiceMock.get.and.resolveTo(mockMessages);

    const result = await service.fetchContactRequests();

    expect(result).toEqual(mockMessages);
    expect(apiServiceMock.get).toHaveBeenCalledWith('/contact');
  });

  it('should create contact request', async () => {
    const requestData = {
      email: 'user@example.com',
      requestType: 'support' as const,
      message: 'Need help with feature',
    };

    const mockResponse: Message = {
      id: '123',
      ...requestData,
      status: 'open',
    } as Message;

    apiServiceMock.post.and.resolveTo(mockResponse);

    const result = await service.createContactRequest(requestData);

    expect(result).toEqual(mockResponse);
    expect(apiServiceMock.post).toHaveBeenCalledWith('/contact', requestData);
  });

  it('should fetch user contact requests', async () => {
    const userId = 'user-123';
    const mockMessages: Message[] = [
      {
        id: '1',
        userId,
        email: 'user@example.com',
        requestType: 'support',
        message: 'My request',
        status: 'open',
      } as Message,
    ];

    apiServiceMock.get.and.resolveTo(mockMessages);

    const result = await service.fetchUserContactRequests(userId);

    expect(result).toEqual(mockMessages);
    expect(apiServiceMock.get).toHaveBeenCalledWith(`/contact/user/${userId}`);
  });

  it('should update contact request', async () => {
    const requestId = 'request-123';
    const updateData = {
      status: 'resolved' as const,
      reply: 'Issue has been fixed',
    };

    const mockResponse: Message = {
      id: requestId,
      status: 'resolved',
      reply: 'Issue has been fixed',
    } as Message;

    apiServiceMock.put.and.resolveTo(mockResponse);

    const result = await service.updateContactRequest(requestId, updateData);

    expect(result).toEqual(mockResponse);
    expect(apiServiceMock.put).toHaveBeenCalledWith(
      `/contact/${requestId}`,
      updateData
    );
  });

  it('should delete contact request', async () => {
    const requestId = 'request-456';

    apiServiceMock.delete.and.resolveTo(undefined);

    await service.deleteContactRequest(requestId);

    expect(apiServiceMock.delete).toHaveBeenCalledWith(`/contact/${requestId}`);
  });
});
