package tui

import (
	"fmt"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// setupTransByCatPage sets up the tview page that displays transactions by category
func setupTransByCatPage(workingLedger ledger.Ledger) {

	var (
		categoriesTree    *tview.TreeView
		transactionsTable *tview.Table
	)

	// accounts treeview
	categoriesTree = tview.NewTreeView().
		SetRoot(tview.NewTreeNode(".").SetSelectable(true)).
		SetCurrentNode(tview.NewTreeNode("").SetSelectable(false))

	categoriesTree.SetTitle(fmt.Sprintf("[ Categories (%s) ]", workingLedger.Name))
	categoriesTree.SetBorder(true)
	categoriesTree.SetBackgroundColor(tcell.Color235)
	categoriesTree.SetBorderColor(tview.Styles.SecondaryTextColor)

	incomeCategories, _ := ledger.FetchCategories(workingLedger.Name, "income", false)
	incomeNode := tview.NewTreeNode("income").SetIndent(1)
	addCategoriesToTreeView(incomeCategories, incomeNode, 0)

	expenseCategories, _ := ledger.FetchCategories(workingLedger.Name, "expense", false)
	expenseNode := tview.NewTreeNode("expense").SetIndent(1)
	addCategoriesToTreeView(expenseCategories, expenseNode, 0)

	categoriesTree.GetRoot().AddChild(incomeNode)
	categoriesTree.GetRoot().AddChild(expenseNode)

	categoriesTree.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		currentNode := categoriesTree.GetCurrentNode()
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
				if currentNode.GetText() == "." {
					return event
				}
				if currentNode.GetChildren() != nil {
					if !currentNode.IsExpanded() {
						currentNode.SetExpanded(true)
						return event
					}
				}
				if currentNode != nil {
					transactionsTable.Clear()
					updateTable(transactionsTable, workingLedger, "", currentNode.GetText())
					if transactionsTable.GetRowCount() < 2 {
						return event
					}
					app.SetFocus(transactionsTable)
					transactionsTable.ScrollToBeginning()
					transactionsTable.Select(1, 0)
					categoriesTree.SetBorderColor(tcell.ColorWhite)
					transactionsTable.SetBorderColor(tview.Styles.SecondaryTextColor)
					transactionsTable.SetSelectable(true, false)
				} else {
					if currentNode != nil {
						currentNode.SetExpanded(true)
					}
				}
			case 'g':
				categoriesTree.SetCurrentNode(categoriesTree.GetRoot())
			case 'G':
				categoriesTree.SetCurrentNode(expenseNode.GetChildren()[len(expenseNode.GetChildren())-1])
			}
		}
		return event
	})

	// transaction table
	transactionsTable = tview.NewTable()
	updateTable(transactionsTable, workingLedger, "No Category Selected", "")

	transactionsTable.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyRune {
			switch event.Rune() {
			case 'h':
				app.SetFocus(categoriesTree)
				categoriesTree.SetBorderColor(tview.Styles.SecondaryTextColor)
				transactionsTable.SetBorderColor(tcell.ColorWhite)
			case 's':
				widgetFocus = app.GetFocus()
				transactionsTable.SetBorderColor(tcell.ColorWhite)
				showSearchPage(transactionsTable)
			}
		}
		return event
	})

	// put things together
	transByCatFlex := tview.NewFlex()
	transByCatFlex.AddItem(categoriesTree, 0, 1, true)
	transByCatFlex.AddItem(transactionsTable, 0, 5, true)

	pages.AddPage(workingLedger.Name+page3, transByCatFlex, true, true)
}

// addCategoriesToTreeView recursively adds categories to the tree view
func addCategoriesToTreeView(categories []*ledger.Category, node *tview.TreeNode, parentID int) {
	for _, category := range categories {
		if category.ParentID == parentID {
			childNode := tview.NewTreeNode(category.Name).SetExpanded(false).SetIndent(1)
			node.AddChild(childNode)

			// Recursively add sub-accounts.
			if len(category.Children) > 0 {
				addCategoriesToTreeView(category.Children, childNode, category.ID)
			}
		}
	}
}
