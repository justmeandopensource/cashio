package tui

import (
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// showSearchPage collects search keywords from a displayed input field
// and updates the transactions table based on the matching records from the database
func showSearchPage(sourceTable *tview.Table, workingLedger ledger.Ledger) {

	inputFieldFocused = true

	inputField := tview.NewInputField()
	inputField.SetFieldWidth(56)
	inputField.SetBackgroundColor(tcell.Color235)
	inputField.SetFieldBackgroundColor(tcell.Color237)
	inputField.SetBorder(true)
	inputField.SetBorderColor(tview.Styles.SecondaryTextColor)
	inputField.SetBorderPadding(0, 0, 1, 1)
	inputField.SetPlaceholder("enter search keyword(s)")
	inputField.SetPlaceholderStyle(tcell.StyleDefault.Foreground(tcell.Color242).Background(tcell.Color236))

	inputField.SetDoneFunc(func(key tcell.Key) {
		if key == tcell.KeyEnter {
			keywords := strings.TrimSpace(inputField.GetText())
			if len(keywords) > 1 {
				transactions, _ := ledger.GetTransactionsForKeywords(workingLedger.Name, keywords)
				if len(transactions) > 0 {
					populateTransactionsTable(sourceTable, transactions, workingLedger.Currency)
				}
			}
			sourceTable.SetBorderColor(tview.Styles.SecondaryTextColor)
			pages.RemovePage(searchPage)
			inputFieldFocused = false
			app.SetFocus(sourceTable)
		}
	})

	grid := tview.NewGrid().
		SetRows(0, 3, 0).
		SetColumns(0, 60, 0).
		AddItem(inputField, 1, 1, 1, 1, 0, 0, true)
	grid.SetBackgroundColor(tcell.Color235)

	searchFlex := tview.NewFlex()
	searchFlex.AddItem(nil, 0, 1, true)
	searchFlex.AddItem(grid, 0, 5, true)
	pages.AddPage(searchPage, searchFlex, true, true)
	app.SetFocus(inputField)
}
