package tui

import (
	"fmt"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

var (
	page3CatTree    *tview.TreeView
	page3TransTable *tview.Table
)

// setupTransByCatPage sets up the tview page that displays transactions by category
func setupTransByCatPage(workingLedger ledger.Ledger) {

	// accounts treeview
	page3CatTree = tview.NewTreeView().
		SetRoot(tview.NewTreeNode(".").SetSelectable(true).SetColor(tcell.Color246)).
		SetCurrentNode(tview.NewTreeNode("").SetSelectable(false))

	page3CatTree.SetTitle(fmt.Sprintf("[ Categories (%s) ]", workingLedger.Name))
	page3CatTree.SetBorder(true)
	page3CatTree.SetBackgroundColor(tcell.Color235)
	page3CatTree.SetBorderColor(tcell.Color246)

	incomeCategories, _ := ledger.FetchCategories(workingLedger.Name, "income", false)
	incomeNode := tview.NewTreeNode("income").SetIndent(1)
	incomeNode.SetColor(tcell.Color246)
	addCategoriesToTreeView(incomeCategories, incomeNode, 0)

	expenseCategories, _ := ledger.FetchCategories(workingLedger.Name, "expense", false)
	expenseNode := tview.NewTreeNode("expense").SetIndent(1)
	expenseNode.SetColor(tcell.Color246)
	addCategoriesToTreeView(expenseCategories, expenseNode, 0)

	page3CatTree.GetRoot().AddChild(incomeNode)
	page3CatTree.GetRoot().AddChild(expenseNode)

	page3CatTree.SetBlurFunc(func() {
		page3CatTree.SetBorderColor(tcell.Color246)
	})

	page3CatTree.SetFocusFunc(func() {
		page3CatTree.SetBorderColor(tview.Styles.SecondaryTextColor)
	})

	page3CatTree.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		currentNode := page3CatTree.GetCurrentNode()
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
					page3TransTable.Clear()
					categoryName := currentNode.GetText()
					transactions, _ := ledger.GetTransactionsForCategory(workingLedger.Name, categoryName, 50)
					populateTransactionsTable(page3TransTable, transactions, workingLedger.Currency)
					if categoryName == "." {
						page3TransTable.SetTitle("[ All Transactions ]")
					} else {
						page3TransTable.SetTitle("[ " + categoryName + " ]")
					}
					if page3TransTable.GetRowCount() < 2 {
						return event
					}
					app.SetFocus(page3TransTable)
					page3TransTable.ScrollToBeginning()
					page3TransTable.Select(1, 0)
					page3TransTable.SetSelectable(true, false)
				} else {
					if currentNode != nil {
						currentNode.SetExpanded(true)
					}
				}
			case 'g':
				page3CatTree.SetCurrentNode(page3CatTree.GetRoot())
			case 'G':
				page3CatTree.SetCurrentNode(expenseNode.GetChildren()[len(expenseNode.GetChildren())-1])
			}
		}
		return event
	})

	// transaction table
	page3TransTable = tview.NewTable()
	page3TransTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	transactions, _ := ledger.GetTransactionsForCategory(workingLedger.Name, ".", 50)
	populateTransactionsTable(page3TransTable, transactions, workingLedger.Currency)
	page3TransTable.SetTitle("[ All Transactions ]")

	page3TransTable.SetBlurFunc(func() {
		page3TransTable.SetBorderColor(tcell.Color246)
	})

	page3TransTable.SetFocusFunc(func() {
		page3TransTable.SetBorderColor(tview.Styles.SecondaryTextColor)
	})

	page3TransTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'a':
				widgetFocus = app.GetFocus()
				showAddTransactionForm(workingLedger.Name)
			case 'h':
				app.SetFocus(page3CatTree)
			case 's':
				showSearchPage(page3TransTable, workingLedger)
			}
		}
		return event
	})

	// put things together
	transByCatFlex := tview.NewFlex()
	transByCatFlex.AddItem(page3CatTree, 0, 1, true)
	transByCatFlex.AddItem(page3TransTable, 0, 5, true)

	pages.AddPage(workingLedger.Name+page3, transByCatFlex, true, true)
}

// addCategoriesToTreeView recursively adds categories to the tree view
func addCategoriesToTreeView(categories []*ledger.Category, node *tview.TreeNode, parentID int) {
	for _, category := range categories {
		if category.ParentID == parentID {
			childNode := tview.NewTreeNode(category.Name).SetExpanded(false).SetIndent(1).SetColor(tcell.Color246)
			node.AddChild(childNode)

			// Recursively add sub-accounts.
			if len(category.Children) > 0 {
				addCategoriesToTreeView(category.Children, childNode, category.ID)
			}
		}
	}
}
