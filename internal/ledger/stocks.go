package ledger

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/justmeandopensource/cashio/internal/common"
)

// A stock is a representation of a record from the stocks table
type Stock struct {
	ID       int
	Name     string
	Type     string
	Status   string
	Units    float64
	Nav      float64
	Invested float64
}

type StockTransaction struct {
	TransactionType string
	StockID         int
	StockName       string
	Date            time.Time
	Units           float64
	Nav             float64
	Amount          float64
	BankAccountID   int
}

// AddAccount adds the given account to the database
func AddStock(ledger string, stock Stock) error {

	stmt, err := common.DbConn.Prepare(fmt.Sprintf(`
    INSERT INTO %s_stocks (name, type)
    VALUES (?, ?)
    `, ledger))
	if err != nil {
		return err
	}

	_, err = stmt.Exec(
		stock.Name,
		stock.Type,
	)
	if err != nil {
		return err
	}

	defer stmt.Close()

	return nil
}

// FetchStocks fetches stock records for the given ledger from the database and returns a slice of Stock struct.
func FetchStocks(ledger string, stockStatus string) ([]*Stock, error) {

	var (
		queryFilter string
		stocks      []*Stock
	)

	switch stockStatus {
	case "active":
		queryFilter = "WHERE status = 'active'"
	case "holding":
		queryFilter = "WHERE status = 'holding'"
	default:
		queryFilter = "WHERE 1"
	}

	query := fmt.Sprintf(`
    SELECT id, name, type, status, units, nav, invested
    FROM %s_stocks
    %s
    ORDER BY type,status,name;
    `, ledger, queryFilter)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var name, stockType, status string
		var units, nav, invested float64
		if err := rows.Scan(&id, &name, &stockType, &status, &units, &nav, &invested); err != nil {
			return nil, err
		}

		stock := &Stock{
			ID:       id,
			Name:     name,
			Type:     stockType,
			Status:   status,
			Units:    units,
			Nav:      nav,
			Invested: invested,
		}

		stocks = append(stocks, stock)
	}

	return stocks, nil
}

// GetStockID returns the stock id of the given stock
func GetStockID(stockName string, stocks []*Stock) int {
	stockName = strings.TrimSpace(stockName)
	for _, stock := range stocks {
		if stock.Name == stockName {
			return stock.ID
		}
	}
	return 0
}

// GetStockType returns the stock type of the given stock
func GetStockType(stockName string, stocks []*Stock) string {
	stockName = strings.TrimSpace(stockName)
	for _, stock := range stocks {
		if stock.Name == stockName {
			return stock.Type
		}
	}
	return ""
}

// ActionStockUnits adds stock purchase/redeem related transactions to the database
func ActionStockUnits(ledgerName string, stockTransaction StockTransaction) error {

	tx, err := common.DbConn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Add the main transaction
	_, err = tx.Exec(
		fmt.Sprintf(
			`
      INSERT INTO %s_stocks_transactions (date, notes, units, nav, amount, stock_id, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ledgerName,
		),
		stockTransaction.Date.Format("2006-01-02"),
		stockTransaction.TransactionType,
		stockTransaction.Units,
		stockTransaction.Nav,
		stockTransaction.Amount,
		stockTransaction.StockID,
		stockTransaction.BankAccountID,
	)
	if err != nil {
		return err
	}

	// update stock balance
	if err := updateStockBalance(tx, ledgerName, stockTransaction); err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	if stockTransaction.TransactionType != "switch" {
		transaction := Transaction{
			Date:       stockTransaction.Date,
			Notes:      fmt.Sprintf("<trans> stock %s - %s", stockTransaction.TransactionType, stockTransaction.StockName),
			AccountID:  stockTransaction.BankAccountID,
			CategoryID: 0,
			IsSplit:    0,
		}

		switch stockTransaction.TransactionType {
		case "purchase":
			transaction.Credit = 0.00
			transaction.Debit = stockTransaction.Amount
		case "redeem":
			transaction.Credit = stockTransaction.Amount
			transaction.Debit = 0.00
		}

		if err := AddTransaction(ledgerName, transaction); err != nil {
			return err
		}
	}

	return nil
}

// updateStockBalance updates the balance of the given stock in the database.
// updateType can be either purchase or redeem
func updateStockBalance(tx *sql.Tx, ledgerName string, stockTransaction StockTransaction) error {

	if stockTransaction.Amount == 0.00 || stockTransaction.Units == 0.00 {
		return errors.New("invalid data")
	}

	var operator string
	switch stockTransaction.TransactionType {
	case "purchase":
		operator = "+"
	case "redeem":
		operator = "-"
	default:
		return errors.New("updateType is neither purchase nor redeem")
	}

	updateQuery := fmt.Sprintf(`
    UPDATE %s_stocks
    SET units = units %s ?,
				nav = ?,
		    invested = invested %s ?
    WHERE id = ?
  `, ledgerName, operator, operator)

	stmt, err := tx.Prepare(updateQuery)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(stockTransaction.Units, stockTransaction.Nav, stockTransaction.Amount, stockTransaction.StockID)
	if err != nil {
		return err
	}

	return nil
}
