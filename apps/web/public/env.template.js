// This file is rendered at build time from environment variables
// Do NOT commit secrets directly. Values are injected by the CI pipeline.
window.__env = {
  apiBaseUrl: "${API_URL:-/api}",
  paypalClientId: "${PAYPAL_CLIENT_ID:-}",
  socket: {
    url: "${SOCKET_URL:-}",
    path: "${SOCKET_PATH:-/socket.io}",
  },
};
