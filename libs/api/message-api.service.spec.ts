import { TestBed } from '@angular/core/testing';
import { MessageApiService } from './message-api.service';
import { Message } from '@cooksona/models/contact.models';

describe('MessageApiService', () => {
  let service: MessageApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageApiService],
    });
    service = TestBed.inject(MessageApiService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRepliesForUser', () => {
    it('should return empty array when no messages exist', () => {
      const replies = service.getRepliesForUser();
      expect(replies).toEqual([]);
    });

    it('should return only answered messages with replies', () => {
      const messages: Message[] = [
        {
          id: '1',
          status: 'answered',
          reply: 'Reply 1',
          createdAt: '2025-01-01',
        } as Message,
        {
          id: '2',
          status: 'open',
          reply: undefined,
          createdAt: '2025-01-02',
        } as Message,
        {
          id: '3',
          status: 'answered',
          reply: 'Reply 3',
          createdAt: '2025-01-03',
        } as Message,
      ];

      localStorage.setItem('cooksona_messages', JSON.stringify(messages));

      const replies = service.getRepliesForUser();

      expect(replies.length).toBe(2);
      expect(replies[0].id).toBe('3'); // Sorted by date descending
      expect(replies[1].id).toBe('1');
    });

    it('should sort replies by creation date descending', () => {
      const messages: Message[] = [
        {
          id: '1',
          status: 'answered',
          reply: 'Reply 1',
          createdAt: '2025-01-01',
        } as Message,
        {
          id: '2',
          status: 'answered',
          reply: 'Reply 2',
          createdAt: '2025-01-05',
        } as Message,
        {
          id: '3',
          status: 'answered',
          reply: 'Reply 3',
          createdAt: '2025-01-03',
        } as Message,
      ];

      localStorage.setItem('cooksona_messages', JSON.stringify(messages));

      const replies = service.getRepliesForUser();

      expect(replies[0].id).toBe('2');
      expect(replies[1].id).toBe('3');
      expect(replies[2].id).toBe('1');
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('cooksona_messages', 'invalid-json');

      const replies = service.getRepliesForUser();
      expect(replies).toEqual([]);
    });
  });

  describe('getUnseenReplyCount', () => {
    it('should return 0 when no replies exist', () => {
      const count = service.getUnseenReplyCount('user-1');
      expect(count).toBe(0);
    });

    it('should return count of unseen replies', () => {
      const messages: Message[] = [
        {
          id: '1',
          status: 'answered',
          reply: 'Reply 1',
          createdAt: '2025-01-01',
        } as Message,
        {
          id: '2',
          status: 'answered',
          reply: 'Reply 2',
          createdAt: '2025-01-02',
        } as Message,
        {
          id: '3',
          status: 'answered',
          reply: 'Reply 3',
          createdAt: '2025-01-03',
        } as Message,
      ];

      localStorage.setItem('cooksona_messages', JSON.stringify(messages));

      const count = service.getUnseenReplyCount('user-1');
      expect(count).toBe(3);
    });

    it('should exclude seen replies from count', () => {
      const messages: Message[] = [
        {
          id: '1',
          status: 'answered',
          reply: 'Reply 1',
          createdAt: '2025-01-01',
        } as Message,
        {
          id: '2',
          status: 'answered',
          reply: 'Reply 2',
          createdAt: '2025-01-02',
        } as Message,
      ];

      localStorage.setItem('cooksona_messages', JSON.stringify(messages));
      localStorage.setItem(
        'cooksona_seen_replies_user-1',
        JSON.stringify(['1']),
      );

      const count = service.getUnseenReplyCount('user-1');
      expect(count).toBe(1);
    });
  });

  describe('markRepliesAsSeen', () => {
    it('should mark replies as seen', () => {
      const replies: Message[] = [
        { id: '1' } as Message,
        { id: '2' } as Message,
      ];

      service.markRepliesAsSeen('user-1', replies);

      const seenJson = localStorage.getItem('cooksona_seen_replies_user-1');
      expect(seenJson).toBeDefined();

      const seen = JSON.parse(seenJson!);
      expect(seen).toContain('1');
      expect(seen).toContain('2');
    });

    it('should preserve previously seen replies', () => {
      localStorage.setItem(
        'cooksona_seen_replies_user-1',
        JSON.stringify(['1']),
      );

      const newReplies: Message[] = [{ id: '2' } as Message];

      service.markRepliesAsSeen('user-1', newReplies);

      const seenJson = localStorage.getItem('cooksona_seen_replies_user-1');
      const seen = JSON.parse(seenJson!);
      expect(seen).toContain('1');
      expect(seen).toContain('2');
    });

    it('should not duplicate seen reply IDs', () => {
      localStorage.setItem(
        'cooksona_seen_replies_user-1',
        JSON.stringify(['1']),
      );

      const replies: Message[] = [
        { id: '1' } as Message,
        { id: '2' } as Message,
      ];

      service.markRepliesAsSeen('user-1', replies);

      const seenJson = localStorage.getItem('cooksona_seen_replies_user-1');
      const seen = JSON.parse(seenJson!);
      expect(seen.filter((id: string) => id === '1').length).toBe(1);
    });
  });
});
