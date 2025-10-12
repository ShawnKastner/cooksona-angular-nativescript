import { TestBed } from '@angular/core/testing';
import { UserApiService } from './user-api.service';
import { ApiService } from './api.service';
import { User } from '@cooksona/models/user.models';

describe('UserApiService', () => {
  let service: UserApiService;
  let apiServiceMock: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceMock = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'patch',
      'delete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        UserApiService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(UserApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all users', async () => {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User 1',
        role: 'user',
      } as User,
      {
        id: '2',
        email: 'user2@example.com',
        name: 'User 2',
        role: 'admin',
      } as User,
    ];

    apiServiceMock.get.and.resolveTo(mockUsers);

    const result = await service.getAllUsers();

    expect(result).toEqual(mockUsers);
    expect(apiServiceMock.get).toHaveBeenCalledWith('/admin/users');
  });

  it('should update user', async () => {
    const userId = '123';
    const userData: Partial<User> = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };
    const mockUpdatedUser: User = {
      id: userId,
      email: 'updated@example.com',
      name: 'Updated Name',
      role: 'user',
    } as User;

    apiServiceMock.patch.and.resolveTo(mockUpdatedUser);

    const result = await service.updateUser(userId, userData);

    expect(result).toEqual(mockUpdatedUser);
    expect(apiServiceMock.patch).toHaveBeenCalledWith(
      `/admin/users/${userId}`,
      userData
    );
  });

  it('should encode user ID when updating', async () => {
    const userId = 'user@special/id';
    const userData: Partial<User> = { name: 'Test' };

    apiServiceMock.patch.and.resolveTo({} as User);

    await service.updateUser(userId, userData);

    expect(apiServiceMock.patch).toHaveBeenCalledWith(
      '/admin/users/user%40special%2Fid',
      userData
    );
  });

  it('should delete user', async () => {
    const userId = '456';

    apiServiceMock.delete.and.resolveTo(undefined);

    await service.deleteUser(userId);

    expect(apiServiceMock.delete).toHaveBeenCalledWith(`/admin/users/${userId}`);
  });

  it('should encode user ID when deleting', async () => {
    const userId = 'user@special/id';

    apiServiceMock.delete.and.resolveTo(undefined);

    await service.deleteUser(userId);

    expect(apiServiceMock.delete).toHaveBeenCalledWith(
      '/admin/users/user%40special%2Fid'
    );
  });

  it('should verify email', async () => {
    const token = 'verification-token-123';
    const mockResponse = { ok: true };

    apiServiceMock.post.and.resolveTo(mockResponse);

    const result = await service.verifyEmail(token);

    expect(result).toEqual(mockResponse);
    expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/verify', { token });
  });
});
