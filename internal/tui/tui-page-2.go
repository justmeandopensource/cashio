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
)

var (
	page2AccTree    *tview.TreeView
	page2TransTable *tview.Table
)

var page2AccTreeMap = map[*tview.TreeNode]*tview.TreeNode{}

// setupTransByAccPage sets up tview page that displays transactions list by accounts
func setupTransByAccPage(workingLedger ledger.Ledger) {

	// accounts treeview
	page2AccTree = tview.NewTreeView().
		SetRoot(tview.NewTreeNode(".").SetSelectable(true).SetColor(tcell.Color246)).
		SetCurrentNode(tview.NewTreeNode("").SetSelectable(false))

	page2AccTree.SetTitle(fmt.Sprintf("[ Accounts (%s) ]", workingLedger.Name))
	page2AccTree.SetBackgroundColor(tcell.Color235)
	page2AccTree.SetBorder(true)
	page2AccTree.SetBorderColor(tcell.Color246)

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

	page2AccTree.SetBlurFunc(func() {
		page2AccTree.SetBorderColor(tcell.Color246)
	})

	page2AccTree.SetFocusFunc(func() {
		page2AccTree.SetBorderColor(tview.Styles.SecondaryTextColor)
	})

	page2AccTree.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		currentNode := page2AccTree.GetCurrentNode()
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'a':
				accountName := currentNode.GetText()
				if accountName == "." {
					return event
				}
				accounts := append(assetAccounts, liabilityAccounts...)
				accountID := ledger.GetAccountID(accountName, accounts)
				var accountType string
				switch {
				case accountName == "assets":
					accountType = "asset"
				case accountName == "liabilities":
					accountType = "liability"
				default:
					accountType = ledger.GetAccountType(accountName, accounts)
				}
				if ledger.IsPlaceHolderAccount(accountName, accounts) || accountName == "assets" || accountName == "liabilities" {
					showAddAccountForm(workingLedger, accountID, accountType)
				} else {
					showModal(app.GetFocus(), "Accounts can only be added under a placeholder account")
				}
				return event
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
					transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, accountName, 100)
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

	page2TransTable.SetBlurFunc(func() {
		page2TransTable.SetBorderColor(tcell.Color246)
	})

	page2TransTable.SetFocusFunc(func() {
		page2TransTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	})

	page2TransTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'a':
				config := AddTransactionConfig{
					WorkingLedger:   workingLedger,
					SourceTable:     page2TransTable,
					AccountNodeName: page2AccTree.GetCurrentNode().GetText(),
				}
				showAddTransactionForm(config)
			case 't':
				config := TransferFundsConfig{
					WorkingLedger:   workingLedger,
					SourceTable:     page2TransTable,
					AccountNodeName: page2AccTree.GetCurrentNode().GetText(),
				}
				showTransferFundsLocalForm(config)
			case 'h':
				app.SetFocus(page2AccTree)
			case 'l':
				row, _ := page2TransTable.GetSelection()
				if strings.Contains(page2TransTable.GetCell(row, 5).Text, "<split>") {
					transactionID, _ := strconv.Atoi(strings.TrimSpace(page2TransTable.GetCell(row, 0).Text))
					showSplitsForTransaction(page2TransTable, workingLedger, transactionID)
				}
			case 'd':
				row, _ := page2TransTable.GetSelection()
				id := page2TransTable.GetCell(row, 0).Text
				transID, _ := strconv.Atoi(strings.TrimSpace(id))
				showDeleteConfirmationModal(workingLedger, transID)
			case 's':
				showSearchPage(page2TransTable, workingLedger)
			}
		}
		return event
	})

	// put things together
	transByAccFlex := tview.NewFlex()
	transByAccFlex.AddItem(page2AccTree, 0, 1, true)
	transByAccFlex.AddItem(page2TransTable, 0, 5, true)

	statusBar := tview.NewTextView().SetDynamicColors(true).SetTextAlign(tview.AlignCenter).
		SetText(fmt.Sprintf(
			"[gray]%s\t%s\t%s\t%s\t[blue]%s\t%s",
			"(1)home", "(3)categories", "(4)stocks", "(r)eports",
			"(a)dd transaction", "(t)ransfer funds"))

	grid := tview.NewGrid().
		SetRows(0, 1).
		SetColumns(0, 1).
		SetBorders(true).
		AddItem(transByAccFlex, 0, 0, 1, 2, 0, 0, true).
		AddItem(statusBar, 1, 0, 1, 2, 0, 0, false)

	pages.AddPage(workingLedger.Name+page2, grid, true, true)
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

// showDeleteConfirmationModal shows a confiramtion modal before deleting a transaction
func showDeleteConfirmationModal(workingLedger ledger.Ledger, transactionID int) {

	modal := tview.NewModal()
	modal.SetText("Delete the transaction?")
	modal.AddButtons([]string{"Yes", "No"})
	modal.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
	modal.SetBackgroundColor(tcell.Color235)

	modal.SetDoneFunc(func(_ int, buttonLabel string) {
		if buttonLabel == "Yes" {
			if err := ledger.DeleteTransaction(workingLedger.Name, transactionID); err != nil {
				app.Stop()
				fmt.Fprint(os.Stderr, common.ColorizeRed(fmt.Sprintf("[E] %v", err)))
			} else {
				accountName := page2AccTree.GetCurrentNode().GetText()
				transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, accountName, 50)
				page2TransTable.Clear()
				populateTransactionsTable(page2TransTable, transactions, workingLedger.Currency)
				page2TransTable.ScrollToBeginning()
				page2TransTable.Select(1, 0)
			}
		}
		pages.RemovePage("deleteConfirmationModal")
		app.SetFocus(page2TransTable)
	})

	flex := tview.NewFlex()
	flex.AddItem(nil, 0, 1, true)
	flex.AddItem(modal, 0, 5, true)

	pages.AddPage("deleteConfirmationModal", flex, true, true)
}
