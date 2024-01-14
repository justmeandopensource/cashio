package ledger

import (
	"bufio"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
	"github.com/justmeandopensource/cashio/internal/common"
)

// A stock is a representation of a record from the stocks table
type Stock struct {
	ID       int
	Name     string
	Type     string
	Code     string
	Plan     string
	Status   string
	Units    float64
	Nav      float64
	NavDate  string
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
	BankName        *string
}

// AddAccount adds the given account to the database
func AddStock(ledger string, stock Stock) error {

	stmt, err := common.DbConn.Prepare(fmt.Sprintf(`
    INSERT INTO %s_stocks (name, type, code, plan)
    VALUES (?, ?, ?, ?)
    `, ledger))
	if err != nil {
		return err
	}

	_, err = stmt.Exec(
		stock.Name,
		stock.Type,
		stock.Code,
		stock.Plan,
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
    SELECT id, name, type, code, plan, status, units, nav, navDate, invested
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
		var name, stockType, code, plan, status, navDate string
		var units, nav, invested float64
		if err := rows.Scan(&id, &name, &stockType, &code, &plan, &status, &units, &nav, &navDate, &invested); err != nil {
			return nil, err
		}

		stock := &Stock{
			ID:       id,
			Name:     name,
			Type:     stockType,
			Code:     code,
			Plan:     plan,
			Status:   status,
			Units:    units,
			Nav:      nav,
			NavDate:  navDate,
			Invested: invested,
		}

		stocks = append(stocks, stock)
	}

	return stocks, nil
}

// GetStockNamesList returns a slice of string with stock names
func GetStockNamesList(stocks []*Stock) []string {
	var names []string
	for _, stock := range stocks {
		names = append(names, stock.Name)
	}
	return names
}

// GetStockCodesList returns a slice of string with stock codes
func GetStockCodesList(stocks []*Stock) []string {
	var codes []string
	for _, stock := range stocks {
		codes = append(codes, stock.Code)
	}
	return codes
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

func ToggleStockStatus(ledgerName string, stockID int, currStatus string) error {

	var newStatus string

	switch currStatus {
	case "active":
		newStatus = "holding"
	case "holding":
		newStatus = "active"
	default:
		return errors.New("invalid stock status argument supplied to ToggleStockStatus func")
	}

	updateQuery := fmt.Sprintf(`
    UPDATE %s_stocks
    SET status = ?
    WHERE id = ?
  `, ledgerName)

	stmt, err := common.DbConn.Prepare(updateQuery)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(newStatus, stockID)
	if err != nil {
		return err
	}
	return nil
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

	if (stockTransaction.TransactionType == "purchase" || stockTransaction.TransactionType == "redeem") && stockTransaction.BankAccountID > 0 {
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

	if strings.Contains(stockTransaction.TransactionType, "purchase") || strings.Contains(stockTransaction.TransactionType, "switch from") {
		operator = "+"
	} else if strings.Contains(stockTransaction.TransactionType, "redeem") || strings.Contains(stockTransaction.TransactionType, "switch to") {
		operator = "-"
	} else {
		return errors.New("invalid updateType")
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

// GetTransactionsForStock fetches transactions for the given stock from the database
// and returns them as a slice of StockTransaction struct
func GetTransactionsForStock(ledgerName string, stockID int) ([]StockTransaction, error) {

	query := fmt.Sprintf(`
		SELECT t.date, t.notes, t.units, t.nav, t.amount, a.name AS bank
		FROM %s_stocks_transactions t
		LEFT JOIN %s_accounts a ON t.account_id = a.id
		WHERE t.stock_id = %d
    ORDER BY t.date DESC;
	`, ledgerName, ledgerName, stockID)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stockTransactions []StockTransaction

	for rows.Next() {

		var stockTransaction StockTransaction
		var bankName sql.NullString

		err := rows.Scan(
			&stockTransaction.Date,
			&stockTransaction.TransactionType,
			&stockTransaction.Units,
			&stockTransaction.Nav,
			&stockTransaction.Amount,
			&bankName,
		)
		if err != nil {
			return nil, err
		}

		if bankName.Valid {
			stockTransaction.BankName = &bankName.String
		}
		stockTransactions = append(stockTransactions, stockTransaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return stockTransactions, nil
}

func UpdateNAVs(ledgerName string, stockCodesList []string) error {

	var (
		navURL           = "https://www.amfiindia.com/spages/NAVAll.txt"
		stocksNavDetails = []Stock{}
		navRegex         = regexp.MustCompile(`^[^;]+;[^;]+;[^;]+;[^;]+;[^;]+;[^;]+`)
	)

	resp, err := http.Get(navURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if navRegex.MatchString(line) {
			fields := strings.Split(line, ";")
			code := fields[0]
			navStr := fields[4]
			navDate := fields[5]
			if common.SliceContains(stockCodesList, code) {
				nav, err := strconv.ParseFloat(navStr, 64)
				if err != nil {
					return err
				}
				nav = common.PrecisionRoundAFloat(nav, 4)
				stockNavInfo := Stock{
					Code:    code,
					Nav:     nav,
					NavDate: navDate,
				}
				stocksNavDetails = append(stocksNavDetails, stockNavInfo)
			}
		}
	}

	for _, item := range stocksNavDetails {
		query := fmt.Sprintf(`
		UPDATE %s_stocks
		SET nav = %0.4f, navDate = '%s'
		WHERE code = '%v' AND type = 'mutual fund'
		`, ledgerName, item.Nav, item.NavDate, item.Code)
		_, err := common.DbConn.Exec(query)
		if err != nil {
			return err
		}
	}

	return nil
}

func GoldStocksFound(stocks []*Stock) bool {
	for _, stock := range stocks {
		if stock.Type == "gold" {
			return true
		}
	}
	return false
}

func UpdateGoldPrice(ledgerName string) error {

	var (
		goldPriceRawDate = ""
		goldPriceDate    = ""
		goldPrice        = 0.00
		c                = colly.NewCollector()
		goldPriceURL     = "https://ibja.co"
	)

	c.OnHTML("span#lblDate", func(e *colly.HTMLElement) {
		goldPriceRawDate = e.Text
	})

	c.OnHTML("span#lblFineGold999", func(e *colly.HTMLElement) {
		fields := strings.Fields(e.Text)
		if len(fields) > 1 {
			goldPrice, _ = strconv.ParseFloat(fields[1], 64)
		}
	})

	c.Visit(goldPriceURL)

	parsedDate, err := time.Parse("02/01/2006", goldPriceRawDate)
	if err != nil {
		return err
	}
	goldPriceDate = parsedDate.Format("02-Jan-2006")

	query := fmt.Sprintf(`
	UPDATE %s_stocks
	SET nav = %0.4f, navDate = '%s'
	WHERE type = 'gold'
	`, ledgerName, goldPrice, goldPriceDate)
	_, err = common.DbConn.Exec(query)
	if err != nil {
		return err
	}

	return nil
}
