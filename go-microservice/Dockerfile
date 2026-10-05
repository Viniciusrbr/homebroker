FROM golang:1.27-bookworm

RUN apt-get update && apt-get install -y build-essential

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

CMD [ "go", "run", "cmd/trade/main.go" ]
