// Read runtime config if present (injected via /env.js)
const runtime: any = (globalThis as any).__env || {};

export const environment = {
  production: true,
  // For dev domain behind proxy, default to relative '/api'
  apiBaseUrl: runtime.apiBaseUrl ?? '/api',
  paypalClientId: runtime.paypalClientId ?? '',
  socket: {
    // Prefer same-origin sockets via nginx proxy; can be empty string to use current origin
    url: runtime.socket?.url ?? '',
    path: runtime.socket?.path ?? '/socket.io',
  },
};
