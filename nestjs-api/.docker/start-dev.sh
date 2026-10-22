#!/bin/sh
# Sobe, no mesmo container, a API HTTP/WebSocket, o consumidor Kafka e o servidor das imagens dos ativos
set -e

pnpm install

rm -rf dist

# a API e o consumidor Kafka reaproveitam o mesmo build em watch (ver dev-processes.sh)
pnpm exec nest start --watch --exec "sh .docker/dev-processes.sh" &

pnpm assets-image &

wait
