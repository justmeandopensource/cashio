package ledger

import (
	"fmt"

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
