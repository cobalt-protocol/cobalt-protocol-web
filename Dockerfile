FROM oven/bun:1-alpine

WORKDIR /app

# Copy package configs for workspace
COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code and build
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "--cwd", "apps/web", "start", "-H", "0.0.0.0"]


