FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm i --frozen-lockfile
RUN pnpm --filter web build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm","--filter","web","start"]
