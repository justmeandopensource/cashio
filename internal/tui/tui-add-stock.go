package tui

import (
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// showAddStockForm collects new stock details using form and adds it to the database
func showAddStockForm(workingLedger ledger.Ledger) {

	inputFieldFocused = true

	var (
		stockType string
		stockName string
		stockCode string
		stockPlan string

		mainFormTitle = "[ Add Stock ]"
		pageName      = "addStockForm"
	)

  // #########################################################
	// ######################### FORM ##########################
  // #########################################################
	mainForm := tview.NewForm()
	mainForm.SetTitle(mainFormTitle)
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(common.TCellColorBorderActive)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(common.TCellColorFormBg)
  mainForm.SetFieldTextColor(tcell.ColorWhite)
  mainForm.SetLabelColor(common.TCellColorBlue)
  

  // ============================
  // FORM: Stock Type
  // ============================
	mainForm.AddDropDown("Type", []string{"mutual fund", "gold", "others"}, 0, func(option string, optionIndex int) {
		stockType = option
		if option == "mutual fund" {
			formItem := mainForm.GetFormItemByLabel("Stock Code")
			if formItem != nil {
				formItem.(*tview.InputField).SetDisabled(false)
			}
		} else {
			mainForm.GetFormItemByLabel("Stock Code").(*tview.InputField).SetDisabled(true)
		}
	})
	mainForm.GetFormItemByLabel("Type").(*tview.DropDown).SetListStyles(
		tcell.StyleDefault.Background(common.TCellColorFormBg),
		tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight),
	).SetFieldBackgroundColor(tcell.ColorDefault)

  // ============================
  // FORM: Stock Name
  // ============================
	mainForm.AddInputField("Stock Name", "", 60, nil, nil)
	fieldStockName := mainForm.GetFormItemByLabel("Stock Name").(*tview.InputField)

  // ============================
  // FORM: Stock Plan
  // ============================
	mainForm.AddInputField("Stock Plan", "", 20, nil, nil)
	fieldStockPlan := mainForm.GetFormItemByLabel("Stock Plan").(*tview.InputField)

  // ============================
  // FORM: Stock Code
  // ============================
	mainForm.AddInputField("Stock Code", "", 20, nil, nil)
	fieldStockCode := mainForm.GetFormItemByLabel("Stock Code").(*tview.InputField)

  // ============================
  // FORM: Footer
  // ============================
	mainForm.AddTextView("  ", "", 30, 1, true, false)
	errorField := mainForm.GetFormItemByLabel("  ").(*tview.TextView)
	errorField.SetDynamicColors(true)

  // ============================
  // FORM: Buttons
  // ============================
	mainForm.AddButton("Submit", func() {
		stockName = strings.TrimSpace(fieldStockName.GetText())
		stockCode = strings.TrimSpace(fieldStockCode.GetText())
		stockPlan = strings.TrimSpace(fieldStockPlan.GetText())
		if stockName == "" || (stockType == "mutual fund" && stockCode == "") {
			showError(errorField, "insufficient data")
			return
		} else {
			stock := ledger.Stock{
				Name: stockName,
				Type: stockType,
				Code: stockCode,
				Plan: stockPlan,
			}
			if err := ledger.AddStock(workingLedger.Name, stock); err != nil {
				pages.RemovePage(pageName)
				app.SetFocus(stocksTable)
				inputFieldFocused = false
				showModal(stocksTable, err.Error())
				return
			} else {
				pages.RemovePage(workingLedger.Name + page4)
				setupStocksPage(workingLedger)
			}
		}
		pages.RemovePage(pageName)
		app.SetFocus(stocksTable)
		inputFieldFocused = false
	})

	mainForm.AddButton("Cancel", func() {
		pages.RemovePage(pageName)
		app.SetFocus(stocksTable)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(common.TCellColorFormBg)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))

  // ============================
  // FORM: Input Capture
  // ============================
	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage(pageName)
			app.SetFocus(stocksTable)
			inputFieldFocused = false
		}
		return event
	})

	mainForm.SetFocus(1)

  // ============================
  // FORM: Grid
  // ============================
	grid := tview.NewGrid().
		SetRows(0, 15, 0).
		SetColumns(0, 75, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage(pageName, grid, true, true)
}
