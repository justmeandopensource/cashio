package common

import (
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
)

// InitializeCashio creates ledgers table in the cashio sqlite database
func InitializeCashio() error {

	dbPath := GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	// table : ledgers
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS ledgers (
			name TEXT PRIMARY KEY,
      currency TEXT NOT NULL
		)
	`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		return err
	}
	return nil
}

// CreateLedgerTables creates required tables for a ledger
//
// It adds an entry in the ledgers table
// It creates the below tables with ledger name prefixed
//
// for example if name = uk
//   - uk_accounts
//   - uk_categories
//   - uk_transactions
//   - uk_split_transactions
func CreateLedgerTables(name string, currency string) error {

	dbPath := GetCashioDBPath()

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	insertStmt, err := db.Prepare("INSERT INTO ledgers(name, currency) VALUES(?, ?)")
	if err != nil {
		return err
	}
	defer insertStmt.Close()

	_, err = insertStmt.Exec(name, currency)
	if err != nil {
		return err
	}

	// table : categories
	createTableQuery := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      placeholder INTEGER CHECK (placeholder IN (0, 1)),
			parent_id INTEGER,
			CONSTRAINT unique_name_parent_id UNIQUE (name, parent_id)
		)
	`, name)
	_, err = db.Exec(createTableQuery)
	if err != nil {
		return err
	}

	// table : accounts
	createTableQuery = fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s_accounts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			type TEXT CHECK(type IN ('asset', 'liability')) NOT NULL,
      opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      placeholder INTEGER CHECK (placeholder IN (0, 1)),
			parent_id INTEGER,
			CONSTRAINT unique_name_parent_id UNIQUE (name, parent_id)
		)
	`, name)
	_, err = db.Exec(createTableQuery)
	if err != nil {
		return err
	}

	// table : transactions
	createTableQuery = fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s_transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      notes TEXT NOT NULL,
      credit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      debit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      account_id INTEGER NOT NULL,
      category_id INTEGER,
      is_split BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
		)
	`, name)
	_, err = db.Exec(createTableQuery)
	if err != nil {
		return err
	}

	// table : split_transactions
	createTableQuery = fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s_split_transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      notes TEXT NOT NULL,
      credit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      debit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      account_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      parent_transaction_id INTEGER NOT NULL,
      FOREIGN KEY (parent_transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
		)
	`, name)
	_, err = db.Exec(createTableQuery)
	if err != nil {
		return err
	}

	return nil
}
