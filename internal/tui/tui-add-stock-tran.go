package tui

import (
	"strings"
	"time"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

func showAddStockTransactionForm(workingLedger ledger.Ledger, stockName string, stockID int, transactionType string) {

	inputFieldFocused = true

	var (
		mainFormTitle string
		amountLabel   string
		unitsLabel    string
		accountLabel  string

		amount        = 0.0
		units         = 0.0
		bankAccountID = 0

		accounts, _       = ledger.FetchAccounts(workingLedger.Name, "", false)
		accountsFormatted = ledger.FormatAccounts(accounts, "")
		pageName          = "AddStockTransactionForm"
		errorField        *tview.TextView
	)

	switch transactionType {
	case "purchase":
		mainFormTitle = "[ Purchase Stock Units ]"
		amountLabel = "Purchase amount"
		unitsLabel = "Units to purchase"
		accountLabel = "Purchase from"
	case "redeem":
		mainFormTitle = "[ Redeem Stock Units ]"
		amountLabel = "Redeem amount"
		unitsLabel = "Units to redeem"
		accountLabel = "Redeem to"
	}

  // #########################################################
	// ######################### FORM ##########################
  // #########################################################
	mainForm := tview.NewForm()
	mainForm.SetTitle(mainFormTitle)
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(common.TCellColorBorderActive)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(common.TCellColorFormBg)
  mainForm.SetLabelColor(common.TCellColorBlue)

  // ============================
  // FORM: Stock Name
  // ============================
	mainForm.AddTextView("Stock", stockName, 0, 1, true, false)

  // ============================
  // FORM: Date
  // ============================
	mainForm.AddInputField("Date", time.Now().Format("2006-01-02"), 11, nil, nil)

  // ============================
  // FORM: Units
  // ============================
	mainForm.AddInputField(unitsLabel, "", 11, nil, func(text string) {
		units = common.ProcessExpression(text)
	})

  // ============================
  // FORM: Purchase Amount
  // ============================
	mainForm.AddInputField(amountLabel, "", 11, nil, func(text string) {
		amount = common.ProcessExpression(text)
	})

  // ============================
  // FORM: Purchase Account
  // ============================
	mainForm.AddInputField(accountLabel, "", 30, nil, func(text string) {
		if text == "null" {
			bankAccountID = -1
		} else {
			bankAccountID = ledger.GetAccountID(text, accounts)
		}
	})
	fieldAccount := mainForm.GetFormItemByLabel(accountLabel).(*tview.InputField)
	fieldAccount.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault.Foreground(common.TCellColorDefaultText).Background(common.TCellColorFormBg), tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
	fieldAccount.SetAutocompleteFunc(func(currentText string) (entries []string) {
		if len(currentText) == 0 {
			return
		}
		for _, item := range accountsFormatted {
			if strings.Contains(strings.ToLower(strings.TrimSpace(item)), strings.ToLower(currentText)) {
				entries = append(entries, strings.TrimSpace(item))
			}
		}
		if len(entries) == 0 {
			entries = nil
		}
		return
	})
	fieldAccount.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldAccount.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
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
		case units <= 0.0:
			showError(errorField, "invalid units")
			return
		case bankAccountID == 0:
			showError(errorField, "invalid bank account")
			return
		}

		nav := float64(int((amount/units)*10000)) / 10000.0
		navRounded := common.PrecisionRoundAFloat(nav, 4)

		stockTransaction := ledger.StockTransaction{
			TransactionType: transactionType,
			StockID:         stockID,
			StockName:       stockName,
			Date:            transDate,
			Units:           units,
			Nav:             navRounded,
			Amount:          amount,
			BankAccountID:   bankAccountID,
		}

		if err := ledger.ActionStockUnits(workingLedger.Name, stockTransaction); err != nil {
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
		SetRows(0, 17, 0).
		SetColumns(0, 70, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage(pageName, grid, true, true)
}
