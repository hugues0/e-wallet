FROM node:21 AS builder

WORKDIR /app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run prisma:generate

RUN npm run prisma:migrate:deploy


RUN npm run build

FROM node:21-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 9000

CMD ["npm", "run", "start:prod"]