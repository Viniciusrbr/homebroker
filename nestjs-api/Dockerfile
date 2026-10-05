FROM node:24-slim

RUN apt update && \
    apt install openssl procps -y && \
    npm install -g pnpm@12.4.1

USER node

WORKDIR /home/node/app

CMD [ "sh", ".docker/start-dev.sh" ]
