FROM node:24-slim

RUN npm install -g pnpm@12.4.1

USER node

WORKDIR /home/node/app

CMD [ "sh", "-c", "pnpm install && pnpm dev" ]
