package tui

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

// setupAccBalancePage sets up the tview page that displays accounts along with their balances
func setupAccBalancePage(workingLedger ledger.Ledger) {

	assetsTable := tview.NewTable()
	liabilitiesTable := tview.NewTable()

	assetAccounts, _ := ledger.FetchAccounts(workingLedger.Name, "asset", false)
	liabilityAccounts, _ := ledger.FetchAccounts(workingLedger.Name, "liability", false)

	assetsTable.SetTitle(fmt.Sprintf("[ Asset Accounts (%s) ]", workingLedger.Name))
	assetsTable.SetFixed(1, 1)
	assetsTable.SetSelectable(true, false)
	assetsTable.SetBorder(true)
	assetsTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	assetsTable.SetBackgroundColor(tcell.Color235)
	assetsTable.SetSelectedStyle(tcell.StyleDefault.Background(tcell.Color238).Bold(true))

	assetsTable.SetCell(0, 0, tview.NewTableCell(" Account").SetSelectable(false).SetExpansion(2).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))
	assetsTable.SetCell(0, 1, tview.NewTableCell(" Balance").SetAlign(tview.AlignRight).SetSelectable(false).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))

	rowIndex := 1
	for _, account := range assetAccounts {
		updateBalances(account)
		generateAccountRows(assetsTable, account, workingLedger.Currency, &rowIndex, 0)
	}

	assetsTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'l':
				if len(liabilityAccounts) == 0 {
					return event
				}
				app.SetFocus(liabilitiesTable)
				assetsTable.SetBorderColor(tcell.ColorWhite)
				liabilitiesTable.SetBorderColor(tview.Styles.SecondaryTextColor)
			}
		} else {
			if event.Key() == tcell.KeyEnter {
				jumpToAccounts(workingLedger, assetsTable)
			}
		}
		return event
	})

	liabilitiesTable.SetTitle(fmt.Sprintf("[ Liability Accounts (%s) ]", workingLedger.Name))
	liabilitiesTable.SetFixed(1, 1)
	liabilitiesTable.SetSelectable(true, false)
	liabilitiesTable.SetBorder(true)
	liabilitiesTable.SetBackgroundColor(tcell.Color235)
	liabilitiesTable.SetSelectedStyle(tcell.StyleDefault.Background(tcell.Color238).Bold(true))

	liabilitiesTable.SetCell(0, 0, tview.NewTableCell(" Account").SetSelectable(false).SetExpansion(2).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))
	liabilitiesTable.SetCell(0, 1, tview.NewTableCell(" Balance").SetAlign(tview.AlignRight).SetSelectable(false).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))

	rowIndex = 1
	for _, account := range liabilityAccounts {
		updateBalances(account)
		generateAccountRows(liabilitiesTable, account, workingLedger.Currency, &rowIndex, 0)
	}

	liabilitiesTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				if len(assetAccounts) == 0 {
					return event
				}
				app.SetFocus(assetsTable)
				liabilitiesTable.SetBorderColor(tcell.ColorWhite)
				assetsTable.SetBorderColor(tview.Styles.SecondaryTextColor)
			}
		} else {
			if event.Key() == tcell.KeyEnter {
				jumpToAccounts(workingLedger, liabilitiesTable)
			}
		}

		return event
	})

	// put things together
	accBalanceFlex := tview.NewFlex()
	accBalanceFlex.AddItem(assetsTable, 0, 5, true)
	accBalanceFlex.AddItem(liabilitiesTable, 0, 5, true)

	pages.AddPage(workingLedger.Name+page1, accBalanceFlex, true, true)
}

// generateAccountRows generates a row for the given account with balance and adds it to the tview table
func generateAccountRows(table *tview.Table, account *ledger.Account, currency string, rowIndex *int, level int) {

	defaultTextColor := tcell.Color246

	balanceColor := tcell.Color246
	balanceBgColor := tcell.ColorDefault

	p := message.NewPrinter(language.MustParse(common.Locales[currency]))

	balance := p.Sprintf("%0.2f", account.Balance)
	balance = strings.TrimPrefix(balance, "-")
	if balance == "0.00" {
		return
	}
	balance = common.CurrencySymbols[currency] + balance

	switch {
	case account.Placeholder == 1:
		balanceColor = tcell.ColorBlue
		balanceBgColor = tcell.Color236
	case account.Balance > 0:
		balanceColor = tcell.ColorGreen
	case account.Balance < 0:
		balanceColor = tcell.ColorRed
	}

	table.SetCell(*rowIndex, 0, tview.NewTableCell(strings.Repeat("    ", level)+"- "+account.Name).SetExpansion(2).SetAlign(tview.AlignLeft).SetTextColor(defaultTextColor).SetBackgroundColor(balanceBgColor))
	table.SetCell(*rowIndex, 1, tview.NewTableCell(balance).SetAlign(tview.AlignRight).SetTextColor(balanceColor).SetBackgroundColor(balanceBgColor))

	*rowIndex++

	for _, childAccount := range account.Children {
		generateAccountRows(table, childAccount, currency, rowIndex, level+1)
	}
}

// jumpToAccounts switches focus to selected account's transactions list page
func jumpToAccounts(workingLedger ledger.Ledger, table *tview.Table) {
	row, _ := table.GetSelection()
	accountName := table.GetCell(row, 0).Text
	re := regexp.MustCompile(`^\s*- (.+)`)
	match := re.FindStringSubmatch(accountName)
	if len(match) >= 2 {
		accounts, _ := ledger.FetchAccounts(workingLedger.Name, "", true)
		if ledger.IsPlaceholderAccount(match[1], accounts) {
			return
		}
		if !pages.HasPage(workingLedger.Name + page2) {
			setupTransByAccPage(workingLedger)
		}
		page2TransTable.Clear()
		page2TransTable.ScrollToBeginning()
		transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, match[1], 50)
		populateTransactionsTable(page2TransTable, transactions, workingLedger.Currency)
		page2TransTable.SetTitle("[ " + match[1] + " ]")
		pages.SwitchToPage(workingLedger.Name + page2)
		app.SetFocus(page2TransTable)
		page2TransTable.SetBorderColor(tview.Styles.SecondaryTextColor)
		accountNode := findNodeByText(page2AccTree.GetRoot(), match[1])
		expandParentNodes(accountNode)
		page2AccTree.SetCurrentNode(accountNode)
		page2AccTree.SetBorderColor(tcell.ColorWhite)
	}
}

// updateBalances calculates the total balance for a given account adding balances
// of all its child accounts
func updateBalances(account *ledger.Account) float64 {
	if account.Placeholder == 0 {
		return account.Balance
	}

	var totalBalance float64
	for _, child := range account.Children {
		totalBalance += updateBalances(child)
	}

	account.Balance = totalBalance
	return totalBalance
}
