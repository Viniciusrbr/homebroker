#!/bin/sh
# Sobe, no mesmo container, a API HTTP/WebSocket, o consumidor Kafka e o servidor das imagens dos ativos
set -e

pnpm install

rm -rf dist
pnpm start:dev &

# o consumidor Kafka reaproveita o build em watch da API
until [ -f dist/_cmd/kafka.cmd.js ]; do sleep 1; done
node --watch dist/_cmd/kafka.cmd.js &

pnpm assets-image &

wait
