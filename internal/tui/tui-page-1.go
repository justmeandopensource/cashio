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

	assetsTable.SetBlurFunc(func() {
		assetsTable.SetBorderColor(tcell.Color246)
	})

	assetsTable.SetFocusFunc(func() {
		assetsTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	})

	assetsTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'l':
				if len(liabilityAccounts) == 0 {
					return event
				}
				app.SetFocus(liabilitiesTable)
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
	liabilitiesTable.SetBorderColor(tcell.Color246)
	liabilitiesTable.SetBackgroundColor(tcell.Color235)
	liabilitiesTable.SetSelectedStyle(tcell.StyleDefault.Background(tcell.Color238).Bold(true))

	liabilitiesTable.SetCell(0, 0, tview.NewTableCell(" Account").SetSelectable(false).SetExpansion(2).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))
	liabilitiesTable.SetCell(0, 1, tview.NewTableCell(" Balance").SetAlign(tview.AlignRight).SetSelectable(false).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))

	rowIndex = 1
	for _, account := range liabilityAccounts {
		updateBalances(account)
		generateAccountRows(liabilitiesTable, account, workingLedger.Currency, &rowIndex, 0)
	}

	liabilitiesTable.SetBlurFunc(func() {
		liabilitiesTable.SetBorderColor(tcell.Color246)
	})

	liabilitiesTable.SetFocusFunc(func() {
		liabilitiesTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	})

	liabilitiesTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				if len(assetAccounts) == 0 {
					return event
				}
				app.SetFocus(assetsTable)
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

	statusBar := tview.NewTextView().SetDynamicColors(true).SetTextAlign(tview.AlignCenter).
		SetText(fmt.Sprintf(
			"[yellow]%s\t%s\t%s\t%s",
			"(2)accounts", "(3)categories", "(4)stocks", "(R)eports"))

  statusBar.SetBackgroundColor(tcell.ColorDefault)

	grid := tview.NewGrid().
		SetRows(0, 1).
		SetColumns(0, 1).
		SetBorders(true).
		AddItem(accBalanceFlex, 0, 0, 1, 2, 0, 0, true).
		AddItem(statusBar, 1, 0, 1, 2, 0, 0, false)

  grid.SetBackgroundColor(tcell.ColorDefault)

	pages.AddPage(workingLedger.Name+page1, grid, true, true)
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
		accounts, _ := ledger.FetchAccounts(workingLedger.Name, "", false)
		if ledger.IsPlaceHolderAccount(match[1], accounts) {
			return
		}
		if !pages.HasPage(workingLedger.Name + page2) {
			setupTransByAccPage(workingLedger)
		}
		page2TransTable.Clear()
		page2TransTable.ScrollToBeginning()
		transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, match[1], 100)
		populateTransactionsTable(page2TransTable, transactions, workingLedger.Currency)
    balance := ledger.GetAccountBalance(accounts, match[1])
		page2TransTable.SetTitle(common.FormatAccountsTableTitle(match[1], workingLedger.Currency, balance))
		pages.SwitchToPage(workingLedger.Name + page2)
		accountNode := findNodeByText(page2AccTree.GetRoot(), match[1])
		expandParentNodes(page2AccTreeMap, accountNode)
		page2AccTree.SetCurrentNode(accountNode)
		if len(transactions) == 0 {
			app.SetFocus(page2AccTree)
		} else {
			app.SetFocus(page2TransTable)
		}
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
