import { Injectable } from '@angular/core';
import { Message } from '@cooksona/models/contact.models';

const MESSAGES_KEY = 'cooksona_messages';
const SEEN_REPLIES_KEY_PREFIX = 'cooksona_seen_replies_';

@Injectable({ providedIn: 'root' })
export class MessageApiService {
  // Web-only mock storage; guards to avoid SSR/Native errors
  private get ls(): Storage | null {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage ?? null;
    } catch {
      return null;
    }
  }

  getRepliesForUser(): Message[] {
    try {
      const ls = this.ls;
      if (!ls) return [];
      const stored = ls.getItem(MESSAGES_KEY);
      if (!stored) return [];
      const allMessages = JSON.parse(stored) as Message[];
      return allMessages
        .filter((msg) => msg.status === 'answered' && !!msg.reply)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reading messages from localStorage', error);
      return [];
    }
  }

  getUnseenReplyCount(userId: string): number {
    const allReplies = this.getRepliesForUser();
    if (!allReplies.length) return 0;
    const seen = this.getSeenReplies(userId);
    return allReplies.filter((reply) => !seen.has(reply.id)).length;
  }

  markRepliesAsSeen(userId: string, replies: Message[]): void {
    try {
      const ls = this.ls;
      if (!ls) return;
      const key = `${SEEN_REPLIES_KEY_PREFIX}${userId}`;
      const seen = this.getSeenReplies(userId);
      for (const r of replies) {
        seen.add(r.id);
      }
      ls.setItem(key, JSON.stringify(Array.from(seen)));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking replies as seen in localStorage', error);
    }
  }

  private getSeenReplies(userId: string): Set<string> {
    try {
      const ls = this.ls;
      if (!ls) return new Set<string>();
      const key = `${SEEN_REPLIES_KEY_PREFIX}${userId}`;
      const raw = ls.getItem(key);
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reading seen replies from localStorage', error);
      return new Set<string>();
    }
  }
}

