package tui

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

var (
	page2AccTree    *tview.TreeView
	page2TransTable *tview.Table
)

var page2AccTreeMap = map[*tview.TreeNode]*tview.TreeNode{}
var confirmed = false

// setupTransByAccPage sets up tview page that displays transactions list by accounts
func setupTransByAccPage(workingLedger ledger.Ledger) {

	// accounts treeview
	page2AccTree = tview.NewTreeView().
		SetRoot(tview.NewTreeNode(".").SetSelectable(true).SetColor(tcell.Color246)).
		SetCurrentNode(tview.NewTreeNode("").SetSelectable(false))

	page2AccTree.SetTitle(fmt.Sprintf("[ Accounts (%s) ]", workingLedger.Name))
	page2AccTree.SetBorder(true)
	page2AccTree.SetBackgroundColor(tcell.Color235)
	page2AccTree.SetBorderColor(tview.Styles.SecondaryTextColor)

	assetAccounts, _ := ledger.FetchAccounts(workingLedger.Name, "asset", false)
	assetsNode := tview.NewTreeNode("assets").SetIndent(1)
	assetsNode.SetColor(tcell.Color246)
	addAccountsToTreeView(assetAccounts, assetsNode, 0)

	liabilityAccounts, _ := ledger.FetchAccounts(workingLedger.Name, "liability", false)
	liabilitiesNode := tview.NewTreeNode("liabilities").SetIndent(1)
	liabilitiesNode.SetColor(tcell.Color246)
	addAccountsToTreeView(liabilityAccounts, liabilitiesNode, 0)

	page2AccTree.GetRoot().AddChild(assetsNode)
	page2AccTree.GetRoot().AddChild(liabilitiesNode)
	page2AccTreeMap[assetsNode] = page2AccTree.GetRoot()
	page2AccTreeMap[liabilitiesNode] = page2AccTree.GetRoot()

	page2AccTree.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		currentNode := page2AccTree.GetCurrentNode()
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				if currentNode.GetText() == "." {
					return event
				}
				if currentNode.GetChildren() != nil {
					currentNode.SetExpanded(false)
				}
			case 'l':
				if currentNode.GetChildren() != nil {
					if !currentNode.IsExpanded() {
						currentNode.SetExpanded(true)
						return event
					}
				}
				if currentNode != nil {
					page2TransTable.Clear()
					accountName := currentNode.GetText()
					transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, accountName, 50)
					populateTransactionsTable(page2TransTable, transactions, workingLedger.Currency)
					if accountName == "." {
						page2TransTable.SetTitle("[ All Transactions ]")
					} else {
						page2TransTable.SetTitle("[ " + accountName + " ]")
					}
					if page2TransTable.GetRowCount() < 2 {
						return event
					}
					app.SetFocus(page2TransTable)
					page2TransTable.ScrollToBeginning()
					page2TransTable.Select(1, 0)
					page2AccTree.SetBorderColor(tcell.Color246)
					page2TransTable.SetBorderColor(tview.Styles.SecondaryTextColor)
					page2TransTable.SetSelectable(true, false)
				}
			case 'g':
				page2AccTree.SetCurrentNode(page2AccTree.GetRoot())
			case 'G':
				page2AccTree.SetCurrentNode(liabilitiesNode.GetChildren()[len(liabilitiesNode.GetChildren())-1])
			}
		}
		return event
	})

	// transaction table
	page2TransTable = tview.NewTable()
	page2TransTable.SetBorderColor(tcell.Color246)
	transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, ".", 50)
	populateTransactionsTable(page2TransTable, transactions, workingLedger.Currency)
	page2TransTable.SetTitle("[ All Transactions ]")

	page2TransTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				app.SetFocus(page2AccTree)
				page2AccTree.SetBorderColor(tview.Styles.SecondaryTextColor)
				page2TransTable.SetBorderColor(tcell.Color246)
			case 'l':
				row, _ := page2TransTable.GetSelection()
				if strings.Contains(page2TransTable.GetCell(row, 5).Text, "<split>") {
					transactionID, _ := strconv.Atoi(strings.TrimSpace(page2TransTable.GetCell(row, 0).Text))
					page2TransTable.SetBorderColor(tcell.Color246)
					showSplitsForTransaction(workingLedger, transactionID)
				}
			case 'd':
				row, _ := page2TransTable.GetSelection()
				id := page2TransTable.GetCell(row, 0).Text
				transID, _ := strconv.Atoi(strings.TrimSpace(id))
				page2TransTable.SetBorderColor(tcell.Color246)
				showDeleteConfirmationModal(workingLedger, transID)
			case 's':
				page2TransTable.SetBorderColor(tcell.Color246)
				showSearchPage(page2TransTable, workingLedger)
			}
		}
		return event
	})

	// put things together
	transByAccFlex := tview.NewFlex()
	transByAccFlex.AddItem(page2AccTree, 0, 1, true)
	transByAccFlex.AddItem(page2TransTable, 0, 5, true)

	pages.AddPage(workingLedger.Name+page2, transByAccFlex, true, true)
}

// addAccountsToTreeView recursively adds accounts to the tree view
func addAccountsToTreeView(accounts []*ledger.Account, node *tview.TreeNode, parentID int) {
	for _, account := range accounts {
		if account.ParentID == parentID {
			childNode := tview.NewTreeNode(account.Name).SetExpanded(false).SetIndent(1).SetColor(tcell.Color246)
			node.AddChild(childNode)
			page2AccTreeMap[childNode] = node

			// Recursively add sub-accounts.
			if len(account.Children) > 0 {
				addAccountsToTreeView(account.Children, childNode, account.ID)
			}
		}
	}
}

// showSplitsForTransaction shows a popup table with split transactions for the selected transaction
func showSplitsForTransaction(workingLedger ledger.Ledger, transactionID int) {

	table := tview.NewTable()

	table.SetTitle(fmt.Sprintf("[ splits for transaction id %d ]", transactionID))
	table.SetSelectable(true, false)
	table.SetBorder(true)
	table.SetBackgroundColor(tcell.Color235)
	table.SetBorderColor(tview.Styles.SecondaryTextColor)
	table.SetSelectedStyle(tcell.StyleDefault.Background(tcell.Color238).Bold(true))

	colNames := []string{
		"Category",
		"Credit",
		"Debit",
		"Notes",
	}

	for i, item := range colNames {
		table.SetCell(0, i, tview.NewTableCell(common.PadLeft(item, 1)).SetSelectable(false).SetTextColor(tcell.ColorBlack).SetBackgroundColor(tcell.ColorYellow))
	}

	splitTransactions, _ := ledger.GetSplitsForTransaction(workingLedger.Name, transactionID)

	p := message.NewPrinter(language.MustParse(common.Locales[workingLedger.Currency]))
	for i, item := range splitTransactions {

		defaultTextColor := tcell.Color246

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
		table.SetCell(i+1, 1, tview.NewTableCell(common.PadLeft(credit, 1)).SetAlign(tview.AlignRight).SetTextColor(tcell.ColorGreen))
		table.SetCell(i+1, 2, tview.NewTableCell(common.PadLeft(debit, 1)).SetAlign(tview.AlignRight).SetTextColor(tcell.ColorRed))
		table.SetCell(i+1, 3, tview.NewTableCell(common.PadLeft(item.Notes, 1)).SetExpansion(2).SetTextColor(defaultTextColor))
	}

	table.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				pages.RemovePage("splits")
				page2TransTable.SetBorderColor(tview.Styles.SecondaryTextColor)
				app.SetFocus(page2TransTable)
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

// showDeleteConfirmationModal shows a confiramtion modal before deleting a transaction
func showDeleteConfirmationModal(workingLedger ledger.Ledger, transactionID int) {

	modal := tview.NewModal()
	modal.SetText("Delete the transaction?")
	modal.AddButtons([]string{"Yes", "No"})
	modal.SetBackgroundColor(tcell.Color235)

	modal.SetDoneFunc(func(_ int, buttonLabel string) {
		if buttonLabel == "Yes" {
			if err := ledger.DeleteTransaction(workingLedger.Name, transactionID); err != nil {
				app.Stop()
				fmt.Fprintf(os.Stderr, common.ColorizeRed(fmt.Sprintf("[E] %v", err)))
			} else {
				accountName := page2AccTree.GetCurrentNode().GetText()
				transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, accountName, 50)
				page2TransTable.Clear()
				populateTransactionsTable(page2TransTable, transactions, workingLedger.Currency)
				page2TransTable.ScrollToBeginning()
				page2TransTable.Select(1, 0)
			}
		}
		pages.RemovePage("modal")
		page2TransTable.SetBorderColor(tview.Styles.SecondaryTextColor)
		app.SetFocus(page2TransTable)
	})

	flex := tview.NewFlex()
	flex.AddItem(nil, 0, 1, true)
	flex.AddItem(modal, 0, 5, true)

	pages.AddPage("modal", flex, true, true)
}
