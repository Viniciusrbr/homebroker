package entity

type OrderProcessor struct {
	Transaction *Transaction
}

func NewOrderProcessor(transaction *Transaction) *OrderProcessor {
	return &OrderProcessor{
		Transaction: transaction,
	}
}

func (op *OrderProcessor) Process() {
	shares := op.calculateShares()
	op.UpdatePositions(shares)
	op.UpdateOrders(shares)
	op.Transaction.Total = float64(shares) * op.Transaction.Price
}

func (op *OrderProcessor) calculateShares() int {
	availableShares := op.Transaction.Shares

	if op.Transaction.BuyingOrder.PendingShares < availableShares {
		availableShares = op.Transaction.BuyingOrder.PendingShares
	}

	if op.Transaction.SellingOrder.PendingShares < availableShares {
		availableShares = op.Transaction.SellingOrder.PendingShares
	}

	return availableShares
}

func (op *OrderProcessor) UpdatePositions(shares int) {
	op.Transaction.SellingOrder.Investor.AdjustAssetPosition(op.Transaction.SellingOrder.Asset.ID, -shares)
	op.Transaction.BuyingOrder.Investor.AdjustAssetPosition(op.Transaction.BuyingOrder.Asset.ID, shares)
}

func (op *OrderProcessor) UpdateOrders(shares int) {
	op.Transaction.BuyingOrder.ApplyTrade(shares)
	op.Transaction.SellingOrder.ApplyTrade(shares)
}
