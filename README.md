# Home Broker

> Corretora fictícia para compra e venda de ações, com acompanhamento do mercado em tempo real e consulta da carteira de ativos de cada usuário.

> **Status:** projeto em andamento. Veja a seção [Roadmap](#roadmap) para saber o que já está pronto e o que ainda será desenvolvido.

## Visão geral

O objetivo do Home Broker é construir um ecossistema de negociação **confiável e escalável**, com foco na melhor experiência possível para o usuário. A plataforma permite:

- **Comprar e vender ações** por meio de ordens de compra (`BUY`) e venda (`SELL`).
- **Acompanhar o mercado em tempo real**, com cotações atualizadas de forma contínua.
- **Consultar a carteira de ativos** de cada usuário, com posições e histórico de ordens.

Para isso, o sistema é composto por microsserviços independentes que se comunicam de forma síncrona (HTTP/WebSocket) e assíncrona (Apache Kafka), todos executados em containers Docker.

## Arquitetura

```
┌──────────────────┐   HTTP / WebSocket   ┌──────────────────┐    Kafka     ┌──────────────────────┐
│                  │ ◄──────────────────► │                  │ ◄──────────► │                      │
│  Next.js         │                      │  NestJS API      │              │  Simulador da B3     │
│  (front-end)     │                      │  (corretora)     │              │  (Go)                │
│                  │                      │                  │              │                      │
└──────────────────┘                      └────────┬─────────┘              └──────────────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │  MongoDB         │
                                          │  (replica set)   │
                                          └──────────────────┘
```

Todo o ciclo já está funcionando de ponta a ponta: o front-end fala com a API via HTTP/WebSocket, a API publica as ordens no Kafka, o simulador em Go faz o *matching* e devolve os negócios, e a API os persiste no MongoDB, cujas Change Streams levam os novos preços de volta ao front-end.

### Componentes

| Componente | Tecnologia | Responsabilidade |
| --- | --- | --- |
| **Front-end** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Lightweight Charts, Zustand, Socket.IO Client | Interface do usuário: listagem de ativos, gráficos de cotação, formulário de ordens e visualização da carteira, com estado sincronizado em tempo real. |
| **API da corretora** | NestJS 12, Mongoose, MongoDB | Gerencia ordens de compra e venda, organiza os dados de usuários/carteiras e disponibiliza as informações para o front-end. |
| **Comunicação em tempo real** | WebSockets (Socket.IO) + MongoDB Change Streams | Envio contínuo e imediato de cotações, cotações diárias e criação de ordens, com salas (*rooms*) por símbolo de ativo. |
| **Mensageria** | Apache Kafka (Confluent), `@confluentinc/kafka-javascript`, `confluent-kafka-go` | Ponto central de comunicação assíncrona e de alta resiliência entre a corretora e o simulador da bolsa. No NestJS, um transporte customizado ([`ConfluentKafkaServer`](./nestjs-api/src/kafka/confluent-kafka-server.ts)) integra o cliente da Confluent aos `@EventPattern` do `@nestjs/microservices`. |
| **Simulador da B3** | Go 1.27 | Microsserviço que simula a bolsa de valores: processa todas as transações de compra e venda e as consultas de mercado, explorando a performance e a concorrência do Go (goroutines e channels) para garantir velocidade de execução, disponibilidade contínua e confiabilidade nas informações. |
| **Infraestrutura** | Docker / Docker Compose | Execução de todos os microsserviços em containers. |

### Fluxo de uma ordem

1. O usuário cria uma ordem de compra ou venda pelo front-end, que a envia via WebSocket (`orders/create`).
2. A API NestJS persiste a ordem no MongoDB com status `PENDING` e a publica no tópico `input` do Kafka.
3. O simulador da B3 (Go) consome a ordem, insere-a no livro de ordens (*order book*), faz o *matching* com ordens contrárias e publica o resultado (execução total ou parcial, com as transações realizadas) no tópico `output`.
4. O consumidor Kafka da API ([`OrderConsumer`](./nestjs-api/src/orders/orders.consumer.ts)) recebe o resultado e, numa única transação do MongoDB:
   - registra um **Trade** e atualiza `partial` e `status` (`OPEN` ou `CLOSED`) da ordem;
   - se a ordem foi fechada, ajusta a posição na carteira do usuário;
   - se foi uma compra fechada, atualiza o preço do ativo e cria a cotação diária, se ainda não existir.
5. As Change Streams detectam a mudança de preço/cotação e a API a envia ao front-end via WebSocket.

### Tópicos Kafka

| Tópico | Produtor → Consumidor | Payload |
| --- | --- | --- |
| `input` | NestJS → Go | `order_id`, `investor_id`, `asset_id`, `shares`, `price`, `order_type` |
| `output` | Go → NestJS | `order_id`, `investor_id`, `asset_id`, `order_type`, `status`, `partial`, `shares` e a lista `transactions` (`transaction_id`, `buyer_id`, `seller_id`, `asset_id`, `price`, `shares`) |

### Tempo real (WebSocket)

A API expõe dois gateways Socket.IO (`cors: true`) na mesma porta HTTP:

| Gateway | Evento | Direção | Descrição |
| --- | --- | --- | --- |
| `OrdersGateway` | `orders/create` | cliente → servidor | Cria uma ordem e retorna a ordem criada |
| `AssetsGateway` | `joinAsset` / `joinAssets` | cliente → servidor | Assina as atualizações de um ou vários símbolos |
| `AssetsGateway` | `leaveAsset` / `leaveAssets` | cliente → servidor | Cancela a assinatura |
| `AssetsGateway` | `assets/price-changed` | servidor → cliente | Novo preço de um ativo |
| `AssetsGateway` | `assets/daily-created` | servidor → cliente | Nova cotação diária de um ativo |

As emissões do servidor são disparadas por **Change Streams** do MongoDB: a API observa alterações nas coleções de ativos e de cotações diárias e propaga os eventos apenas para a sala do símbolo correspondente. É por isso que o MongoDB precisa rodar como *replica set*.

No front-end, o componente [`AssetsSync`](./nextjs-frontend/src/components/AssetsSync.tsx) conecta o socket, entra nas salas dos ativos exibidos e atualiza a store Zustand ([`store.ts`](./nextjs-frontend/src/store.ts)), de onde as tabelas e o gráfico leem os preços.

### Simulador da B3 (Go)

O ponto de entrada é [`cmd/trade/main.go`](./go-microservice/cmd/trade/main.go): ele consome o tópico `input` (grupo `trade`) em uma goroutine, converte cada mensagem em `Order` ([`transformer`](./go-microservice/internal/market/transformer/transformer.go) + [`dto`](./go-microservice/internal/market/dto/dto.go)), envia-a ao livro de ordens e publica cada ordem processada no tópico `output`. O transporte Kafka fica em [`infra/kafka`](./go-microservice/infra/kafka).

O núcleo de domínio fica em [`go-microservice/internal/market/entity`](./go-microservice/internal/market/entity):

- **`Book`** — livro de ordens. Recebe ordens pelo channel `IncomingOrders`, mantém filas (`orderQueue`) de compra e venda por ativo, executa o *matching* e devolve as ordens processadas pelo channel `ProcessedOrders`, coordenadas por um `sync.WaitGroup`.
- **`Order`** — ordem com `Shares`, `PendingShares`, `Price`, `OrderType` (`BUY`/`SELL`) e `Status` (`OPEN`/`CLOSED`), suportando execução parcial via `ApplyTrade`.
- **`Transaction`** — negociação entre uma ordem de compra e uma de venda.
- **`OrderProcessor`** — calcula a quantidade negociável, atualiza as posições dos investidores e o estado das ordens.
- **`Investor`** / **`Asset`** — investidor com suas posições e o ativo negociado.

## Estrutura do repositório

```
homebroker/
├── nestjs-api/        # API da corretora (NestJS + MongoDB)
│   ├── .docker/       # MongoDB em replica set e script de start do container
│   ├── assets/        # Imagens (logos) dos ativos
│   ├── src/
│   │   ├── _cmd/      # Entrypoint do consumidor Kafka
│   │   ├── assets/    # Módulo de ativos (ações)
│   │   ├── kafka/     # Transporte Kafka customizado (Confluent)
│   │   ├── orders/    # Ordens, trades e consumidor do tópico `output`
│   │   ├── wallets/   # Módulo de carteiras
│   │   └── simulate-assets-price.command.ts  # Comando de seed/simulação
│   └── docker-compose.yaml
├── kafka/             # Zookeeper, Kafka e Control Center (compartilhado)
├── nextjs-frontend/   # Interface web (Next.js)
│   └── src/
│       ├── app/       # Rotas: /, /assets, /assets/[assetSymbol], /orders
│       ├── components/
│       ├── lib/       # Cliente Socket.IO e utilitários
│       ├── queries/   # Funções de acesso à API
│       └── store.ts   # Store Zustand de ativos (preços em tempo real)
├── go-microservice/   # Simulador da B3 (Go)
│   ├── cmd/trade/     # main.go: liga o Kafka ao livro de ordens
│   ├── infra/kafka/   # Consumer e producer Kafka
│   └── internal/market/
│       ├── entity/       # Livro de ordens, ordens, transações e investidores
│       ├── dto/          # Formato das mensagens dos tópicos
│       └── transformer/  # Conversão DTO ↔ entidades
├── docker-compose.yaml  # Sobe todo o ecossistema
└── api.http           # Requisições de exemplo (REST Client)
```

## Modelo de dados

- **Asset** — ativo negociado: `name`, `symbol`, `price`, `image`.
- **Wallet** — carteira de um usuário, contendo uma lista de **WalletAsset** (`asset`, `shares`).
- **Order** — ordem de negociação: `wallet`, `asset`, `shares`, `partial`, `price`, `type` (`BUY` | `SELL`), `status` (`PENDING` | `OPEN` | `CLOSED` | `FAILED`) e `trades`.
- **Trade** — negócio executado pelo simulador para uma ordem: `order`, `broker_trade_id`, `related_investor_id` (contraparte), `shares`, `price`.
- **AssetDaily** — cotação diária de um ativo (`date`, `price`), usada nos gráficos.

## API (NestJS)

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/assets` | Cadastra um ativo |
| `GET` | `/assets` | Lista os ativos |
| `GET` | `/assets/:symbol` | Detalha um ativo pelo símbolo |
| `GET` | `/assets/:symbol/dailies` | Lista as cotações diárias de um ativo |
| `POST` | `/assets/:symbol/dailies` | Registra uma cotação diária |
| `POST` | `/wallets` | Cria uma carteira |
| `GET` | `/wallets` | Lista as carteiras |
| `GET` | `/wallets/:id` | Detalha uma carteira com seus ativos |
| `POST` | `/wallets/:id/assets` | Adiciona um ativo à carteira |
| `POST` | `/orders` | Cria uma ordem de compra ou venda |
| `GET` | `/orders?walletId=` | Lista as ordens de uma carteira |
| `GET` | `/orders/:id` | Detalha uma ordem |

> A criação de ordens também está disponível via WebSocket (`orders/create`), que é o caminho usado pelo front-end.

Exemplos prontos de requisições estão em [`api.http`](./api.http) (compatível com a extensão REST Client do VS Code).

## Como executar (ambiente de desenvolvimento)

Todo o ecossistema sobe com Docker Compose a partir da raiz do repositório. O código de cada projeto é montado como volume, então alterações locais recarregam automaticamente.

```bash
docker compose up -d --build
```

| Serviço | Endereço |
| --- | --- |
| Front-end (Next.js) | http://localhost:3001 |
| API (NestJS) | http://localhost:3000 |
| Imagens dos ativos | http://localhost:9000 |
| Kafka Control Center | http://localhost:9021 |
| MongoDB (`root` / `root`) | `localhost:27017` |

O Kafka leva uns 30 segundos para ficar disponível; até lá, o simulador em Go registra erros de conexão e reconecta sozinho.

O container `nest` roda a API, o consumidor Kafka (`dist/_cmd/kafka.cmd.js`) e o servidor de imagens ([`.docker/start-dev.sh`](./nestjs-api/.docker/start-dev.sh)).

### Popular o banco

Cria ativos, duas carteiras e as posições iniciais (apaga os dados existentes):

```bash
docker compose exec nest node dist/command.js simulate-assets-price
```

O comando faz duas perguntas:

- **Gerar ordens de compra e venda?** — `y` cria ~100 pares de ordens `SELL`/`BUY` de AMZN (uma a cada 2 s), publicadas no Kafka; o simulador as casa e os preços passam a variar em tempo real no front-end.
- **Gerar ordens de fechamento?** — `y` também fecha cada par diretamente na API (sem passar pelo simulador).

Responda `n` para apenas criar os dados base. O processo não encerra sozinho; finalize com `Ctrl+C`.

### Logs

```bash
docker compose logs -f nest golang next
```

### Variáveis de ambiente

Fora do Docker, os valores padrão apontam para `localhost`, então cada projeto continua rodando com `pnpm start:dev` / `pnpm dev` / `go run cmd/trade/main.go`.

| Variável | Projeto | Uso |
| --- | --- | --- |
| `MONGO_URL` | nestjs-api | String de conexão do MongoDB |
| `KAFKA_BROKER` | nestjs-api, go-microservice | Endereço do broker Kafka |
| `ASSETS_URL` / `ASSETS_HOST` | nestjs-api | URL pública e host de bind do servidor de imagens |
| `API_URL` | nextjs-frontend | URL da API usada nas chamadas feitas pelo servidor do Next |

### Testes e lint

```bash
# nestjs-api
pnpm test        # unitários (Vitest)
pnpm test:e2e    # end-to-end
pnpm lint        # oxlint

# nextjs-frontend
pnpm lint        # biome
```

## Roadmap

- [x] API REST de ativos, carteiras e ordens (NestJS + MongoDB)
- [x] Front-end com listagem de ativos, gráfico de cotações, formulário de ordens e carteira
- [x] MongoDB em replica set via Docker
- [x] Histórico de cotações diárias (`/assets/:symbol/dailies`) e sua exibição no gráfico
- [x] Cotações em tempo real via WebSocket (Socket.IO + Change Streams) com salas por ativo
- [x] Criação de ordens via WebSocket
- [x] Sincronização do estado de ativos no front-end com Zustand
- [x] Núcleo de domínio do simulador da B3 em Go: livro de ordens, *matching* e execução parcial
- [x] Integração com Apache Kafka (publicação de ordens no `input` e consumo de negócios do `output`)
- [x] Camada de transporte do simulador da B3 (consumer/producer Kafka e `main.go`)
- [x] Registro de trades, atualização de carteira, preço e cotação diária a partir dos negócios executados
- [x] Servidor de imagens dos ativos com URL configurável (`ASSETS_URL`)
- [x] Docker Compose unificado para subir todo o ecossistema (front-end, API, Kafka, MongoDB e simulador)

### Melhorias futuras

**Segurança e validação**

- [ ] Validação das requisições HTTP (DTOs com `class-validator` / `ValidationPipe`)
- [ ] Validação das mensagens recebidas via WebSocket
- [ ] Autenticação de usuários na API e no Next.js
- [ ] Impedir que um usuário se inscreva no WebSocket de notificação de ordens que não são dele

**Carteira e ordens**

- [ ] Saldo em reais para a carteira
- [ ] Em ordens de venda, verificar se a carteira tem saldo suficiente do ativo
- [ ] Atualização de saldo orientada a eventos, separando a finalização da ordem da atualização do saldo do ativo na carteira
- [ ] Reprocessamento da finalização das ordens em caso de falha (incluindo o tratamento do status `FAILED`)

**Tempo real e front-end**

- [ ] Evento de WebSocket para atualizar o saldo do ativo na carteira
- [ ] Notificação no Next.js (via WebSocket) quando uma ordem for executada
- [ ] Não emitir eventos de WebSocket quando não houver clientes inscritos

**Performance**

- [ ] Cache no servidor para consultas de ativos e ordens fora do horário de pregão, quando os preços ficam fixos

**Qualidade**

- [ ] Testes da API, do front-end e do domínio do simulador em Go

## Licença

Projeto de estudo, sem licença definida.
