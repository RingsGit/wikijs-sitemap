FROM node:20-alpine

LABEL maintainer="analog-ic.com"

WORKDIR /wiki/sitemap

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3012

CMD ["node", "server"]

