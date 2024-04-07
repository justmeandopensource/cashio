package ledger

import (
	"fmt"
	"strings"

	"github.com/justmeandopensource/cashio/internal/common"
)

// An Account is a representation of a record from the accounts table
type Account struct {
	ID             int
	Name           string
	Type           string
	OpeningBalance float64
	Balance        float64
	Placeholder    int
	ParentID       int
	Children       []*Account
}

// FetchAccounts fetches account records for the given ledger from the database and returns a slice of Account struct.
//
// If placeholder is true, only records where placeholder is set to 1 is fetched.
//
// If accountType is set to either asset or liability, only those records are fetched.
func FetchAccounts(ledger string, accountType string, placeholder bool) ([]*Account, error) {

	var queryFilter string

	switch accountType {
	case "asset":
		queryFilter = "WHERE type = 'asset'"
	case "liability":
		queryFilter = "WHERE type = 'liability'"
	default:
		queryFilter = "WHERE 1"
	}

	if placeholder {
		queryFilter += " AND placeholder = 1"
	}

	query := fmt.Sprintf(`
    SELECT id, name, type, opening_balance + balance AS balance, parent_id, placeholder
    FROM %s_accounts
    %s
    ORDER BY type, parent_id;
    `, ledger, queryFilter)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	accountMap := make(map[int]*Account)
	var accounts []*Account

	for rows.Next() {
		var accountID, parentID, placeholder int
		var name, acctype string
		var balance float64
		if err := rows.Scan(&accountID, &name, &acctype, &balance, &parentID, &placeholder); err != nil {
			return nil, err
		}

		account := &Account{
			ID:          accountID,
			Name:        name,
			Type:        acctype,
			Balance:     balance,
			ParentID:    parentID,
			Placeholder: placeholder,
		}

		accountMap[accountID] = account

		if parentID == 0 {
			accounts = append(accounts, account)
		} else {
			parentAccount := accountMap[parentID]
			parentAccount.Children = append(parentAccount.Children, account)
		}
	}

	return accounts, nil
}

// AddAccount adds the given account to the database
func AddAccount(ledger string, account Account) error {

	stmt, err := common.DbConn.Prepare(fmt.Sprintf(`
    INSERT INTO %s_accounts (name, type, placeholder, opening_balance, parent_id)
    VALUES (?, ?, ?, ?, ?)
    `, ledger))
	if err != nil {
		return err
	}

	_, err = stmt.Exec(
		account.Name,
		account.Type,
		account.Placeholder,
		account.OpeningBalance,
		account.ParentID,
	)
	if err != nil {
		return err
	}

	defer stmt.Close()

	return nil
}

// FormatAccounts takes a slice of Account struct and returns a slice of string with account names
// prefixed with appropriate spaces to give it a nested list look
func FormatAccounts(accounts []*Account, prefix string) []string {

	var options []string

	for _, account := range accounts {
		option := fmt.Sprintf("%s%s", prefix, account.Name)
		options = append(options, option)

		if len(account.Children) > 0 {
			subOptions := FormatAccounts(account.Children, prefix+"   ")
			options = append(options, subOptions...)
		}
	}

	return options
}

// GetAccountID returns the account id of the given account
func GetAccountID(accountName string, accounts []*Account) int {
	accountName = strings.TrimSpace(accountName)
	for _, account := range accounts {
		if account.Name == accountName {
			return account.ID
		}
		if account.Children != nil {
			subAccountID := GetAccountID(accountName, account.Children)
			if subAccountID != 0 {
				return subAccountID
			}
		}
	}
	return 0
}

// GetAccountType returns the account type of the given account
func GetAccountType(accountName string, accounts []*Account) string {
	accountName = strings.TrimSpace(accountName)
	for _, account := range accounts {
		if account.Name == accountName {
			return account.Type
		}
		if account.Children != nil {
			subAccountType := GetAccountType(accountName, account.Children)
			if subAccountType != "" {
				return subAccountType
			}
		}
	}
	return ""
}

// IsPlaceHolderAccount returns true if the given account is a placeholder account,
// false otherwise
func IsPlaceHolderAccount(accountName string, accounts []*Account) bool {
	for _, account := range accounts {
		if account.Name == accountName {
			if account.Placeholder == 1 {
				return true
			}
		}
		if account.Children != nil {
			if IsPlaceHolderAccount(accountName, account.Children) {
				return true
			}
		}
	}
	return false
}

// GetChildAccountIDs returns a slice of IDs of all the child accounts for the given account
func GetChildAccountIDs(accountID int, accounts []*Account) []int {
	var cids []int
	for _, account := range accounts {
		if account.ID == accountID {
			if account.Children != nil {
				childIDs := getChildAccountIDsHelper(account.Children)
				cids = append(cids, childIDs...)
			}
			break
		}
		if account.Children != nil {
			childIDs := GetChildAccountIDs(accountID, account.Children)
			cids = append(cids, childIDs...)
		}
	}
	return cids
}

// getChildAccountIDsHelper recurses through all child accounts of a given account
// and returns a slice of all IDs
func getChildAccountIDsHelper(accounts []*Account) []int {
	var cids []int
	for _, account := range accounts {
		if account.Placeholder == 1 {
			childIDs := getChildAccountIDsHelper(account.Children)
			cids = append(cids, childIDs...)
		} else {
			cids = append(cids, account.ID)
		}
	}
	return cids
}

// getAccountBalance calculates the total balance for a given account
// accumulates balances from all child accounts if its a placeholder account
func GetAccountBalance(accounts []*Account, accountName string) float64 {

  var totalBalance float64

  for _, account := range accounts {

    if account.Name == accountName {
      if account.Placeholder == 0 {
        return account.Balance
      }
      for _, child := range account.Children {
        totalBalance += GetAccountBalance(account.Children, child.Name)
      }
      return totalBalance
    }

    totalBalance += GetAccountBalance(account.Children, accountName)
  }

  return totalBalance
}
