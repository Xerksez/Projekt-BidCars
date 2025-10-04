FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm i --frozen-lockfile
RUN pnpm --filter api build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["pnpm","--filter","api","start:prod"]
