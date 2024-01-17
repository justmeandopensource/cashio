package tui

import (
	"fmt"
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

var (
	stocksTable     *tview.Table
	stocksStatusBar *tview.TextView
)

// setupStocksPage sets up the tview page that displays investment accounts
func setupStocksPage(workingLedger ledger.Ledger) {

	stocksStatusBar = tview.NewTextView().SetDynamicColors(true).SetTextAlign(tview.AlignCenter)
	stocksTable = tview.NewTable()
	stocksTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	stocksTable.SetTitle(fmt.Sprintf("[ Stocks Dashboard (%s) ]", workingLedger.Name))
	stocks, _ := ledger.FetchStocks(workingLedger.Name, "all")
	populateStocksTable(stocks, workingLedger.Currency)

	stocksTable.SetBlurFunc(func() {
		stocksTable.SetBorderColor(tcell.Color246)
	})

	stocksTable.SetFocusFunc(func() {
		stocksTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	})

	stocksTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'n':
				showAddStockForm(workingLedger)
			case 'p':
				row, _ := stocksTable.GetSelection()
				stockName := strings.TrimSpace(stocksTable.GetCell(row, 1).Text)
				stockID := ledger.GetStockID(stockName, stocks)
				showAddStockTransactionForm(workingLedger, stockName, stockID, "purchase")
			case 'r':
				row, _ := stocksTable.GetSelection()
				stockName := strings.TrimSpace(stocksTable.GetCell(row, 1).Text)
				stockID := ledger.GetStockID(stockName, stocks)
				showAddStockTransactionForm(workingLedger, stockName, stockID, "redeem")
			case 's':
				showSwitchStockTransactionForm(workingLedger)
			case 't':
				row, _ := stocksTable.GetSelection()
				stockName := strings.TrimSpace(stocksTable.GetCell(row, 1).Text)
				stockID := ledger.GetStockID(stockName, stocks)
				currStatus := strings.TrimSpace(stocksTable.GetCell(row, 5).Text)
				if err := ledger.ToggleStockStatus(workingLedger.Name, stockID, currStatus); err != nil {
					showModal(stocksTable, err.Error())
				} else {
					stocks, _ := ledger.FetchStocks(workingLedger.Name, "all")
					populateStocksTable(stocks, workingLedger.Currency)
				}
			case 'u':
				if err := ledger.UpdateNAVs(workingLedger.Name, ledger.GetStockCodesList(stocks)); err != nil {
					showModal(stocksTable, err.Error())
					return event
				}
				if ledger.GoldStocksFound(stocks) {
					if err := ledger.UpdateGoldPrice(workingLedger.Name); err != nil {
						showModal(stocksTable, err.Error())
						return event
					}
				}
				stocks, _ := ledger.FetchStocks(workingLedger.Name, "all")
				populateStocksTable(stocks, workingLedger.Currency)
			}
		} else {
			if event.Key() == tcell.KeyEnter {
				row, _ := stocksTable.GetSelection()
				stockName := strings.TrimSpace(stocksTable.GetCell(row, 1).Text)
				stockID := ledger.GetStockID(stockName, stocks)
				showTransactionsForStock(stocksTable, workingLedger, stockName, stockID)
			}
		}
		return event
	})

	stocksFlex := tview.NewFlex()
	stocksFlex.AddItem(stocksTable, 0, 1, true)

	statusBar := tview.NewTextView().SetDynamicColors(true).SetTextAlign(tview.AlignCenter).
		SetText(fmt.Sprintf(
			"[gray]%s\t%s\t%s\t%s\t[blue]%s\t%s\t%s\t%s\t%s\t%s",
			"(1)home", "(2)accounts", "(3)categories", "(R)eports",
			"(n)ew stock", "(p)urchase units", "(r)edeem units", "(s)switch units", "(t)oggle status", "(u)pdate nav"))

	grid := tview.NewGrid().
		SetRows(0, 1, 1).
		SetColumns(0, 1).
		SetBorders(true).
		AddItem(stocksFlex, 0, 0, 1, 2, 0, 0, true).
		AddItem(stocksStatusBar, 1, 0, 1, 2, 0, 0, false).
		AddItem(statusBar, 2, 0, 1, 2, 0, 0, false)

	pages.AddPage(workingLedger.Name+page4, grid, true, true)
}
