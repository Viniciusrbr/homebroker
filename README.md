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

O trecho Next.js ↔ NestJS ↔ MongoDB (HTTP + WebSocket) já está funcionando. A ponte via Kafka com o simulador da B3 ainda está em construção: o domínio do simulador existe, mas a mensageria não foi integrada.

### Componentes

| Componente | Tecnologia | Responsabilidade |
| --- | --- | --- |
| **Front-end** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Lightweight Charts, Zustand, Socket.IO Client | Interface do usuário: listagem de ativos, gráficos de cotação, formulário de ordens e visualização da carteira, com estado sincronizado em tempo real. |
| **API da corretora** | NestJS 12, Mongoose, MongoDB | Gerencia ordens de compra e venda, organiza os dados de usuários/carteiras e disponibiliza as informações para o front-end. |
| **Comunicação em tempo real** | WebSockets (Socket.IO) + MongoDB Change Streams | Envio contínuo e imediato de cotações, cotações diárias e criação de ordens, com salas (*rooms*) por símbolo de ativo. |
| **Mensageria** | Apache Kafka | Ponto central de comunicação assíncrona e de alta resiliência entre a corretora e o simulador da bolsa. |
| **Simulador da B3** | Go | Microsserviço que simula a bolsa de valores: processa todas as transações de compra e venda e as consultas de mercado, explorando a performance e a concorrência do Go (goroutines e channels) para garantir velocidade de execução, disponibilidade contínua e confiabilidade nas informações. |
| **Infraestrutura** | Docker / Docker Compose | Execução de todos os microsserviços em containers. |

### Fluxo de uma ordem

1. O usuário cria uma ordem de compra ou venda pelo front-end, que a envia via WebSocket (`orders/create`).
2. A API NestJS persiste a ordem no MongoDB com status `PENDING` e — nas próximas etapas do projeto — a publicará em um tópico do Kafka.
3. O simulador da B3 (Go) consome a ordem, insere-a no livro de ordens (*order book*), faz o *matching* com ordens contrárias e publica o resultado (execução total, parcial ou falha) em outro tópico.
4. A API consome o resultado, atualiza o status da ordem (`OPEN`, `CLOSED` ou `FAILED`), ajusta a carteira do usuário e notifica o front-end via WebSocket.

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

O núcleo de domínio do simulador já está implementado em [`go-microservice/internal/market/entity`](./go-microservice/internal/market/entity):

- **`Book`** — livro de ordens. Recebe ordens pelo channel `IncomingOrders`, mantém filas (`orderQueue`) de compra e venda por ativo, executa o *matching* e devolve as ordens processadas pelo channel `ProcessedOrders`, coordenadas por um `sync.WaitGroup`.
- **`Order`** — ordem com `Shares`, `PendingShares`, `Price`, `OrderType` (`BUY`/`SELL`) e `Status` (`OPEN`/`CLOSED`), suportando execução parcial via `ApplyTrade`.
- **`Transaction`** — negociação entre uma ordem de compra e uma de venda.
- **`OrderProcessor`** — calcula a quantidade negociável, atualiza as posições dos investidores e o estado das ordens.
- **`Investor`** / **`Asset`** — investidor com suas posições e o ativo negociado.

Ainda faltam a camada de transporte (consumer/producer Kafka) e o `main.go`.

## Estrutura do repositório

```
homebroker/
├── nestjs-api/        # API da corretora (NestJS + MongoDB)
│   ├── .docker/       # Dockerfile do MongoDB em modo replica set
│   ├── assets/        # Imagens (logos) dos ativos
│   ├── src/
│   │   ├── assets/    # Módulo de ativos (ações)
│   │   ├── orders/    # Módulo de ordens de compra e venda
│   │   └── wallets/   # Módulo de carteiras
│   └── docker-compose.yaml
├── kafka/             # Zookeeper, Kafka e Control Center (compartilhado)
├── nextjs-frontend/   # Interface web (Next.js)
│   └── src/
│       ├── app/       # Rotas: /, /assets, /assets/[assetSymbol], /orders
│       ├── components/
│       ├── lib/       # Cliente Socket.IO e utilitários
│       ├── queries/   # Funções de acesso à API
│       └── store.ts   # Store Zustand de ativos (preços em tempo real)
├── go-microservice/   # Simulador da B3 (Go) — em desenvolvimento
│   └── internal/market/entity/   # Livro de ordens, ordens, transações e investidores
├── docker-compose.yaml  # Sobe todo o ecossistema
└── api.http           # Requisições de exemplo (REST Client)
```

## Modelo de dados

- **Asset** — ativo negociado: `name`, `symbol`, `price`, `image`.
- **Wallet** — carteira de um usuário, contendo uma lista de **WalletAsset** (`asset`, `shares`).
- **Order** — ordem de negociação: `wallet`, `asset`, `shares`, `partial`, `price`, `type` (`BUY` | `SELL`) e `status` (`PENDING` | `OPEN` | `CLOSED` | `FAILED`).
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

Responda `n` às perguntas para apenas criar os dados base; o processo não encerra sozinho, finalize com `Ctrl+C`.

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
- [ ] Atualizações de ordens e de carteira em tempo real para o front-end
- [ ] Integração com Apache Kafka (publicação e consumo de ordens)
- [ ] Camada de transporte do simulador da B3 (consumer/producer Kafka e `main.go`)
- [ ] Testes do domínio do simulador em Go
- [ ] Serviço de arquivos para as imagens dos ativos (hoje o presenter aponta para `localhost:9000`)
- [x] Docker Compose unificado para subir todo o ecossistema (front-end, API, Kafka, MongoDB e simulador)
- [ ] Autenticação de usuários

## Licença

Projeto de estudo, sem licença definida.
