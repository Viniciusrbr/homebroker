#!/bin/sh
# Executado pelo `nest start --watch --exec` a cada compilação bem-sucedida, recebendo os
# argumentos do node para o main compilado. Antes de recompilar, o Nest encerra a árvore
# inteira deste processo, então a API e o consumidor Kafka sempre reiniciam juntos e só
# depois que o dist/ está completo (diferente do `node --watch`, que reiniciava no meio da
# escrita do dist/ ou do node_modules e ficava parado depois de um erro).

# se um dos processos cair (ex.: Kafka indisponível), ele volta sozinho
keep_running() {
  while true; do
    "$@" &
    wait $!
    echo "[dev-processes] '$*' exited with code $?, restarting in 2s..."
    sleep 2
  done
}

keep_running node "$@" &
keep_running node --enable-source-maps dist/_cmd/kafka.cmd.js &
wait
