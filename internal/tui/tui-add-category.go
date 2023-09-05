package tui

import (
	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

func showAddCategoryForm(category string) {

	inputFieldFocused = true

	// form
	mainForm := tview.NewForm()

	mainForm.SetTitle("[ Add Category ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)
	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("addCategoryForm")
			app.SetFocus(page3CatTree)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 19, 0).
		SetColumns(0, 55, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("addCategoryForm", grid, true, true)

}
