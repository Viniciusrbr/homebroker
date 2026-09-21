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

### Componentes

| Componente | Tecnologia | Responsabilidade |
| --- | --- | --- |
| **Front-end** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Lightweight Charts | Interface do usuário: listagem de ativos, gráficos de cotação, formulário de ordens e visualização da carteira. |
| **API da corretora** | NestJS 12, Mongoose, MongoDB | Gerencia ordens de compra e venda, organiza os dados de usuários/carteiras e disponibiliza as informações para o front-end. |
| **Comunicação em tempo real** | WebSockets | Envio contínuo e imediato de cotações, atualizações de ordens e mudanças na carteira para o front-end. |
| **Mensageria** | Apache Kafka | Ponto central de comunicação assíncrona e de alta resiliência entre a corretora e o simulador da bolsa. |
| **Simulador da B3** | Go | Microsserviço que simula a bolsa de valores: processa todas as transações de compra e venda e as consultas de mercado, explorando a performance e a concorrência do Go (goroutines) para garantir velocidade de execução, disponibilidade contínua e confiabilidade nas informações. |
| **Infraestrutura** | Docker / Docker Compose | Execução de todos os microsserviços em containers. |

### Fluxo de uma ordem

1. O usuário cria uma ordem de compra ou venda pelo front-end.
2. A API NestJS persiste a ordem no MongoDB com status `PENDING` e a publica em um tópico do Kafka.
3. O simulador da B3 (Go) consome a ordem, faz o *matching* com ordens contrárias e publica o resultado (execução total, parcial ou falha) em outro tópico.
4. A API consome o resultado, atualiza o status da ordem (`OPEN`, `CLOSED` ou `FAILED`), ajusta a carteira do usuário e notifica o front-end via WebSocket.

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
├── nextjs-frontend/   # Interface web (Next.js)
│   └── src/
│       ├── app/       # Rotas: /, /assets, /assets/[assetSymbol], /orders
│       ├── components/
│       └── queries/   # Funções de acesso à API
├── go-microservice/   # Simulador da B3 (Go) — em desenvolvimento
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
| `POST` | `/wallets` | Cria uma carteira |
| `GET` | `/wallets` | Lista as carteiras |
| `GET` | `/wallets/:id` | Detalha uma carteira com seus ativos |
| `POST` | `/wallets/:id/assets` | Adiciona um ativo à carteira |
| `POST` | `/orders` | Cria uma ordem de compra ou venda |
| `GET` | `/orders?walletId=` | Lista as ordens de uma carteira |
| `GET` | `/orders/:id` | Detalha uma ordem |

Exemplos prontos de requisições estão em [`api.http`](./api.http) (compatível com a extensão REST Client do VS Code).

## Como executar (ambiente de desenvolvimento)

### Pré-requisitos

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) e Docker Compose
- [Go](https://go.dev/) 1.22+ (para o simulador da B3)

### 1. Banco de dados

```bash
cd nestjs-api
docker compose up -d
```

Sobe um MongoDB 8 configurado como replica set (`rs0`), com usuário `root` / senha `root`, na porta `27017`.

### 2. API da corretora

```bash
cd nestjs-api
pnpm install
pnpm start:dev
```

A API fica disponível em `http://localhost:3000`.

### 3. Front-end

```bash
cd nextjs-frontend
pnpm install
pnpm dev
```

A aplicação fica disponível em `http://localhost:3000` (ou na próxima porta livre, caso a API já esteja usando a `3000`).

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
- [ ] Histórico de cotações diárias (`/assets/:symbol/dailies`)
- [ ] Comunicação em tempo real com WebSockets (cotações, ordens e carteira)
- [ ] Integração com Apache Kafka (publicação e consumo de ordens)
- [ ] Simulador da B3 em Go (matching de ordens e geração de cotações)
- [ ] Docker Compose unificado para subir todo o ecossistema (front-end, API, Kafka, MongoDB e simulador)
- [ ] Autenticação de usuários

## Licença

Projeto de estudo, sem licença definida.
