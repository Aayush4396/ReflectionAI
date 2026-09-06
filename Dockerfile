# Multi-stage Dockerfile for ReflectAI on Google Cloud Run
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code and ensure config is present
COPY . .
RUN if [ ! -f firebase-applet-config.json ]; then cp firebase-applet-config.example.json firebase-applet-config.json; fi
RUN npm run build

# Production runtime stage
FROM node:22-slim AS runner

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/server.cjs"]
