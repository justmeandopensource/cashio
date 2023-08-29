package tui

import (
	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

func showSearchPage(sourceTable *tview.Table) {
	inputField := tview.NewInputField()
	inputField.SetFieldWidth(56)
	inputField.SetBackgroundColor(tcell.Color235)
	inputField.SetFieldBackgroundColor(tcell.Color237)
	inputField.SetBorder(true)
	inputField.SetBorderColor(tview.Styles.SecondaryTextColor)
	inputField.SetBorderPadding(0, 0, 1, 1)
	inputField.SetPlaceholder("enter search keyword(s)")
	inputField.SetPlaceholderStyle(tcell.StyleDefault.Foreground(tcell.Color242).Background(tcell.Color236))

	inputField.SetDoneFunc(func(key tcell.Key) {
		if key == tcell.KeyEnter {
			pages.RemovePage(searchPage)
			app.SetFocus(sourceTable)
			sourceTable.SetBorderColor(tview.Styles.SecondaryTextColor)
		}
	})

	grid := tview.NewGrid().
		SetRows(0, 3, 0).
		SetColumns(0, 60, 0).
		AddItem(inputField, 1, 1, 1, 1, 0, 0, true)
	grid.SetBackgroundColor(tcell.Color235)

	searchFlex := tview.NewFlex()
	searchFlex.AddItem(nil, 0, 1, true)
	searchFlex.AddItem(grid, 0, 5, true)
	pages.AddPage(searchPage, searchFlex, true, true)
	app.SetFocus(inputField)
}
