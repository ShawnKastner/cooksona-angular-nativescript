import { TestBed } from '@angular/core/testing';
import { InvitesApiService } from './invites-api.service';
import { ApiService } from './api.service';
import { Invite, CreateInviteRequest } from '@cooksona/models/invite.models';

describe('InvitesApiService', () => {
  let service: InvitesApiService;
  let apiServiceMock: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceMock = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'delete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        InvitesApiService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(InvitesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all invites', async () => {
    const mockInvites: Invite[] = [
      {
        id: '1',
        code: 'INVITE123',
        createdBy: 'admin-1',
        maxUses: 10,
        currentUses: 5,
      } as Invite,
      {
        id: '2',
        code: 'INVITE456',
        createdBy: 'admin-1',
        maxUses: 5,
        currentUses: 2,
      } as Invite,
    ];

    apiServiceMock.get.and.resolveTo(mockInvites);

    const result = await service.getAllInvites();

    expect(result).toEqual(mockInvites);
    expect(apiServiceMock.get).toHaveBeenCalledWith('/admin/invites');
  });

  it('should delete invite', async () => {
    const inviteId = '123';

    apiServiceMock.delete.and.resolveTo(undefined);

    await service.deleteInvite(inviteId);

    expect(apiServiceMock.delete).toHaveBeenCalledWith(`/admin/invites/${inviteId}`);
  });

  it('should encode invite ID when deleting', async () => {
    const inviteId = 'invite@special/id';

    apiServiceMock.delete.and.resolveTo(undefined);

    await service.deleteInvite(inviteId);

    expect(apiServiceMock.delete).toHaveBeenCalledWith(
      '/admin/invites/invite%40special%2Fid'
    );
  });

  it('should create invite', async () => {
    const createData: CreateInviteRequest = {
      maxUses: 100,
      expiresAt: new Date('2025-12-31'),
    };

    const mockInvite: Invite = {
      id: 'new-invite',
      code: 'NEWCODE123',
      createdBy: 'admin-1',
      maxUses: 100,
      currentUses: 0,
      expiresAt: new Date('2025-12-31'),
    } as Invite;

    apiServiceMock.post.and.resolveTo(mockInvite);

    const result = await service.createInvite(createData);

    expect(result).toEqual(mockInvite);
    expect(apiServiceMock.post).toHaveBeenCalledWith('/admin/invites', createData);
  });
});
