import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export type WaitForOptions<T> = {
  filter?: (payload: T) => boolean;
  timeoutMs?: number; // default 30000
};

@Injectable({ providedIn: 'root' })
export class RealTimeService {
  private socket: Socket | null = null;
  private lastUserId: string | number | null = null;

  // Configure your server URL/path here if different from API base.
  // For same-origin setups with server mounted at /socket.io this can stay undefined.
  connect(opts?: {
    url?: string; // e.g., '' (same origin) or 'https://api.cooksona.de'
    path?: string; // e.g., '/socket.io'
    auth?: Record<string, unknown>;
    transports?: ('websocket' | 'polling')[];
    userId?: string | number; // appended as query (?userId=...) to match server handshake.query
  }): Socket {
    const cfg = environment as any;
    const defaultUrl = cfg?.socket?.url ?? '';
    const defaultPath = cfg?.socket?.path ?? '/socket.io';
    const origin =
      (opts?.url ?? defaultUrl) || (typeof window !== 'undefined' ? '' : '');
    const needReconnectForUser =
      this.lastUserId != null &&
      opts?.userId != null &&
      String(this.lastUserId) !== String(opts.userId);

    if (this.socket?.connected && !needReconnectForUser) return this.socket;

    const urlWithQuery =
      opts?.userId != null && opts.userId !== ''
        ? `${origin}?userId=${encodeURIComponent(String(opts.userId))}`
        : origin;
    if (!this.socket || needReconnectForUser) {
      try {
        this.socket?.close();
      } catch {}
      this.socket = io(urlWithQuery, {
        path: opts?.path ?? defaultPath,
        withCredentials: true,
        auth: opts?.auth,
        transports: opts?.transports ?? ['websocket'],
        autoConnect: true,
      });
      this.lastUserId = opts?.userId ?? null;
    } else {
      // update auth if provided
      if (opts?.auth) this.socket.auth = opts.auth;
      if (!this.socket.connected && !this.socket.active) this.socket.connect();
    }
    return this.socket;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  waitFor<T = any>(event: string, options?: WaitForOptions<T>): Promise<T> {
    const sock = this.connect();
    return new Promise<T>((resolve, reject) => {
      let timer: any;
      const onEvent = (payload: T) => {
        try {
          if (options?.filter && !options.filter(payload)) return;
        } catch (e) {
          // if filter throws, treat as non-match
          return;
        }
        cleanup();
        resolve(payload);
      };

      const onError = (err: any) => {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      const cleanup = () => {
        clearTimeout(timer);
        sock.off(event, onEvent);
        sock.off('connect_error', onError);
      };

      sock.on(event, onEvent);
      sock.on('connect_error', onError);

      const timeout = options?.timeoutMs ?? 30000;
      if (timeout > 0) {
        timer = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout while waiting for event: ${event}`));
        }, timeout);
      }
    });
  }

  on<T = any>(event: string, handler: (payload: T) => void): () => void {
    const sock = this.connect();
    sock.on(event, handler as any);
    return () => sock.off(event, handler as any);
  }
}
