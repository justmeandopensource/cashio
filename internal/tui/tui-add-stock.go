package tui

import (
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// showAddStockForm collects new stock details using form and adds it to the database
func showAddStockForm(workingLedger ledger.Ledger) {

	inputFieldFocused = true

	var stockType string

	// form
	mainForm := tview.NewForm()

	// stock type
	mainForm.AddDropDown("Type", []string{"mutual fund", "gold", "others"}, 0, func(option string, optionIndex int) {
		stockType = option
	})
	mainForm.GetFormItemByLabel("Type").(*tview.DropDown).SetListStyles(
		tcell.StyleDefault.Background(tcell.Color236),
		tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor),
	).SetFieldBackgroundColor(tcell.ColorDefault)

	// stock name
	mainForm.AddInputField("Stock Name", "", 100, nil, nil)
	fieldStockName := mainForm.GetFormItemByLabel("Stock Name").(*tview.InputField)

	// status text
	mainForm.AddTextView("  ", "", 30, 1, true, false)
	errorField := mainForm.GetFormItemByLabel("  ").(*tview.TextView)

	mainForm.AddButton("Submit", func() {
		stockName := strings.TrimSpace(fieldStockName.GetText())
		if stockName == "" {
			showError(errorField, "invalid stock name")
			return
		} else {
			stock := ledger.Stock{
				Name: stockName,
				Type: stockType,
			}
			if err := ledger.AddStock(workingLedger.Name, stock); err != nil {
				pages.RemovePage("addStockForm")
				app.SetFocus(stocksTable)
				inputFieldFocused = false
				showModal(stocksTable, err.Error())
				return
			} else {
				pages.RemovePage(workingLedger.Name + page4)
				setupStocksPage(workingLedger)
			}
		}
		pages.RemovePage("addStockForm")
		app.SetFocus(stocksTable)
		inputFieldFocused = false
	})
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage("addStockForm")
		app.SetFocus(stocksTable)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(tcell.Color238)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	mainForm.SetTitle("[ Add Stock ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)
	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("addStockForm")
			app.SetFocus(stocksTable)
			inputFieldFocused = false
		}
		return event
	})
	mainForm.SetFocus(1)

	grid := tview.NewGrid().
		SetRows(0, 11, 0).
		SetColumns(0, 75, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("addStockForm", grid, true, true)

}
