package tui

import (
	"fmt"
	"os"
	"time"

	ui "github.com/gizak/termui/v3"
	"github.com/gizak/termui/v3/widgets"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/justmeandopensource/cashio/internal/termui"
)

// CategoryStatsUI is the entrypoint for the termui interface displaying category stats
func CategoryStatsUI(ledgerName string) {

	if err := ui.Init(); err != nil {
		fmt.Fprint(os.Stderr, common.ColorizeRed(fmt.Sprintf("[E] failed to initialize termui: %v", err)))
	}
	defer ui.Close()

	tree := createCategoriesTree(ledgerName)
  tree.BorderStyle.Fg = ui.Color(common.ColorActiveBorder)
	bcMonthly := termui.NewBarChart()
	bcMonthly.BorderStyle.Fg = ui.Color(common.ColorInactiveBorder)
	bcYearly := termui.NewBarChart()
	bcYearly.BorderStyle.Fg = ui.Color(common.ColorInactiveBorder)

	grid := ui.NewGrid()

	x, y := ui.TerminalDimensions()
	grid.SetRect(0, 0, x, y)

	grid.Set(
		ui.NewRow(1.0,
			ui.NewCol(0.67/4, tree),
			ui.NewCol(3.33/4,
				ui.NewRow(1.0/2, bcMonthly),
				ui.NewRow(1.0/2, bcYearly),
			)),
	)

	ui.Render(grid)

	uiEvents := ui.PollEvents()
	for {
		e := <-uiEvents
		switch e.ID {
		case "q", "<C-c>":
			return
		case "j", "<Down>":
			tree.ScrollDown()
		case "k", "<Up>":
			tree.ScrollUp()
		case "g":
			tree.ScrollTop()
		case "h":
			tree.Collapse()
		case "l":
			node := tree.SelectedNode()
			category := node.Value.String()
			if len(node.Nodes) > 0 {
				if node.Expanded {
					createBarChart(ledgerName, bcMonthly, category, "monthly", 15)
					createBarChart(ledgerName, bcYearly, category, "yearly", 10)
				} else {
					tree.Expand()
				}
			} else {
				createBarChart(ledgerName, bcMonthly, category, "monthly", 15)
				createBarChart(ledgerName, bcYearly, category, "yearly", 10)
			}
		case "G", "<End>":
			tree.ScrollBottom()
		case "E":
			tree.ExpandAll()
		case "C":
			tree.CollapseAll()
		case "<Resize>":
			x, y := ui.TerminalDimensions()
			tree.SetRect(0, 0, x, y)
		}

		ui.Render(grid)
	}
}

type nodeValue string

func (nv nodeValue) String() string {
	return string(nv)
}

// createCategoriesTree generates a tree widget with initial income and expense nodes
func createCategoriesTree(ledgerName string) *widgets.Tree {

	tree := widgets.NewTree()
	tree.Title = fmt.Sprintf("[ Categories (%v) ]", ledgerName)

	tree.TextStyle = ui.NewStyle(ui.Color(246))
	tree.SelectedRowStyle = ui.NewStyle(ui.Color(16), ui.Color(246))

	tree.BorderStyle.Fg = ui.ColorYellow

	incomeNode := &widgets.TreeNode{
		Value:    nodeValue("income"),
		Expanded: true,
		Nodes:    []*widgets.TreeNode{},
	}
	incomeCategories, _ := ledger.FetchCategories(ledgerName, "income", false)
	populateCategoryTreeNodes(incomeCategories, incomeNode, 0)

	expenseNode := &widgets.TreeNode{
		Value:    nodeValue("expense"),
		Expanded: true,
		Nodes:    []*widgets.TreeNode{},
	}
	expenseCategories, _ := ledger.FetchCategories(ledgerName, "expense", false)
	populateCategoryTreeNodes(expenseCategories, expenseNode, 0)

	nodes := []*widgets.TreeNode{expenseNode, incomeNode}

	tree.SetNodes(nodes)
	return tree
}

// populateCategoryTreeNodes recursively adds categories to the income and expense tree nodes
func populateCategoryTreeNodes(categories []*ledger.Category, node *widgets.TreeNode, parentID int) {

	for _, cat := range categories {
		if cat.ParentID == parentID {
			childNode := &widgets.TreeNode{
				Value: nodeValue(cat.Name),
				Nodes: []*widgets.TreeNode{},
			}

			if cat.Placeholder == 1 {
				populateCategoryTreeNodes(cat.Children, childNode, cat.ID)
			}

			node.Nodes = append(node.Nodes, childNode)
		}
	}
}

// createBarChart displays the bar chart for the selected category from the categories tree
func createBarChart(ledgerName string, bc *termui.BarChart, category string, period string, count int) {

	var statsData []*ledger.StatsData
	switch category {
	case "income", "expense":
		statsData, _ = ledger.FetchIncomeExpenseStatsData(ledgerName, category, period, count)
	default:
		statsData, _ = ledger.FetchCategoryStatsData(ledgerName, category, period, count)
	}
	labels := make([]string, len(statsData))
	data := make([]float64, len(statsData))

	for i, item := range statsData {
		if period == "monthly" {
			dateTime, _ := time.Parse("2006-01", item.Period)
			labels[i] = dateTime.Format("Jan 06")
		} else {
			labels[i] = item.Period
		}
		data[i] = item.Amount
	}

	var barColor int
	switch period {
	case "monthly":
		barColor = int(ui.ColorBlue)
	case "yearly":
		barColor = int(ui.ColorYellow)
	}

	bc.Title = fmt.Sprintf("[ %v - last %d %s data ]", category, count, period)
	bc.Data = data
	bc.Labels = labels
	bc.BarWidth = 8
	bc.PaddingTop = 2
	bc.BarColors = []ui.Color{ui.Color(barColor)}
	bc.LabelStyles = []ui.Style{ui.NewStyle(ui.Color(246))}
	bc.NumStyles = []ui.Style{ui.NewStyle(ui.ColorBlack)}
}
