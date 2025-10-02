# Build Angular app
FROM node:20-alpine AS build
WORKDIR /workspace

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the entire repo (Nx workspace)
COPY . .

# Inject runtime config (from build args) into public/env.js
ARG API_URL=/api
ARG PAYPAL_CLIENT_ID=
ARG SOCKET_URL=
ARG SOCKET_PATH=/socket.io
RUN apk add --no-cache gettext && \
    export API_URL="$API_URL" PAYPAL_CLIENT_ID="$PAYPAL_CLIENT_ID" SOCKET_URL="$SOCKET_URL" SOCKET_PATH="$SOCKET_PATH" && \
    envsubst < apps/web/public/env.template.js > apps/web/public/env.js

# Build the web app (production build, suitable for dev domain, uses runtime config)
RUN npx nx build web --configuration=production

# Debug: List build output to verify
RUN echo "=== Build output ===" && \
    ls -la dist/ && \
    ls -la dist/cooksona-angular/ || echo "Build output not found!"

## Runtime image
FROM nginx:alpine AS runtime

# Copy a simple nginx config with SPA fallback
COPY apps/web/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage (NOTE: Angular outputs to /browser subdirectory)
COPY --from=build /workspace/dist/cooksona-angular/browser/ /usr/share/nginx/html/

# Verify files were copied (for debugging)
RUN echo "=== Nginx html directory ===" && \
    ls -la /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

