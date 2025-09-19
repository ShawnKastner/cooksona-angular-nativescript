export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  paypalClientId:
    'AWO5FlZk426Gbi5dapSMsFLyKzdxGdCdmovml4_NLqIwWcBJypn7LHCcBE7k8KKiXepnaQcEc6mta1OZ',
  // Optional: configure Socket.IO if your backend serves sockets on a different origin/path
  socket: {
    url: 'http://localhost:3000', // backend websocket server in dev
    path: '/socket.io',
  },
};
