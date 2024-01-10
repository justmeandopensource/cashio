package tui

import (
	"fmt"
	"os"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

var (
	app   = tview.NewApplication()
	pages = tview.NewPages()
)

const (
	page1      = "accBalancePage"
	page2      = "transByAccountPage"
	page3      = "transByCategoryPage"
	page4      = "stocksPage"
	searchPage = "search"
)

var inputFieldFocused = false

// TransactionsUI is the entrypoint for the tview application
func TransactionsUI(ledgerName string) {

	ledgers, err := ledger.FetchLedgers()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// check if we have the named ledger
	workingLedger := ledger.Ledger{}
	for _, item := range ledgers {
		if item.Name == ledgerName {
			workingLedger = *item
		}
	}

	setupAccBalancePage(workingLedger)

	app.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if inputFieldFocused {
			return event
		}
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'q':
				app.Stop()
			case '1':
				pages.RemovePage(ledgerName + page1)
				setupAccBalancePage(workingLedger)
			case '2':
				if !pages.HasPage(ledgerName + page2) {
					setupTransByAccPage(workingLedger)
				}
				pages.SwitchToPage(ledgerName + page2)
			case '3':
				if !pages.HasPage(ledgerName + page3) {
					setupTransByCatPage(workingLedger)
				}
				pages.SwitchToPage(ledgerName + page3)
			case '4':
				if !pages.HasPage(ledgerName + page4) {
					setupStocksPage(workingLedger)
				}
				pages.SwitchToPage(ledgerName + page4)
			case 'R':
				app.Suspend(func() {
					CategoryStatsUI(ledgerName)
				})
			}
		}
		return event
	})

	if err := app.SetRoot(pages, true).Run(); err != nil {
		panic(err)
	}
}
