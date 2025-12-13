# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .editorconfig .prettierrc .prettierignore .gitignore ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
RUN pnpm -w build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=deps /app/node_modules ./node_modules
CMD ["node", "apps/worker/dist/main.js"]
