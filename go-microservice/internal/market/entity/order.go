package entity

type Order struct {
	ID            string
	Investor      *Investor
	Asset         *Asset
	Shares        int
	PendingShares int
	Price         float64
	OrderType     string
	Status        string
	Transactions  []*Transaction
}

func NewOrder(orderID string, investor *Investor, asset *Asset, shares int, price float64, orderType string) *Order {
	return &Order{
		ID:            orderID,
		Investor:      investor,
		Asset:         asset,
		Shares:        shares,
		PendingShares: shares,
		Price:         price,
		OrderType:     orderType,
		Status:        "OPEN",
		Transactions:  []*Transaction{},
	}
}

func (o *Order) ApplyTrade(tradedShares int) {
	if tradedShares > o.PendingShares {
		tradedShares = o.PendingShares
	}
	o.PendingShares -= tradedShares
	if o.PendingShares == 0 {
		o.Status = "CLOSED"
	}
}

func (o *Order) AddTransaction(t *Transaction) {
	o.Transactions = append(o.Transactions, t)
}
