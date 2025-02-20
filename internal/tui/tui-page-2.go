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
		SetRoot(tview.NewTreeNode(".").SetSelectable(true).SetColor(common.TCellColorDefaultText)).
		SetCurrentNode(tview.NewTreeNode("").SetSelectable(false))

	page2AccTree.SetTitle(fmt.Sprintf("[ Accounts (%s) ]", workingLedger.Name))
	page2AccTree.SetBackgroundColor(tcell.ColorDefault)
	page2AccTree.SetBorder(true)
	page2AccTree.SetBorderColor(common.TCellColorBorderInactive)

	assetAccounts, _ := ledger.FetchAccounts(workingLedger.Name, "asset", false)
	assetsNode := tview.NewTreeNode("assets").SetIndent(1)
	assetsNode.SetColor(common.TCellColorDefaultText)
	addAccountsToTreeView(assetAccounts, assetsNode, 0)

	liabilityAccounts, _ := ledger.FetchAccounts(workingLedger.Name, "liability", false)
	liabilitiesNode := tview.NewTreeNode("liabilities").SetIndent(1)
	liabilitiesNode.SetColor(common.TCellColorDefaultText)
	addAccountsToTreeView(liabilityAccounts, liabilitiesNode, 0)

	page2AccTree.GetRoot().AddChild(assetsNode)
	page2AccTree.GetRoot().AddChild(liabilitiesNode)
	page2AccTreeMap[assetsNode] = page2AccTree.GetRoot()
	page2AccTreeMap[liabilitiesNode] = page2AccTree.GetRoot()

	page2AccTree.SetBlurFunc(func() {
		page2AccTree.SetBorderColor(common.TCellColorBorderInactive)
	})

	page2AccTree.SetFocusFunc(func() {
		page2AccTree.SetBorderColor(common.TCellColorBorderActive) //borderBlue
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
          } else if accountName == "assets" {
						page2TransTable.SetTitle("[ assets ]")
          } else if accountName == "liabilities" {
						page2TransTable.SetTitle("[ liabilities]")
					} else {
	          accounts, _ := ledger.FetchAccounts(workingLedger.Name, "", false)
	          balance := ledger.GetAccountBalance(accounts, accountName)
						page2TransTable.SetTitle(common.FormatAccountsTableTitle(accountName, workingLedger.Currency, balance))
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
	page2TransTable.SetBorderColor(common.TCellColorBorderInactive)
  page2TransTable.SetBackgroundColor(tcell.ColorDefault)
	transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, ".", 100)
	populateTransactionsTable(page2TransTable, transactions, workingLedger.Currency)
	page2TransTable.SetTitle("[ All Transactions ]")

	page2TransTable.SetBlurFunc(func() {
		page2TransTable.SetBorderColor(common.TCellColorBorderInactive)
	})

	page2TransTable.SetFocusFunc(func() {
		page2TransTable.SetBorderColor(common.TCellColorBorderActive) //borderBlue
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
			"[blue]%s\t%s\t%s\t%s\t[green]%s\t%s",
			"(1)home", "(3)categories", "(4)stocks", "(R)eports",
			"(a)dd transaction", "(t)ransfer funds"))

  statusBar.SetBackgroundColor(tcell.ColorDefault)

	grid := tview.NewGrid().
		SetRows(0, 1).
		SetColumns(0, 1).
		SetBorders(true).
		AddItem(transByAccFlex, 0, 0, 1, 2, 0, 0, true).
		AddItem(statusBar, 1, 0, 1, 2, 0, 0, false)

  grid.SetBackgroundColor(tcell.ColorDefault)

	pages.AddPage(workingLedger.Name+page2, grid, true, true)
}

// addAccountsToTreeView recursively adds accounts to the tree view
func addAccountsToTreeView(accounts []*ledger.Account, node *tview.TreeNode, parentID int) {
	for _, account := range accounts {
		if account.ParentID == parentID {
			childNode := tview.NewTreeNode(account.Name).SetExpanded(false).SetIndent(1).SetColor(common.TCellColorDefaultText)
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
	modal.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
  modal.Box.SetBackgroundColor(tcell.ColorDefault)
	modal.SetBackgroundColor(tcell.ColorDefault)
  modal.SetBorderColor(common.TCellColorBorderActive)

	modal.SetDoneFunc(func(_ int, buttonLabel string) {
		if buttonLabel == "Yes" {
			if err := ledger.DeleteTransaction(workingLedger.Name, transactionID); err != nil {
				app.Stop()
				fmt.Fprint(os.Stderr, common.ColorizeRed(fmt.Sprintf("[E] %v", err)))
			} else {
				accountName := page2AccTree.GetCurrentNode().GetText()
				transactions, _ := ledger.GetTransactionsForAccount(workingLedger.Name, accountName, 100)
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
