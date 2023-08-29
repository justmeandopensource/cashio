package ledger

import (
	"bufio"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/c-bata/go-prompt"
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

// GetTransactionsForCategory fetches transactions for the given category from the database
// and returns them as a slice of Transaction struct
func GetTransactionsForCategory(ledgerName string, category string, limit int) ([]Transaction, error) {

	categories, err := FetchCategories(ledgerName, "", false)
	if err != nil {
		return nil, err
	}

	categoryID := getCategoryID(category, categories)

	dbPath := common.GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var query, inClause string

	if isPlaceHolderCategory(categoryID, categories) {
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

	query = fmt.Sprintf(`
    SELECT u.id, u.date, u.notes, u.credit, u.debit, a.name AS account, u.name AS category
    FROM (

      SELECT t.id, t.date, t.notes, t.credit, t.debit, t.account_id, c.name
      FROM %s_transactions t
		  LEFT JOIN %s_categories c ON t.category_id = c.id
      WHERE c.id IN (%s)

      UNION ALL

      SELECT st.id, st.date, st.notes, st.credit, st.debit, st.account_id, c.name
      FROM %s_split_transactions st
		  LEFT JOIN %s_categories c ON st.category_id = c.id
      WHERE c.id IN (%s)

    ) AS u
		LEFT JOIN %s_accounts a ON u.account_id = a.id
    ORDER BY date DESC
    LIMIT %d;
	`, ledgerName, ledgerName, inClause, ledgerName, ledgerName, inClause, ledgerName, limit)

	rows, err := db.Query(query)
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

	accountID := getAccountID(accountName, accounts)

	dbPath := common.GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var query, inClause string
	var accountFilter = ""

	if IsPlaceholderAccount(accountName, accounts) {
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
    ORDER BY t.date desc, t.id desc
    LIMIT %d;
	`, ledgerName, ledgerName, ledgerName, accountFilter, limit)

	rows, err := db.Query(query)
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

	dbPath := common.GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	keywords = strings.ReplaceAll(keywords, " ", "%")
	keywords = "%" + keywords + "%"

	var query string

	query = fmt.Sprintf(`
    SELECT u.id, u.date, u.notes, u.credit, u.debit, a.name AS account, u.name AS category
    FROM (

      SELECT t.id, t.date, t.notes, t.credit, t.debit, t.account_id, c.name
      FROM %s_transactions t

      UNION ALL

      SELECT st.id, st.date, st.notes, st.credit, st.debit, st.account_id, c.name
      FROM %s_split_transactions st

    ) AS u
		LEFT JOIN %s_accounts a ON u.account_id = a.id
    ORDER BY date DESC
    LIMIT 100;
	`, ledgerName, ledgerName, ledgerName)

	rows, err := db.Query(query)
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

	dbPath := common.GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var query string

	query = fmt.Sprintf(`
		SELECT t.date, t.notes, t.credit, t.debit, a.name AS account, c.name AS category
		FROM %s_split_transactions t
		LEFT JOIN %s_accounts a ON t.account_id = a.id
		LEFT JOIN %s_categories c ON t.category_id = c.id
    WHERE t.parent_transaction_id = %d;
	`, ledgerName, ledgerName, ledgerName, transactionID)

	rows, err := db.Query(query)
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

// PromptForNewTransaction gathers details of new transaction from user into A Transaction struct,
// which can then be added to the database.
//
// transactionType is either income or expense
func PromptForNewTransaction(ledgerName string, transactionType string) Transaction {

	reader := bufio.NewReader(os.Stdin)

	splitTransactions := []SplitTransaction{}

	// date
	date := common.GetDateFromUser()

	// account
	accountID, _ := promptForSelectingAccount(ledgerName, "pick an account", "", false)

	// credit or debit
	credit, debit := 0.00, 0.00

	fmt.Printf("amount: ")
	amount, _ := reader.ReadString('\n')
	amount = strings.TrimSuffix(amount, "\n")
	amountFormatted := common.ProcessExpression(amount)

	// notes
	fmt.Printf("notes: ")
	notes, _ := reader.ReadString('\n')
	notes = strings.TrimSuffix(notes, "\n")

	switch transactionType {
	case "income":
		credit = amountFormatted
	case "expense":
		debit = amountFormatted
	default:
		fmt.Println(common.ColorizeRed("[E] unknown transaction type"))
		os.Exit(1)
	}

	var categoryID int
	var isSplit int

	fmt.Print("do you want to split this transaction? (y/N): ")
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(strings.ToLower(response))

	if response == "y" {
		// split
		isSplit = 1
		splits := 0
		notes = "<split> " + notes
		for amountFormatted > 0 {
			splits++
			fmt.Printf("[split %d] amount [%0.2f]: ", splits, amountFormatted)
			amount, _ := reader.ReadString('\n')
			amount = strings.TrimSuffix(amount, "\n")

			var splitAmountFormatted float64
			if len(amount) == 0 {
				splitAmountFormatted = amountFormatted
			} else {
				splitAmountFormatted, _ = strconv.ParseFloat(amount, 64)
			}

			fmt.Printf("[split %d] notes: ", splits)
			notes, _ := reader.ReadString('\n')
			notes = strings.TrimSuffix(notes, "\n")

			splitCredit, splitDebit := 0.00, 0.00

			switch transactionType {
			case "income":
				splitCredit = splitAmountFormatted
			case "expense":
				splitDebit = splitAmountFormatted
			}

			amountFormatted -= splitAmountFormatted

			categoryID, _ := promptForSelectingCategory(ledgerName, "pick a category", transactionType, false)

			splitTransaction := SplitTransaction{
				Date:       date,
				Notes:      notes,
				Credit:     splitCredit,
				Debit:      splitDebit,
				AccountID:  accountID,
				CategoryID: categoryID,
			}

			splitTransactions = append(splitTransactions, splitTransaction)
		}
	} else {
		// non-split
		isSplit = 0
		categoryID, _ = promptForSelectingCategory(ledgerName, "pick a category", transactionType, false)
	}

	transaction := Transaction{
		Date:       date,
		Notes:      notes,
		Credit:     credit,
		Debit:      debit,
		AccountID:  accountID,
		CategoryID: categoryID,
		IsSplit:    isSplit,
		Splits:     splitTransactions,
	}

	return transaction
}

// AddTransaction adds a transaction to the database
func AddTransaction(ledgerName string, transaction Transaction) error {

	dbPath := common.GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
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
	if err := updateAccountBalance(tx, ledgerName, transaction.AccountID, amount, updateType); err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	accountBalance, _ := getAccountBalance(ledgerName, transaction.AccountID)
	fmt.Println(fmt.Sprintf("account balance: %0.2f", accountBalance))

	return nil
}

// PromptForNewTransfer gathers details of a new transfer from user into a slice of Transaction struct,
// which can then be added to the database
func PromptForNewTransfer(ledgerName string) (string, []Transaction) {

	reader := bufio.NewReader(os.Stdin)
	toLedger := ledgerName

	transactions := []Transaction{}

	// date
	date := common.GetDateFromUser()

	var fromAccounts, toAccounts []*Account

	fromAccounts, err := FetchAccounts(ledgerName, "all", false)
	if err != nil {
		fmt.Println("Error fetching accounts:", err)
		os.Exit(1)
	}

	toAccounts = fromAccounts

	fromAccountsList := FormatAccounts(fromAccounts, "")
	toAccountsList := fromAccountsList

	if len(fromAccountsList) < 1 {
		fmt.Println(common.ColorizeRed("[E] no accounts configured"))
		os.Exit(1)
	}

	common.SaveTermState()
	fromAccount := prompt.Input("from account [tab for options]: ", common.Completer(fromAccountsList), prompt.OptionShowCompletionAtStart(), prompt.OptionMaxSuggestion(25))
	fromAccount = strings.TrimSpace(fromAccount)
	common.RestoreTermState()

	fmt.Print("are you transferring to an account in a different ledger? (y/N): ")
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(strings.ToLower(response))

	if response == "y" {
		ledgersList, _ := GetLedgersList()

		indexToRemove := -1
		for i, ledger := range ledgersList {
			if ledger == ledgerName {
				indexToRemove = i
				break
			}
		}

		sortedLedgersList := append(ledgersList[:indexToRemove], ledgersList[indexToRemove+1:]...)

		if len(sortedLedgersList) == 0 {
			fmt.Fprintln(os.Stderr, common.ColorizeRed("[E] no additional ledger found"))
		}

		common.SaveTermState()
		toLedger = prompt.Input("select ledger [tab for options]: ", common.Completer(sortedLedgersList), prompt.OptionShowCompletionAtStart())
		toLedger = strings.TrimSpace(toLedger)
		common.RestoreTermState()

		if !IsValidLedger(toLedger) {
			fmt.Fprintln(os.Stderr, common.ColorizeRed("[E] not a valid ledger"))
			os.Exit(1)
		}

		toAccounts, err = FetchAccounts(toLedger, "all", false)
		if err != nil {
			fmt.Println("Error fetching accounts:", err)
			os.Exit(1)
		}

		toAccountsList = FormatAccounts(toAccounts, "")
	}

	common.SaveTermState()
	toAccount := prompt.Input("to account [tab for options]: ", common.Completer(toAccountsList), prompt.OptionShowCompletionAtStart(), prompt.OptionMaxSuggestion(25))
	toAccount = strings.TrimSpace(toAccount)
	common.RestoreTermState()

	if ledgerName == toLedger && fromAccount == toAccount {
		fmt.Println(common.ColorizeRed("[E] they are the same accounts"))
		os.Exit(1)
	}

	fromAccountID := getAccountID(fromAccount, fromAccounts)
	toAccountID := getAccountID(toAccount, toAccounts)

	// check if we are doing inter currency transfer
	fromLedgerCurrency := GetCurrencyForLedger(ledgerName)
	toLedgerCurrency := GetCurrencyForLedger(toLedger)

	// amount
	fmt.Print("amount (excluding transfer charge): ")
	fromAmount, _ := reader.ReadString('\n')
	fromAmount = strings.TrimSuffix(fromAmount, "\n")
	fromAmountFormatted := common.ProcessExpression(fromAmount)

	if fromAmountFormatted == 0 || fromAmountFormatted < 0 {
		fmt.Println(common.ColorizeRed("[E] invalid transfer amount"))
		os.Exit(1)
	}

	toAmountFormatted := fromAmountFormatted
	chargeFormatted := 0.00
	isSplit := 0
	splitTransactions := []SplitTransaction{}

	if fromLedgerCurrency != toLedgerCurrency {
		fmt.Println(common.ColorizeYellow("[i] inter currency transfer detected"))
		fmt.Print("specify receiving amount: ")
		toAmount, _ := reader.ReadString('\n')
		toAmount = strings.TrimSuffix(toAmount, "\n")
		toAmountFormatted = common.ProcessExpression(toAmount)

		fmt.Print("transfer charge if any: ")
		charge, _ := reader.ReadString('\n')
		charge = strings.TrimSuffix(charge, "\n")
		chargeFormatted = common.ProcessExpression(charge)
	}

	// prompt for charge category if there is transfer charge
	if chargeFormatted > 0 {
		isSplit = 1
		categoryID, _ := promptForSelectingCategory(ledgerName, "pick a category to log the transfer charge against", "expense", false)
		splitTransaction := SplitTransaction{
			Date:       date,
			Notes:      "fund transfer charge",
			Credit:     0.00,
			Debit:      chargeFormatted,
			AccountID:  fromAccountID,
			CategoryID: categoryID,
		}
		splitTransactions = append(splitTransactions, splitTransaction)
	}

	// notes
	fmt.Printf("notes: ")
	notes, _ := reader.ReadString('\n')
	notes = strings.TrimSuffix(notes, "\n")

	if len(notes) > 0 {
		notes = fmt.Sprintf("[%s]", notes)
	}

	fromAccountText := fromAccount
	toAccountText := toAccount
	notesPrefix := "<trans>"

	if toLedger != ledgerName {
		fromAccountText = fmt.Sprintf("%s (%s)", fromAccountText, ledgerName)
		toAccountText = fmt.Sprintf("%s (%s)", toAccountText, toLedger)
	}

	toNotes := fmt.Sprintf("%s %s -> %s %s", notesPrefix, fromAccountText, toAccountText, notes)

	if isSplit == 1 {
		notesPrefix += "<split>"
	}
	fromNotes := fmt.Sprintf("%s %s -> %s %s", notesPrefix, fromAccountText, toAccountText, notes)

	fromTransaction := Transaction{
		Date:      date,
		Notes:     fromNotes,
		Credit:    0.00,
		Debit:     fromAmountFormatted + chargeFormatted,
		AccountID: fromAccountID,
		IsSplit:   isSplit,
		Splits:    splitTransactions,
	}

	toTransaction := Transaction{
		Date:      date,
		Notes:     toNotes,
		Credit:    toAmountFormatted,
		Debit:     0.00,
		AccountID: toAccountID,
		IsSplit:   0,
	}

	transactions = append(transactions, fromTransaction, toTransaction)

	return toLedger, transactions
}

// TransferFunds adds transfer transactions contained in a slice of Transaction struct to database
func TransferFunds(fromLedger string, toLedger string, transactions []Transaction) error {

	dbPath := common.GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
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
		return errors.New("Unknown update type. Should be either credit or debit.")
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
