# Development stage
FROM node:18 AS development

RUN apt-get update && apt-get install -y openssl

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node package-lock.json ./

COPY --chown=node:node prisma ./prisma/

COPY --chown=node:node prisma ./public/

RUN npm install --immutable --immutable-cache --check-cache

COPY --chown=node:node . .

RUN npm run prisma:generate

USER node


# Build stage
FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY --chown=node:node --from=development /usr/src/app/package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node prisma ./prisma/

COPY --chown=node:node prisma ./public/

COPY --chown=node:node . .

RUN npm run build

ENV NODE_ENV production

RUN npm install --immutable --immutable-cache --check-cache --production && npm cache clean --force

USER node


# Production stage
FROM node:18-alpine AS production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma
COPY --chown=node:node --from=build /usr/src/app/public ./public

CMD [  "npm", "run", "start:prod" ]