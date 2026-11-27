FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/model/package.json packages/model/
COPY packages/i18n/package.json packages/i18n/
COPY packages/platform/package.json packages/platform/
COPY packages/catalog/package.json packages/catalog/
COPY packages/engine/package.json packages/engine/
COPY tools/eslint-plugin-flow/package.json tools/eslint-plugin-flow/
RUN pnpm install --frozen-lockfile
COPY . .
ARG SOURCE_COMMIT=dev
ENV SOURCE_COMMIT=$SOURCE_COMMIT
RUN pnpm --filter @flow/web build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist/ /usr/share/nginx/html/
EXPOSE 80
