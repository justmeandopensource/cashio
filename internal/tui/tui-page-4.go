package tui

import (
	"fmt"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

var stocksTable *tview.Table

// setupStocksPage sets up the tview page that displays investment accounts
func setupStocksPage(workingLedger ledger.Ledger) {

	stocksTable = tview.NewTable()
	stocksTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	stocksTable.SetTitle(fmt.Sprintf("[ Stocks Dashboard (%s) ]", workingLedger.Name))
	stocks, _ := ledger.FetchStocks(workingLedger.Name, "all")
	populateStocksTable(stocksTable, stocks, workingLedger.Currency)

	stocksTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'n':
				showAddStockForm(workingLedger)
			case 'a':
				showModal(stocksTable, "Feature not implemented")
			case 't':
				showModal(stocksTable, "Feature not implemented")
			}
		}
		return event
	})

	stocksFlex := tview.NewFlex()
	stocksFlex.AddItem(stocksTable, 0, 1, true)

	statusBar := tview.NewTextView().SetDynamicColors(true).SetTextAlign(tview.AlignCenter).
		SetText(fmt.Sprintf(
			"[gray]%s\t%s\t%s\t%s\t[blue]%s\t%s\t%s",
			"(1)home", "(2)accounts", "(3)categories", "(r)eports",
			"(n)ew fund", "(a)dd transaction", "(t)ransfer funds"))

	grid := tview.NewGrid().
		SetRows(0, 1).
		SetColumns(0, 1).
		SetBorders(true).
		AddItem(stocksFlex, 0, 0, 1, 2, 0, 0, true).
		AddItem(statusBar, 1, 0, 1, 2, 0, 0, false)

	pages.AddPage(workingLedger.Name+page4, grid, true, true)
}
