package tui

import (
	"fmt"
	"strconv"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

// updateTable updates the tview table with transactions from selected category or account
func updateTable(transactionsTable *tview.Table, workingLedger ledger.Ledger, account string, category string) {

	tableTitle := "[ all transactions ]"
	if len(account) > 1 {
		tableTitle = fmt.Sprintf("[ %s ]", account)
	} else {
		account = ""
	}
	transactionsTable.SetTitle(tableTitle)
	transactionsTable.SetFixed(1, 1)
	transactionsTable.SetSelectable(true, false)
	transactionsTable.SetBorder(true)
	transactionsTable.SetBackgroundColor(tcell.Color235)
	transactionsTable.SetSelectedStyle(tcell.StyleDefault.Background(tcell.Color238).Bold(true))

	colNames := []string{
		"ID",
		"Date",
		"Category",
		"Credit",
		"Debit",
		"Notes",
		"Account",
	}

	for i, item := range colNames {
		transactionsTable.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetSelectable(false).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))
	}

	var transactions []ledger.Transaction

	if len(category) > 0 {
		transactions, _ = ledger.GetTransactionsForCategory(workingLedger.Name, category, 50)
	} else {
		transactions, _ = ledger.GetTransactionsForAccount(workingLedger.Name, account, 50)
	}

	p := message.NewPrinter(language.MustParse(common.Locales[workingLedger.Currency]))
	for i, item := range transactions {

		defaultTextColor := tcell.Color246
		id := strconv.Itoa(item.ID)
		date := item.Date.Format("2006-01-02")

		var credit, debit, category string

		if item.Credit != 0.00 {
			credit = fmt.Sprintf("%s%s", common.CurrencySymbols[workingLedger.Currency], p.Sprintf("%0.2f", item.Credit))
		}

		if item.Debit != 0.00 {
			debit = fmt.Sprintf("%s%s", common.CurrencySymbols[workingLedger.Currency], p.Sprintf("%0.2f", item.Debit))
		}

		if item.Category != nil {
			category = *item.Category
		} else {
			category = ""
		}

		transactionsTable.SetCell(i+1, 0, tview.NewTableCell(common.PadLeft(id, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(tcell.Color236))
		transactionsTable.SetCell(i+1, 1, tview.NewTableCell(common.PadLeft(date, 1)).SetTextColor(defaultTextColor))
		transactionsTable.SetCell(i+1, 2, tview.NewTableCell(common.PadLeft(category, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(tcell.Color236))
		transactionsTable.SetCell(i+1, 3, tview.NewTableCell(common.PadLeft(credit, 1)).SetAlign(tview.AlignRight).SetTextColor(tcell.ColorGreen))
		transactionsTable.SetCell(i+1, 4, tview.NewTableCell(common.PadLeft(debit, 1)).SetAlign(tview.AlignRight).SetTextColor(tcell.ColorRed).SetBackgroundColor(tcell.Color236))
		transactionsTable.SetCell(i+1, 5, tview.NewTableCell(common.PadLeft(item.Notes, 1)).SetMaxWidth(30).SetExpansion(2).SetTextColor(defaultTextColor))
		transactionsTable.SetCell(i+1, 6, tview.NewTableCell(common.PadLeft(item.Account, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(tcell.Color236))
	}
}
