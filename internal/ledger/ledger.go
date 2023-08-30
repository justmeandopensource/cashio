package ledger

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/c-bata/go-prompt"
	"github.com/justmeandopensource/cashio/internal/common"
)

type Ledger struct {
	Name     string
	Currency string
}

// A StatsData represents a period and an amount of money
type StatsData struct {
	Period string
	Amount float64
}

func FetchLedgers() ([]*Ledger, error) {

	query := "SELECT name, currency FROM ledgers"

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ledgers []*Ledger

	for rows.Next() {
		var name, currency string
		if err := rows.Scan(&name, &currency); err != nil {
			return nil, err
		}

		ledger := &Ledger{
			Name:     name,
			Currency: currency,
		}

		ledgers = append(ledgers, ledger)
	}

	return ledgers, nil
}

func GetLedgersList() ([]string, error) {

	ledgers := []string{}
	ledgersList, _ := FetchLedgers()
	for _, item := range ledgersList {
		ledgers = append(ledgers, item.Name)
	}
	return ledgers, nil
}

func GetCurrencyForLedger(ledgerName string) string {
	ledgersList, _ := FetchLedgers()
	for _, item := range ledgersList {
		if item.Name == ledgerName {
			return item.Currency
		}
	}
	return ""
}

func AddLedger() {

	reader := bufio.NewReader(os.Stdin)

	var (
		ledgerName string
		currency   string
	)

	for {
		fmt.Print("name: ")
		ledgerName, _ = reader.ReadString('\n')
		ledgerName = strings.TrimSuffix(ledgerName, "\n")
		ledgerName = strings.Replace(ledgerName, " ", "_", -1)

		if len(ledgerName) > 0 {
			if !IsValidLedger(ledgerName) {
				break
			} else {
				fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] ledger with that name already exists. try again"))
			}
		} else {
			fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] ledger name is required"))
		}
	}

	currencyNames := common.GetCurrencyNames()

	for {
		common.SaveTermState()
		currency = prompt.Input("currency [tab for options]: ", common.Completer(currencyNames), prompt.OptionShowCompletionAtStart(), prompt.OptionMaxSuggestion(25))
		common.RestoreTermState()

		found := false

		for _, c := range currencyNames {
			if currency == c {
				found = true
				break
			}
		}

		if found {
			break
		}

		fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] currency not supported"))
	}

	if err := common.CreateLedgerTables(ledgerName, currency); err != nil {
		fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err)))
	} else {
		fmt.Fprintln(os.Stdout, common.ColorizeBlue("[I] ledger added"))
	}

	// bootstrap accounts
	fmt.Printf(common.ColorizeYellow("\nlets create some accounts now\n"))
	for {
		account := PromptForNewAccount(ledgerName)
		if err := AddAccount(ledgerName, account); err != nil {
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
			continue
		}

		fmt.Print("add another account? (y/n): ")
		response, _ := reader.ReadString('\n')
		response = strings.TrimSpace(strings.ToLower(response))

		if response != "y" {
			break
		}
	}

	// bootstrap categories
	fmt.Printf(common.ColorizeYellow("\nand some categories now..\n"))
	for {
		category := PromptForNewCategory(ledgerName)
		if err := AddCategory(ledgerName, category); err != nil {
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
			continue
		}

		fmt.Print("add another category? (y/n): ")
		response, _ := reader.ReadString('\n')
		response = strings.TrimSpace(strings.ToLower(response))

		if response != "y" {
			break
		}
	}
}

func IsValidLedger(ledgerName string) bool {
	ledgers, _ := FetchLedgers()
	for _, item := range ledgers {
		if item.Name == ledgerName {
			return true
		}
	}
	return false
}
