package tui

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

// populateTransactionsTable loads the transactions table with entries from transactionsList
func populateTransactionsTable(transactionsTable *tview.Table, transactionsList []ledger.Transaction, currency string) {

	transactionsTable.Clear()

	transactionsTable.SetFixed(1, 1)
	transactionsTable.SetSelectable(true, false)
	transactionsTable.SetBorder(true)
	transactionsTable.SetBackgroundColor(tcell.ColorDefault)
	transactionsTable.SetSelectedStyle(tcell.StyleDefault.Background(common.TCellColorTransRowActiveBg).Bold(true))

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
		if item == "Credit" || item == "Debit" {
			transactionsTable.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetAlign(tview.AlignRight).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		} else {
			transactionsTable.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		}
	}

	p := message.NewPrinter(language.MustParse(common.Locales[currency]))
	for i, item := range transactionsList {

		defaultTextColor := common.TCellColorDefaultText
		id := strconv.Itoa(item.ID)
		date := item.Date.Format("2006-01-02")

		var credit, debit, category string

		if item.Credit != 0.00 {
			credit = fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", item.Credit))
		}

		if item.Debit != 0.00 {
			debit = fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", item.Debit))
		}

		if item.Category != nil {
			category = *item.Category
		} else {
			category = ""
		}

		transactionsTable.SetCell(i+1, 0, tview.NewTableCell(common.PadLeft(id, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		transactionsTable.SetCell(i+1, 1, tview.NewTableCell(common.PadLeft(date, 1)).SetTextColor(defaultTextColor))
		transactionsTable.SetCell(i+1, 2, tview.NewTableCell(common.PadLeft(category, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		transactionsTable.SetCell(i+1, 3, tview.NewTableCell(common.PadLeft(credit, 1)).SetAlign(tview.AlignRight).SetTextColor(common.TCellColorGreen))
		transactionsTable.SetCell(i+1, 4, tview.NewTableCell(common.PadLeft(debit, 1)).SetAlign(tview.AlignRight).SetTextColor(common.TCellColorRed).SetBackgroundColor(common.TCellColorTableAltColumns))
		transactionsTable.SetCell(i+1, 5, tview.NewTableCell(common.PadLeft(item.Notes, 1)).SetMaxWidth(30).SetExpansion(2).SetTextColor(defaultTextColor))
		transactionsTable.SetCell(i+1, 6, tview.NewTableCell(common.PadLeft(item.Account, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
	}
}

// populateStocksTable loads the transactions table with entries from transactionsList
func populateStocksTable(stocksList []*ledger.Stock, currency string) {

	investmentStatus := ledger.InvestmentStatus{
		MFInvested:     0.00,
		MFValue:        0.00,
		GoldInvested:   0.00,
		GoldValue:      0.00,
		OthersInvested: 0.00,
		OthersValue:    0.00,
	}

	stocksTable.Clear()
	stocksTable.SetFixed(1, 1)
	stocksTable.SetSelectable(true, false)
	stocksTable.SetBorder(true)
	stocksTable.SetBackgroundColor(tcell.ColorDefault)
	stocksTable.SetSelectedStyle(tcell.StyleDefault.Background(common.TCellColorTransRowActiveBg).Bold(true))

	colNames := []string{
		"ID",
		"Stock",
		"Plan",
		"Code",
		"Type",
		"Status",
		"Units",
		"NAV",
		"NAV Date",
		"Invested",
		"Value",
		"Change",
	}

	for i, item := range colNames {
		switch item {
		case "ID", "Units", "NAV", "Invested", "Value":
			stocksTable.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetAlign(tview.AlignRight).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		default:
			stocksTable.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		}
	}

	p := message.NewPrinter(language.MustParse(common.Locales[currency]))

	for i, item := range stocksList {

		defaultTextColor := common.TCellColorDefaultText
		statusTextColor := defaultTextColor

		id := strconv.Itoa(item.ID)

		var units, nav, invested, value, perc_change string

		units = fmt.Sprintf("%0.3f", item.Units)
		nav = fmt.Sprintf("%0.4f", item.Nav)
		invested = fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", item.Invested))
		curr_value := common.PrecisionRoundAFloat(item.Units*item.Nav, 2)
		value = fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", curr_value))

		change := ((curr_value - item.Invested) / item.Invested) * 100
		perc_change = fmt.Sprintf("%0.2f%%", change)

		var lossOrGainColor tcell.Color

		if curr_value > item.Invested {
			lossOrGainColor = common.TCellColorGreen
		} else if curr_value < item.Invested {
			lossOrGainColor = common.TCellColorRed
		} else {
			lossOrGainColor = defaultTextColor
		}
		if item.Status == "active" {
			statusTextColor = tcell.ColorOrange
		}

		stocksTable.SetCell(i+1, 0, tview.NewTableCell(common.PadLeft(id, 1)).SetAlign(tview.AlignRight).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		stocksTable.SetCell(i+1, 1, tview.NewTableCell(common.PadLeft(item.Name, 1)).SetTextColor(defaultTextColor).SetExpansion(1))
		stocksTable.SetCell(i+1, 2, tview.NewTableCell(common.PadLeft(item.Plan, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		stocksTable.SetCell(i+1, 3, tview.NewTableCell(common.PadLeft(item.Code, 1)).SetTextColor(statusTextColor))
		stocksTable.SetCell(i+1, 4, tview.NewTableCell(common.PadLeft(item.Type, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		stocksTable.SetCell(i+1, 5, tview.NewTableCell(common.PadLeft(item.Status, 1)).SetTextColor(statusTextColor))
		stocksTable.SetCell(i+1, 6, tview.NewTableCell(common.PadLeft(units, 1)).SetAlign(tview.AlignRight).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		stocksTable.SetCell(i+1, 7, tview.NewTableCell(common.PadLeft(nav, 1)).SetAlign(tview.AlignRight).SetTextColor(defaultTextColor))
		stocksTable.SetCell(i+1, 8, tview.NewTableCell(common.PadLeft(item.NavDate, 1)).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		stocksTable.SetCell(i+1, 9, tview.NewTableCell(common.PadLeft(invested, 1)).SetAlign(tview.AlignRight).SetTextColor(common.TCellColorBlue))
		stocksTable.SetCell(i+1, 10, tview.NewTableCell(common.PadLeft(value, 1)).SetAlign(tview.AlignRight).SetTextColor(lossOrGainColor).SetBackgroundColor(common.TCellColorTableAltColumns))
		stocksTable.SetCell(i+1, 11, tview.NewTableCell(common.PadLeft(perc_change, 1)).SetAlign(tview.AlignRight).SetTextColor(lossOrGainColor))

		switch {
		case item.Type == "mutual fund":
			investmentStatus.MFInvested += item.Invested
			investmentStatus.MFValue += curr_value
		case item.Type == "gold":
			investmentStatus.GoldInvested += item.Invested
			investmentStatus.GoldValue += curr_value
		case item.Type == "others":
			investmentStatus.OthersInvested += item.Invested
			investmentStatus.OthersValue += curr_value
		}

		stocksStatusBarText := ""
		changeColor := "green"

		if investmentStatus.GoldInvested != 0.00 {
			invested := fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", investmentStatus.GoldInvested))
			value := fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", investmentStatus.GoldValue))
			goldChange := ((investmentStatus.GoldValue - investmentStatus.GoldInvested) / investmentStatus.GoldInvested) * 100
			if investmentStatus.GoldValue < investmentStatus.GoldInvested {
				changeColor = "red"
			}
			stocksStatusBarText += fmt.Sprintf("[orange]Gold [ [blue]%s [orange]| [%s]%s [orange]| [%s]%0.2f%% [orange]]\t", invested, changeColor, value, changeColor, goldChange)
		}
		if investmentStatus.MFInvested != 0.00 {
			invested := fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", investmentStatus.MFInvested))
			value := fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", investmentStatus.MFValue))
			mfChange := ((investmentStatus.MFValue - investmentStatus.MFInvested) / investmentStatus.MFInvested) * 100
			if investmentStatus.MFValue < investmentStatus.MFInvested {
				changeColor = "red"
			}
			stocksStatusBarText += fmt.Sprintf("[orange]Mutual Fund [ [blue]%s [orange]| [%s]%s [orange]| [%s]%0.2f%% [orange]]\t", invested, changeColor, value, changeColor, mfChange)
		}
		if investmentStatus.OthersInvested != 0.00 {
			invested := fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", investmentStatus.OthersInvested))
			value := fmt.Sprintf("%s%s", common.CurrencySymbols[currency], p.Sprintf("%0.2f", investmentStatus.OthersValue))
			othersChange := ((investmentStatus.OthersValue - investmentStatus.OthersInvested) / investmentStatus.OthersInvested) * 100
			if investmentStatus.OthersValue < investmentStatus.OthersInvested {
				changeColor = "red"
			}
			stocksStatusBarText += fmt.Sprintf("[orange]Others [ [blue]%s [orange]| [%s]%s [orange]| [%s]%0.2f%% [orange]]", invested, changeColor, value, changeColor, othersChange)
		}

		stocksStatusBar.SetText(stocksStatusBarText)

	}
}

// findNodeByText returns the tree node that has the targetText
func findNodeByText(root *tview.TreeNode, targetText string) *tview.TreeNode {

	if root == nil {
		return nil
	}

	if root.GetText() == targetText {
		return root
	}

	for _, child := range root.GetChildren() {
		if node := findNodeByText(child, targetText); node != nil {
			return node
		}
	}

	return nil
}

// expandParentNodes expands all the parent nodes recursively for the given tree node
func expandParentNodes(treeMap map[*tview.TreeNode]*tview.TreeNode, node *tview.TreeNode) {
	if node.GetText() == "." {
		return
	}
	if parent, found := treeMap[node]; found {
		parent.SetExpanded(true)
		expandParentNodes(treeMap, parent)
	}
}

// showSplitsForTransaction shows a popup table with split transactions for the selected transaction
func showSplitsForTransaction(widgetFocus tview.Primitive, workingLedger ledger.Ledger, transactionID int) {

	inputFieldFocused = true

	table := tview.NewTable()

	table.SetTitle(fmt.Sprintf("[ splits for transaction id %d ]", transactionID))
	table.SetSelectable(true, false)
	table.SetBorder(true)
	table.SetBackgroundColor(tcell.ColorDefault)
	table.SetBorderColor(common.TCellColorBorderActive)
	table.SetSelectedStyle(tcell.StyleDefault.Background(common.TCellColorTransRowActiveBg).Bold(true))

	colNames := []string{
		"Category",
		"Credit",
		"Debit",
		"Notes",
	}

	for i, item := range colNames {
		if item == "Credit" || item == "Debit" {
			table.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetAlign(tview.AlignRight).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		} else {
			table.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		}
	}

	splitTransactions, _ := ledger.GetSplitsForTransaction(workingLedger.Name, transactionID)

	p := message.NewPrinter(language.MustParse(common.Locales[workingLedger.Currency]))
	for i, item := range splitTransactions {

		defaultTextColor := common.TCellColorDefaultText

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

		table.SetCell(i+1, 0, tview.NewTableCell(common.PadLeft(category, 1)).SetTextColor(defaultTextColor))
		table.SetCell(i+1, 1, tview.NewTableCell(common.PadLeft(credit, 1)).SetAlign(tview.AlignRight).SetTextColor(common.TCellColorGreen))
		table.SetCell(i+1, 2, tview.NewTableCell(common.PadLeft(debit, 1)).SetAlign(tview.AlignRight).SetTextColor(common.TCellColorRed))
		table.SetCell(i+1, 3, tview.NewTableCell(common.PadLeft(item.Notes, 1)).SetExpansion(2).SetTextColor(defaultTextColor))
	}

	table.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				pages.RemovePage("splits")
				inputFieldFocused = false
				app.SetFocus(widgetFocus)
			}
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 15, 0).
		SetColumns(0, 75, 0).
		AddItem(table, 1, 1, 1, 1, 0, 0, true)

	flex := tview.NewFlex()
	flex.AddItem(nil, 0, 1, true)
	flex.AddItem(grid, 0, 5, true)

	pages.AddPage("splits", flex, true, true)
}

// showTransactionsForStock shows a popup table with transactions for the selected stock
func showTransactionsForStock(widgetFocus tview.Primitive, workingLedger ledger.Ledger, stockName string, stockID int) {

	inputFieldFocused = true

	table := tview.NewTable()

	table.SetTitle(fmt.Sprintf("[ %v ]", stockName))
	table.SetSelectable(true, false)
	table.SetBorder(true)
	table.SetBackgroundColor(tcell.ColorDefault)
	table.SetBorderColor(common.TCellColorBorderActive)
	table.SetSelectedStyle(tcell.StyleDefault.Background(common.TCellColorTransRowActiveBg).Bold(true))

	colNames := []string{
		"Date",
		"Notes",
		"Units",
		"NAV",
		"Amount",
		"Bank Account",
	}

	for i, item := range colNames {
		switch item {
		case "Units", "NAV", "Amount":
			table.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetAlign(tview.AlignRight).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		default:
			table.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetSelectable(false).SetTextColor(tcell.ColorWhite).SetBackgroundColor(common.TCellColorTableHeaderRow))
		}
	}

	stockTransactions, err := ledger.GetTransactionsForStock(workingLedger.Name, stockID)
	if err != nil {
		showModal(stocksTable, err.Error())
		inputFieldFocused = false
		return
	}

	p := message.NewPrinter(language.MustParse(common.Locales[workingLedger.Currency]))
	for i, item := range stockTransactions {

		defaultTextColor := common.TCellColorDefaultText
		statusTextColor := common.TCellColorRed

		if strings.Contains(strings.ToLower(item.TransactionType), "purchase") {
			statusTextColor = common.TCellColorGreen
		}

		var units, nav, amount, bankName string

		units = fmt.Sprintf("%0.3f", item.Units)
		nav = fmt.Sprintf("%0.4f", item.Nav)
		amount = fmt.Sprintf("%s%s", common.CurrencySymbols[workingLedger.Currency], p.Sprintf("%0.2f", item.Amount))

		if item.BankName != nil {
			bankName = *item.BankName
		} else {
			bankName = ""
		}

		table.SetCell(i+1, 0, tview.NewTableCell(common.PadLeft(item.Date.Format("2006-01-02"), 1)).SetTextColor(defaultTextColor).SetBackgroundColor(common.TCellColorTransRowActiveBg))
		table.SetCell(i+1, 1, tview.NewTableCell(common.PadLeft(item.TransactionType, 1)).SetTextColor(defaultTextColor).SetExpansion(1))
		table.SetCell(i+1, 2, tview.NewTableCell(common.PadLeft(units, 1)).SetAlign(tview.AlignRight).SetTextColor(statusTextColor).SetBackgroundColor(common.TCellColorTransRowActiveBg))
		table.SetCell(i+1, 3, tview.NewTableCell(common.PadLeft(nav, 1)).SetAlign(tview.AlignRight).SetTextColor(statusTextColor))
		table.SetCell(i+1, 4, tview.NewTableCell(common.PadLeft(amount, 1)).SetAlign(tview.AlignRight).SetAlign(tview.AlignRight).SetTextColor(statusTextColor).SetBackgroundColor(common.TCellColorTransRowActiveBg))
		table.SetCell(i+1, 5, tview.NewTableCell(common.PadLeft(bankName, 1)).SetAlign(tview.AlignRight).SetTextColor(defaultTextColor))
	}

	table.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				pages.RemovePage("stockTransactions")
				inputFieldFocused = false
				app.SetFocus(widgetFocus)
			}
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 30, 0).
		SetColumns(0, 150, 0).
		AddItem(table, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("stockTransactions", grid, true, true)
}

// showModal shows a modal with a given message
func showModal(widgetFocus tview.Primitive, message string) {

	modal := tview.NewModal()
	modal.SetText(message)
	modal.AddButtons([]string{"Close"})
	modal.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
  modal.Box.SetBackgroundColor(tcell.ColorDefault)
	modal.SetBackgroundColor(tcell.ColorDefault)
  modal.SetBorderColor(common.TCellColorBorderActive)

	modal.SetDoneFunc(func(_ int, buttonLabel string) {
		if buttonLabel == "Close" {
			pages.RemovePage("modal")
			app.SetFocus(widgetFocus)
		}
	})

	flex := tview.NewFlex()
	flex.AddItem(nil, 0, 1, true)
	flex.AddItem(modal, 0, 5, true)

	pages.AddPage("modal", flex, true, true)
}

// showError sets the given text in the status field and clears it after 3 seconds
func showError(errorField *tview.TextView, errorMsg string) {
	errorField.SetText(fmt.Sprintf("[red]%s", errorMsg))
	go time.AfterFunc(3*time.Second, func() {
		errorField.SetText("")
	})
}
