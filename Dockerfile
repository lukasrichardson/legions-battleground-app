FROM node:26.12.0-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:26.12.0-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/next.config.ts ./next.config.ts
# Only the runtime cache is writable; application code and dependencies stay root-owned.
RUN mkdir -p /usr/src/app/.next/cache && chown node:node /usr/src/app/.next/cache
USER node
EXPOSE 3000
CMD ["npm", "start"]
