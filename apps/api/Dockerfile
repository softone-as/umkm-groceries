FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace=@santo/shared \
  && npm run build --workspace=@santo/api \
  && mkdir -p apps/api/dist/db/migrations \
  && cp apps/api/src/db/migrations/*.sql apps/api/dist/db/migrations/

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

EXPOSE 3000
CMD ["sh", "-c", "node apps/api/dist/db/migrate.js up && node apps/api/dist/server.js"]