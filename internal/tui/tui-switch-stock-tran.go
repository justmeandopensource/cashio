package tui

import (
	"fmt"
	"strings"
	"time"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

func showSwitchStockTransactionForm(workingLedger ledger.Ledger) {

	inputFieldFocused = true

	var (
		fromStockID    = 0
		fromStockName  string
		fromUnits      = 0.0
		toStockID      = 0
		toStockName    string
		toUnits        = 0.0
		amount         = 0.0
		stocks, _      = ledger.FetchStocks(workingLedger.Name, "all")
		stockNamesList = ledger.GetStockNamesList(stocks)
		mainFormTitle  = "[ Switch Stock Units ]"
		pageName       = "switchStockTransactionForm"
		errorField     *tview.TextView
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
  // FORM: Date
  // ============================
	mainForm.AddInputField("Date", time.Now().Format("2006-01-02"), 11, nil, nil)

  // ============================
  // FORM: From Stock
  // ============================
	mainForm.AddInputField("From Stock", "", 50, nil, func(text string) {
		fromStockName = strings.TrimSpace(text)
		fromStockID = ledger.GetStockID(fromStockName, stocks)
	})
	fieldFromStock := mainForm.GetFormItemByLabel("From Stock").(*tview.InputField)
	fieldFromStock.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault.Foreground(common.TCellColorDefaultText).Background(common.TCellColorFormBg), tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
	fieldFromStock.SetAutocompleteFunc(func(currentText string) (entries []string) {
		if len(currentText) == 0 {
			return
		}
		for _, item := range stockNamesList {
			if strings.Contains(strings.ToLower(strings.TrimSpace(item)), strings.ToLower(currentText)) {
				entries = append(entries, strings.TrimSpace(item))
			}
		}
		if len(entries) == 0 {
			entries = nil
		}
		return
	})
	fieldFromStock.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldFromStock.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

  // ============================
  // FORM: From Units
  // ============================
	mainForm.AddInputField("From Units", "", 11, nil, func(text string) {
		fromUnits = common.ProcessExpression(text)
	})

  // ============================
  // FORM: To Stock
  // ============================
	mainForm.AddInputField("To Stock", "", 50, nil, func(text string) {
		toStockName = strings.TrimSpace(text)
		toStockID = ledger.GetStockID(toStockName, stocks)
	})
	fieldToStock := mainForm.GetFormItemByLabel("To Stock").(*tview.InputField)
	fieldToStock.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault.Foreground(common.TCellColorDefaultText).Background(common.TCellColorFormBg), tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
	fieldToStock.SetAutocompleteFunc(func(currentText string) (entries []string) {
		if len(currentText) == 0 {
			return
		}
		for _, item := range stockNamesList {
			if strings.Contains(strings.ToLower(strings.TrimSpace(item)), strings.ToLower(currentText)) {
				entries = append(entries, strings.TrimSpace(item))
			}
		}
		if len(entries) == 0 {
			entries = nil
		}
		return
	})
	fieldToStock.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldToStock.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

  // ============================
  // FORM: To Units
  // ============================
	mainForm.AddInputField("To Units", "", 11, nil, func(text string) {
		toUnits = common.ProcessExpression(text)
	})

  // ============================
  // FORM: Amount
  // ============================
	mainForm.AddInputField(fmt.Sprintf("Amount (%v)", workingLedger.Currency), "", 11, nil, func(text string) {
		amount = common.ProcessExpression(text)
	})

  // ============================
  // FORM: Footer
  // ============================
	mainForm.AddTextView("  ", "", 30, 1, true, false)
	errorField = mainForm.GetFormItemByLabel("  ").(*tview.TextView)
	errorField.SetDynamicColors(true)

  // ============================
  // FORM: Buttons
  // ============================
	mainForm.AddButton("Submit", func() {

		dateText := mainForm.GetFormItemByLabel("Date").(*tview.InputField).GetText()
		transDate, err := time.Parse("2006-01-02", dateText)
		if err != nil {
			showError(errorField, "invalid date")
			return
		}

		switch {
		case amount <= 0.0:
			showError(errorField, "invalid amount")
			return
		case fromUnits <= 0.0, toUnits <= 0.0:
			showError(errorField, "invalid units")
			return
		case fromStockID == 0, toStockID == 0:
			showError(errorField, "invalid stock")
			return
		case fromStockName == toStockName:
			showError(errorField, "invalid stock")
			return
		}

		fromNav := float64(int((amount/fromUnits)*10000)) / 10000.0
		fromNavRounded := common.PrecisionRoundAFloat(fromNav, 4)
		toNav := float64(int((amount/toUnits)*10000)) / 10000.0
		toNavRounded := common.PrecisionRoundAFloat(toNav, 4)

		fromStockTransaction := ledger.StockTransaction{
			TransactionType: "switch to " + toStockName,
			StockID:         fromStockID,
			StockName:       fromStockName,
			Date:            transDate,
			Units:           fromUnits,
			Nav:             fromNavRounded,
			Amount:          amount,
		}

		toStockTransaction := ledger.StockTransaction{
			TransactionType: "switch from " + fromStockName,
			StockID:         toStockID,
			StockName:       toStockName,
			Date:            transDate,
			Units:           toUnits,
			Nav:             toNavRounded,
			Amount:          amount,
		}

		if err := ledger.ActionStockUnits(workingLedger.Name, fromStockTransaction); err != nil {
			showModal(stocksTable, err.Error())
			return
		}

		if err := ledger.ActionStockUnits(workingLedger.Name, toStockTransaction); err != nil {
			showModal(stocksTable, err.Error())
			return
		}

		stocks, _ := ledger.FetchStocks(workingLedger.Name, "all")
		populateStocksTable(stocks, workingLedger.Currency)

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
		SetRows(0, 19, 0).
		SetColumns(0, 70, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage(pageName, grid, true, true)
}
