package tui

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// showTransferFundsCrossForm collects details using a form about a transfer transaction across ledger
// and adds it to the database
func showTransferFundsCrossForm(config TransferFundsConfig) {

	inputFieldFocused = true

	var (
		fromAccountID   = 0
		fromAccountName string
		toLedger        string
		toAccountID     = 0
		toAccountName   string
		fromAmount      = 0.0
		toAmount        = 0.0
		fees            = 0.0
		isSplit         = 0
		feeCategoryID   = 0

		fromAccounts, _       = ledger.FetchAccounts(config.WorkingLedger.Name, "", false)
		fromAccountsFormatted = ledger.FormatAccounts(fromAccounts, "")
		toAccounts            []*ledger.Account
		toAccountsFormatted   []string
		categories, _         = ledger.FetchCategories(config.WorkingLedger.Name, "expense", false)
		categoriesFormatted   = ledger.FormatCategories(categories, "")
		errorField            *tview.TextView
	)

	// form
	mainForm := tview.NewForm()

	// date
	mainForm.AddInputField("Date", time.Now().Format("2006-01-02"), 11, nil, nil)

	// from account
	mainForm.AddInputField("From Account", "", 20, nil, func(text string) {
		fromAccountName = strings.TrimSpace(text)
		fromAccountID = ledger.GetAccountID(fromAccountName, fromAccounts)
	})
	fieldFromAccount := mainForm.GetFormItemByLabel("From Account").(*tview.InputField)
	fieldFromAccount.SetAutocompleteStyles(tcell.Color236, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
	fieldFromAccount.SetAutocompleteFunc(func(currentText string) (entries []string) {
		if len(currentText) == 0 {
			return
		}
		for _, item := range fromAccountsFormatted {
			if strings.Contains(strings.ToLower(strings.TrimSpace(item)), strings.ToLower(currentText)) {
				entries = append(entries, strings.TrimSpace(item))
			}
		}
		if len(entries) == 0 {
			entries = nil
		}
		return
	})
	fieldFromAccount.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldFromAccount.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

	// To ledger
	ledgersList, _ := ledger.GetLedgersList()
	indexToRemove := -1
	for i, ledger := range ledgersList {
		if ledger == config.WorkingLedger.Name {
			indexToRemove = i
			break
		}
	}
	sortedLedgersList := append(ledgersList[:indexToRemove], ledgersList[indexToRemove+1:]...)

	mainForm.AddDropDown("To Ledger", sortedLedgersList, 0, func(option string, _ int) {
		toLedger = option
		toAccounts, _ = ledger.FetchAccounts(option, "", false)
		toAccountsFormatted = ledger.FormatAccounts(toAccounts, "")
	})

	// to account
	mainForm.AddInputField("To Account", "", 20, nil, func(text string) {
		toAccountName = strings.TrimSpace(text)
		toAccountID = ledger.GetAccountID(toAccountName, toAccounts)
	})
	fieldToAccount := mainForm.GetFormItemByLabel("To Account").(*tview.InputField)
	fieldToAccount.SetAutocompleteStyles(tcell.Color236, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
	fieldToAccount.SetAutocompleteFunc(func(currentText string) (entries []string) {
		if len(currentText) == 0 {
			return
		}
		for _, item := range toAccountsFormatted {
			if strings.Contains(strings.ToLower(strings.TrimSpace(item)), strings.ToLower(currentText)) {
				entries = append(entries, strings.TrimSpace(item))
			}
		}
		if len(entries) == 0 {
			entries = nil
		}
		return
	})
	fieldToAccount.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldToAccount.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

	// from amount
	mainForm.AddInputField(fmt.Sprintf("Amount (%v)", config.WorkingLedger.Currency), "", 11, nil, func(text string) {
		fromAmount = common.ProcessExpression(text)
	})

	// fees
	mainForm.AddInputField(fmt.Sprintf("Fees (%v)", config.WorkingLedger.Currency), "", 11, nil, func(text string) {
		fees = common.ProcessExpression(text)
		if fees > 0 {
			isSplit = 1
		}
	})

	// fees category
	mainForm.AddInputField("Fee Category", "", 20, nil, func(text string) {
		feeCategoryID = ledger.GetCategoryID(text, categories)
	})
	fieldFeeCategory := mainForm.GetFormItemByLabel("Fee Category").(*tview.InputField)
	fieldFeeCategory.SetAutocompleteStyles(tcell.Color236, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
	fieldFeeCategory.SetAutocompleteFunc(func(currentText string) (entries []string) {
		if len(currentText) == 0 {
			return
		}
		for _, item := range categoriesFormatted {
			if strings.Contains(strings.ToLower(strings.TrimSpace(item)), strings.ToLower(currentText)) {
				entries = append(entries, strings.TrimSpace(item))
			}
		}
		if len(entries) == 0 {
			entries = nil
		}
		return
	})
	fieldFeeCategory.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldFeeCategory.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

	// to amount
	mainForm.AddInputField(fmt.Sprintf("Amount (%v)", ledger.GetCurrencyForLedger(toLedger)), "", 11, nil, func(text string) {
		toAmount = common.ProcessExpression(text)
	})

	// notes
	mainForm.AddInputField("Notes", "", 50, nil, nil)

	// status text
	mainForm.AddTextView("  ", "", 30, 1, true, false)
	errorField = mainForm.GetFormItemByLabel("  ").(*tview.TextView)
	errorField.SetDynamicColors(true)

	mainForm.AddButton("Submit", func() {

		notesText := mainForm.GetFormItemByLabel("Notes").(*tview.InputField).GetText()
		if len(notesText) > 0 {
			notesText = fmt.Sprintf("[ %s ]", notesText)
		}
		notesPrefix := "<trans>"
		toNotes := fmt.Sprintf("%s %s (%s) -> %s (%s) %s", notesPrefix, fromAccountName, config.WorkingLedger.Name, toAccountName, toLedger, notesText)
		if isSplit == 1 {
			notesPrefix += "<split>"
		}
		fromNotes := fmt.Sprintf("%s %s (%s) -> %s (%s) %s", notesPrefix, fromAccountName, config.WorkingLedger.Name, toAccountName, toLedger, notesText)

		dateText := mainForm.GetFormItemByLabel("Date").(*tview.InputField).GetText()
		transDate, err := time.Parse("2006-01-02", dateText)
		if err != nil {
			showError(errorField, "invalid date")
			return
		}

		if fromAccountID == 0 || toAccountID == 0 {
			showError(errorField, "invalid accounts")
			return
		}

		if fromAmount <= 0.0 || toAmount <= 0.0 || fees < 0 {
			showError(errorField, "invalid amount")
			return
		}

		if isSplit == 1 && feeCategoryID == 0 {
			showError(errorField, "invalid fee category")
			return
		}

		fromTransaction := ledger.Transaction{
			Date:      transDate,
			Notes:     fromNotes,
			Credit:    0.0,
			Debit:     fromAmount + fees,
			AccountID: fromAccountID,
			IsSplit:   isSplit,
		}

		if isSplit == 1 {
			splitTransaction := ledger.SplitTransaction{
				Date:       transDate,
				Notes:      "fund transfer charge",
				Credit:     0.0,
				Debit:      fees,
				AccountID:  fromAccountID,
				CategoryID: feeCategoryID,
			}
			fromTransaction.Splits = []ledger.SplitTransaction{splitTransaction}
		}

		toTransaction := ledger.Transaction{
			Date:      transDate,
			Notes:     toNotes,
			Credit:    toAmount,
			Debit:     0.0,
			AccountID: toAccountID,
			IsSplit:   0,
		}

		transactions := []ledger.Transaction{fromTransaction, toTransaction}

		if err := ledger.TransferFunds(config.WorkingLedger.Name, toLedger, transactions); err != nil {
			app.Stop()
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
			os.Exit(1)
		}

		var tableTransactions []ledger.Transaction
		switch {
		case len(config.AccountNodeName) > 0:
			tableTransactions, _ = ledger.GetTransactionsForAccount(config.WorkingLedger.Name, config.AccountNodeName, 50)
		case len(config.CategoryNodeName) > 0:
			tableTransactions, _ = ledger.GetTransactionsForCategory(config.WorkingLedger.Name, config.CategoryNodeName, 50)
		}
		populateTransactionsTable(config.SourceTable, tableTransactions, config.WorkingLedger.Currency)

		pages.RemovePage("transferFundsCrossForm")
		app.SetFocus(config.SourceTable)
		inputFieldFocused = false
	})
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage("transferFundsCrossForm")
		app.SetFocus(config.SourceTable)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(tcell.Color238)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	mainForm.SetTitle("[ Funds Transfer - Cross Ledger ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)
	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("transferFundsCrossForm")
			app.SetFocus(config.SourceTable)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 25, 0).
		SetColumns(0, 55, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("transferFundsCrossForm", grid, true, true)
}
