FROM node:22-alpine AS builder

WORKDIR /app

# Install Bun
RUN npm install -g bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:22-alpine AS runner

WORKDIR /app

# Install Bun
RUN npm install -g bun

# Install production dependencies only
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy built assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Run the Next.js production server
CMD ["bun", "run", "start"]
