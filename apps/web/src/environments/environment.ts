// Read runtime config if present (injected via /env.js)
const runtime: any = (globalThis as any).__env || {};

export const environment = {
  production: false,
  // Default to local backend for dev; allow override by runtime config
  apiBaseUrl: runtime.apiBaseUrl ?? 'http://localhost:3000',
  // Do not commit secrets; allow injection from runtime config
  paypalClientId: runtime.paypalClientId ?? '',
  // Optional: configure Socket.IO if your backend serves sockets on a different origin/path
  socket: {
    url: runtime.socket?.url ?? 'http://localhost:3000', // backend websocket server in dev
    path: runtime.socket?.path ?? '/socket.io',
  },
};
