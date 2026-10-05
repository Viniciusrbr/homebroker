package main

import (
	"encoding/json"
	"fmt"
	"microservice/infra/kafka"
	"microservice/internal/market/dto"
	"microservice/internal/market/entity"
	"microservice/internal/market/transformer"
	"os"
	"sync"

	ckafka "github.com/confluentinc/confluent-kafka-go/kafka"
)

func main() {
	// Canais para comunicação entre componentes
	ordersIn := make(chan *entity.Order)  // Canal para novas ordens
	ordersOut := make(chan *entity.Order) // Canal para ordens processadas
	wg := &sync.WaitGroup{}               // WaitGroup para sincronização de goroutines
	defer wg.Wait()                       // Aguarda todas as goroutines terminarem

	// Canal para receber mensagens do Kafka
	kafkaMsgChan := make(chan *ckafka.Message)

	// Endereço do broker Kafka (no Docker, via host.docker.internal)
	kafkaBroker := os.Getenv("KAFKA_BROKER")
	if kafkaBroker == "" {
		kafkaBroker = "localhost:9094"
	}

	// Configuração do consumidor Kafka
	// - bootstrap.servers: endereço do broker Kafka
	// - group.id: identificador do grupo de consumo
	// - auto.offset.reset: de onde começar a ler as mensagens
	consumerConfig := &ckafka.ConfigMap{
		"bootstrap.servers": kafkaBroker,
		"group.id":          "trade",
		"auto.offset.reset": "earliest",
	}

	// Configuração do produtor Kafka
	// - bootstrap.servers: endereço do broker Kafka
	producerConfig := &ckafka.ConfigMap{
		"bootstrap.servers": kafkaBroker,
	}

	// Inicializa produtor e consumidor Kafka
	producer := kafka.NewKafkaProducer(producerConfig)
	consumer := kafka.NewConsumer(consumerConfig, []string{"input"})

	// Inicia o consumo de mensagens em uma goroutine separada
	go consumer.Consume(kafkaMsgChan)

	// Cria e inicia o livro de ofertas em uma goroutine separada
	book := entity.NewBook(ordersIn, ordersOut, wg)
	go book.Trade()

	// Goroutine para processar mensagens recebidas do Kafka
	go func() {
		for msg := range kafkaMsgChan {
			wg.Add(1) // Incrementa o contador do WaitGroup para cada ordem
			fmt.Println(string(msg.Value))

			// Converte a mensagem JSON recebida para struct
			tradeInput := dto.TradeInput{}
			err := json.Unmarshal(msg.Value, &tradeInput)
			if err != nil {
				panic(err)
			}

			// Transforma o input em uma ordem e envia para processamento
			order := transformer.TransformInput(tradeInput)
			ordersIn <- order
		}
	}()

	// Loop principal para processar ordens executadas
	for res := range ordersOut {
		// Transforma a ordem processada em output JSON
		output := transformer.TransformOutput(res)
		jsonOutput, err := json.MarshalIndent(output, "", "  ")
		if err != nil {
			panic(err)
		}

		// Imprime e publica o resultado no Kafka
		fmt.Println(string(jsonOutput))
		producer.Publish(jsonOutput, []byte("output"), "output")
	}

}
