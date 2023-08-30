package ledger

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/c-bata/go-prompt"
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

// PromptForNewAccount gathers new account details from the user and returns an Account struct
// which can then be added to the database
func PromptForNewAccount(ledger string) Account {

	reader := bufio.NewReader(os.Stdin)

	var (
		name           string
		accountType    string
		placeholder    int
		openingBalance float64
		parentID       int
	)

	// account name
	for {
		fmt.Printf("account name: ")
		name, _ = reader.ReadString('\n')
		name = strings.TrimSuffix(name, "\n")

		if len(name) > 0 {
			break
		}

		fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] account name is required"))
	}

	// account type
	accountTypeChoice := []string{"asset", "liability"}
	for {
		common.SaveTermState()
		accountType = prompt.Input("account type [tab for options]: ", common.Completer(accountTypeChoice), prompt.OptionShowCompletionAtStart())
		common.RestoreTermState()

		if len(accountType) > 0 {
			break
		}

		fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] account type is required"))
	}

	// placeholder account?
	fmt.Print("is this going to be a placeholder account? (y/N): ")
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(strings.ToLower(response))

	if response == "y" {
		placeholder = 1
	} else {
		placeholder = 0

		// opening balance
		fmt.Printf("opening balance: ")
		amount, _ := reader.ReadString('\n')
		amount = strings.TrimSuffix(amount, "\n")
		if len(amount) == 0 {
			openingBalance = 0.00
		} else {
			openingBalance, _ = strconv.ParseFloat(amount, 64)
		}
	}

	// parent account id
	parentID, _ = promptForSelectingAccount(ledger, "parent account", accountType, true)

	account := Account{
		Name:           name,
		Type:           accountType,
		Placeholder:    placeholder,
		OpeningBalance: openingBalance,
		ParentID:       parentID,
	}

	return account
}

// promptForSelectingAccount displays a prompt asking the user to pick an account from the list
func promptForSelectingAccount(ledger string, promptMsg string, accountType string, placeholder bool) (int, error) {

	var accountID int

	if len(promptMsg) == 0 {
		promptMsg = "pick an account [tab for options]: "
	} else {
		promptMsg = fmt.Sprintf("%s [tab for options]: ", promptMsg)
	}

	accounts, err := FetchAccounts(ledger, accountType, placeholder)
	if err != nil {
		return 0, err
	}

	accountsFormatted := FormatAccounts(accounts, "")

	if len(accountsFormatted) > 0 {
		common.SaveTermState()
		account := prompt.Input(
			promptMsg,
			common.Completer(accountsFormatted),
			prompt.OptionShowCompletionAtStart(),
			prompt.OptionMaxSuggestion(30),
		)
		common.RestoreTermState()
		accountID = getAccountID(account, accounts)
	}

	return accountID, nil
}

// getAccountID returns the account id of the given account name
func getAccountID(accountName string, accounts []*Account) int {
	accountName = strings.TrimSpace(accountName)
	for _, account := range accounts {
		option := account.Name
		if option == accountName {
			return account.ID
		}
		if account.Children != nil {
			subAccountID := getAccountID(accountName, account.Children)
			if subAccountID != 0 {
				return subAccountID
			}
		}
	}
	return 0
}

// IsPlaceholderAccount returns true if the given account is a placeholder account,
// false otherwise
func IsPlaceholderAccount(accountName string, accounts []*Account) bool {
	for _, account := range accounts {
		if account.Name == accountName {
			if account.Placeholder == 1 {
				return true
			}
		}
		if account.Children != nil {
			if IsPlaceholderAccount(accountName, account.Children) {
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

// getAccountBalance returns balance for the given account for the given ledger
func getAccountBalance(ledgerName string, accountID int) (float64, error) {

	var balance float64

	query := fmt.Sprintf(`
		SELECT opening_balance + balance
		FROM %s_accounts
		WHERE id = ?
  `, ledgerName)

	err := common.DbConn.QueryRow(query, accountID).Scan(&balance)
	if err != nil {
		return 0, err
	}

	return balance, nil
}
