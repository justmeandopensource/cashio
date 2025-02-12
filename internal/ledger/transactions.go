package ledger

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/justmeandopensource/cashio/internal/common"
)

// A SplitTransaction is a representation of a record from the split_transactions table
type SplitTransaction struct {
	ID             int
	Date           time.Time
	Notes          string
	Credit         float64
	Debit          float64
	AccountID      int
	Account        string
	CategoryID     int
	Category       *string
	CurrencySymbol string
	ParentID       int
}

// A Transaction is a representation of a record from the transactions table
type Transaction struct {
	ID             int
	Date           time.Time
	Notes          string
	Credit         float64
	Debit          float64
	AccountID      int
	Account        string
	CategoryID     int
	Category       *string
	CurrencySymbol string
	IsSplit        int
	Splits         []SplitTransaction
}

// GetTransaction returns a transaction matching given transaction id in a Transaction struct
func GetTransaction(ledgerName string, transactionID int) (Transaction, error) {
	var transaction Transaction
	query := fmt.Sprintf(`
		SELECT id, date, notes, credit, debit, account_id, category_id
		FROM %s_transactions
    WHERE id = %d;
	`, ledgerName, transactionID)

	row := common.DbConn.QueryRow(query)

	var categoryID sql.NullInt16

	err := row.Scan(
		&transaction.ID,
		&transaction.Date,
		&transaction.Notes,
		&transaction.Credit,
		&transaction.Debit,
		&transaction.AccountID,
		&categoryID,
	)
	if err != nil {
		return transaction, err
	}

	if categoryID.Valid {
		transaction.CategoryID = int(categoryID.Int16)
	}

	return transaction, nil
}

// GetTransactionsForCategory fetches transactions for the given category from the database
// and returns them as a slice of Transaction struct
func GetTransactionsForCategory(ledgerName string, category string, limit int) ([]Transaction, error) {

	categories, err := FetchCategories(ledgerName, "", false)
	if err != nil {
		return nil, err
	}

	categoryID := GetCategoryID(category, categories)

	var query, inClause string
	var categoryFilter = ""

	if IsPlaceHolderCategory(categoryID, categories) {
		childIDs := GetChildCategoryIDs(categoryID, categories)
		for i, id := range childIDs {
			if i != 0 {
				inClause += ", "
			}
			inClause += fmt.Sprintf("%d", id)
		}
	} else {
		inClause = strconv.Itoa(categoryID)
	}

	if len(category) != 0 && category != "." {
		categoryFilter = fmt.Sprintf("WHERE c.id IN (%s)", inClause)
	}

	query = fmt.Sprintf(`
    SELECT u.id, u.date, u.notes, u.credit, u.debit, a.name AS account, u.name AS category
    FROM (

      SELECT t.id, t.date, t.notes, t.credit, t.debit, t.account_id, c.name
      FROM %s_transactions t
		  LEFT JOIN %s_categories c ON t.category_id = c.id
      %s

      UNION ALL

      SELECT st.id, st.date, st.notes, st.credit, st.debit, st.account_id, c.name
      FROM %s_split_transactions st
		  LEFT JOIN %s_categories c ON st.category_id = c.id
      %s

    ) AS u
		LEFT JOIN %s_accounts a ON u.account_id = a.id
    ORDER BY u.date DESC, u.id DESC
    LIMIT %d;
	`, ledgerName, ledgerName, categoryFilter, ledgerName, ledgerName, categoryFilter, ledgerName, limit)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction

	for rows.Next() {

		var transaction Transaction

		err := rows.Scan(
			&transaction.ID,
			&transaction.Date,
			&transaction.Notes,
			&transaction.Credit,
			&transaction.Debit,
			&transaction.Account,
			&transaction.Category,
		)
		if err != nil {
			return nil, err
		}

		transactions = append(transactions, transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

// GetTransactionsForAccount fetches transactions for the given account from the database
// and returns them as a slice of Transaction struct
func GetTransactionsForAccount(ledgerName string, accountName string, limit int) ([]Transaction, error) {

	accounts, err := FetchAccounts(ledgerName, "", false)
	if err != nil {
		return nil, err
	}

	accountID := GetAccountID(accountName, accounts)

	var query, inClause string
	var accountFilter = ""

	if IsPlaceHolderAccount(accountName, accounts) {
		childIDs := GetChildAccountIDs(accountID, accounts)
		for i, id := range childIDs {
			if i != 0 {
				inClause += ", "
			}
			inClause += fmt.Sprintf("%d", id)
		}
	} else {
		inClause = strconv.Itoa(accountID)
	}

	if len(accountName) != 0 && accountName != "." {
		accountFilter = fmt.Sprintf("WHERE a.id IN (%s)", inClause)
	}

	query = fmt.Sprintf(`
		SELECT t.id, t.date, t.notes, t.credit, t.debit, a.name AS account, c.name AS category
		FROM %s_transactions t
		LEFT JOIN %s_accounts a ON t.account_id = a.id
		LEFT JOIN %s_categories c ON t.category_id = c.id
    %s
    ORDER BY t.date DESC, t.id DESC
    LIMIT %d;
	`, ledgerName, ledgerName, ledgerName, accountFilter, limit)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction

	for rows.Next() {

		var transaction Transaction
		var categoryName sql.NullString

		err := rows.Scan(
			&transaction.ID,
			&transaction.Date,
			&transaction.Notes,
			&transaction.Credit,
			&transaction.Debit,
			&transaction.Account,
			&categoryName,
		)
		if err != nil {
			return nil, err
		}

		if categoryName.Valid {
			transaction.Category = &categoryName.String
		}
		transactions = append(transactions, transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

// GetTransactionsForKeywords fetches transactions matching the keywords
// and returns them as a slice of Transaction struct
func GetTransactionsForKeywords(ledgerName string, keywords string) ([]Transaction, error) {

	keywords = strings.ReplaceAll(keywords, " ", "%")
	keywords = "%" + keywords + "%"

	query := fmt.Sprintf(`
    SELECT u.id, u.date, u.notes, u.credit, u.debit, a.name AS account, u.name AS category
    FROM (

      SELECT t.id, t.date, t.notes, t.credit, t.debit, t.account_id, c.name
      FROM %s_transactions t
		  LEFT JOIN %s_categories c ON t.category_id = c.id
      WHERE notes LIKE '%s'

      UNION ALL

      SELECT st.id, st.date, st.notes, st.credit, st.debit, st.account_id, c.name
      FROM %s_split_transactions st
		  LEFT JOIN %s_categories c ON st.category_id = c.id
      WHERE notes LIKE '%s'

    ) AS u
		LEFT JOIN %s_accounts a ON u.account_id = a.id
    ORDER BY date DESC
    LIMIT 100;
	`, ledgerName, ledgerName, keywords, ledgerName, ledgerName, keywords, ledgerName)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction

	for rows.Next() {

		var transaction Transaction
		var categoryName sql.NullString

		err := rows.Scan(
			&transaction.ID,
			&transaction.Date,
			&transaction.Notes,
			&transaction.Credit,
			&transaction.Debit,
			&transaction.Account,
			&categoryName,
		)
		if err != nil {
			return nil, err
		}

		if categoryName.Valid {
			transaction.Category = &categoryName.String
		}
		transactions = append(transactions, transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

// GetSplitsForTransaction fetches all split transactions for a given transaction id and returns
// them as a slice of SplitTransaction
func GetSplitsForTransaction(ledgerName string, transactionID int) ([]SplitTransaction, error) {

	query := fmt.Sprintf(`
		SELECT t.date, t.notes, t.credit, t.debit, a.name AS account, c.name AS category
		FROM %s_split_transactions t
		LEFT JOIN %s_accounts a ON t.account_id = a.id
		LEFT JOIN %s_categories c ON t.category_id = c.id
    WHERE t.parent_transaction_id = %d;
	`, ledgerName, ledgerName, ledgerName, transactionID)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var splitTransactions []SplitTransaction

	for rows.Next() {

		var splitTransaction SplitTransaction
		var categoryName sql.NullString

		err := rows.Scan(
			&splitTransaction.Date,
			&splitTransaction.Notes,
			&splitTransaction.Credit,
			&splitTransaction.Debit,
			&splitTransaction.Account,
			&categoryName,
		)
		if err != nil {
			return nil, err
		}

		if categoryName.Valid {
			splitTransaction.Category = &categoryName.String
		}
		splitTransactions = append(splitTransactions, splitTransaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return splitTransactions, nil
}

// AddTransaction adds a transaction to the database
func AddTransaction(ledgerName string, transaction Transaction) error {

	tx, err := common.DbConn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Add the main transaction
	result, err := tx.Exec(
		fmt.Sprintf(
			`
      INSERT INTO %s_transactions (date, notes, credit, debit, account_id, category_id, is_split)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ledgerName,
		),
		transaction.Date.Format("2006-01-02"),
		transaction.Notes,
		transaction.Credit,
		transaction.Debit,
		transaction.AccountID,
		transaction.CategoryID,
		transaction.IsSplit,
	)
	if err != nil {
		return err
	}

	transactionID, _ := result.LastInsertId()

	if transaction.IsSplit == 1 {
		for _, split := range transaction.Splits {
			_, err := tx.Exec(
				fmt.Sprintf(
					`
          INSERT INTO %s_split_transactions (date, notes, credit, debit, account_id, category_id, parent_transaction_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `, ledgerName,
				),
				split.Date.Format("2006-01-02"),
				split.Notes,
				split.Credit,
				split.Debit,
				split.AccountID,
				split.CategoryID,
				transactionID,
			)
			if err != nil {
				return err
			}
		}
	}

	// update account balance
	var amount float64
	var updateType string
	if transaction.Credit != 0.00 {
		amount = transaction.Credit
		updateType = "credit"
	} else {
		amount = transaction.Debit
		updateType = "debit"
	}
	if updateAccountBalance(tx, ledgerName, transaction.AccountID, amount, updateType) != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

// DeleteTransaction deletes a transaction from the database and updates the account balance
func DeleteTransaction(ledgerName string, transactionID int) error {

	transaction, err := GetTransaction(ledgerName, transactionID)
	if err != nil {
		return err
	}

	tx, err := common.DbConn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := fmt.Sprintf(
		`DELETE FROM %s_transactions WHERE id = %d
    `, ledgerName, transactionID)

	if _, err = tx.Exec(query); err != nil {
		return err
	}

	query = fmt.Sprintf(
		`DELETE FROM %s_split_transactions WHERE parent_transaction_id = %d
    `, ledgerName, transactionID)

	if _, err = tx.Exec(query); err != nil {
		return err
	}

	// update account balance
	var amount float64
	var updateType string
	if transaction.Credit != 0.00 {
		amount = transaction.Credit
		updateType = "debit"
	} else {
		amount = transaction.Debit
		updateType = "credit"
	}
	if updateAccountBalance(tx, ledgerName, transaction.AccountID, amount, updateType) != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

// GetTransactionNotesForKeywords fetches transaction notes matching the keywords
// and returns them as a slice of string
func GetTransactionNotesForKeywords(ledgerName string, keywords string) ([]string, error) {

	keywords = strings.ReplaceAll(keywords, " ", "%")
	keywords = "%" + keywords + "%"

	query := fmt.Sprintf(`
    SELECT DISTINCT notes
    FROM %s_transactions
    WHERE notes LIKE '%s'
      AND notes NOT LIKE '<trans>%%'
      AND notes NOT LIKE '<split>%%'
    ORDER BY date DESC
    LIMIT 15
	`, ledgerName, keywords)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

  var notes []string
  for rows.Next() {
    var note string
    if err := rows.Scan(&note); err != nil {
      return nil, err
    }
    notes = append(notes, note)
  }

  return notes, nil
}

// TransferFunds adds transfer transactions contained in a slice of Transaction struct to database
func TransferFunds(fromLedger string, toLedger string, transactions []Transaction) error {

	tx, err := common.DbConn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if len(transactions) != 2 {
		fmt.Println(common.ColorizeRed("[E] not enough transactions to make the transfer"))
		os.Exit(1)
	}

	for i, transaction := range transactions {

		ledgerName := fromLedger

		if i == 1 {
			ledgerName = toLedger
		}

		result, err := tx.Exec(
			fmt.Sprintf(
				`
        INSERT INTO %s_transactions (date, notes, credit, debit, account_id)
        VALUES (?, ?, ?, ?, ?)
        `, ledgerName,
			),
			transaction.Date.Format("2006-01-02"),
			transaction.Notes,
			transaction.Credit,
			transaction.Debit,
			transaction.AccountID,
			transaction.IsSplit,
		)
		if err != nil {
			return err
		}

		transactionID, _ := result.LastInsertId()

		if transaction.IsSplit == 1 {
			for _, split := range transaction.Splits {
				_, err := tx.Exec(
					fmt.Sprintf(
						`
            INSERT INTO %s_split_transactions (date, notes, credit, debit, account_id, category_id, parent_transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ledgerName,
					),
					split.Date.Format("2006-01-02"),
					split.Notes,
					split.Credit,
					split.Debit,
					split.AccountID,
					split.CategoryID,
					transactionID,
				)
				if err != nil {
					return err
				}
			}
		}

		// update account balance
		var amount float64
		var updateType string
		if transaction.Credit != 0 {
			amount = transaction.Credit
			updateType = "credit"
		} else {
			amount = transaction.Debit
			updateType = "debit"
		}
		updateAccountBalance(tx, ledgerName, transaction.AccountID, amount, updateType)
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

// updateAccountBalance updates the balance of the given account in the database.
// updateType can be either credit or debit. If updateType is credit, then the amount is added
// to the existing balance. If updateType is debit, then the amount is reduced from the
// existing balance
func updateAccountBalance(tx *sql.Tx, ledgerName string, accountID int, amount float64, updateType string) error {

	if amount == 0.00 {
		return nil
	}

	var operator string
	switch updateType {
	case "credit":
		operator = "+"
	case "debit":
		operator = "-"
	default:
		return errors.New("updateType is neither credit nor debit")
	}

	updateQuery := fmt.Sprintf(`
    UPDATE %s_accounts
    SET balance = balance %s ?
    WHERE id = ?
  `, ledgerName, operator)

	stmt, err := tx.Prepare(updateQuery)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(amount, accountID)
	if err != nil {
		return err
	}

	return nil
}
