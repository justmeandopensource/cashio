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

// A TransferFundsConfig holds helper data for transfer funds process
type TransferFundsConfig struct {
	WorkingLedger    ledger.Ledger
	SourceTable      *tview.Table
	AccountNodeName  string
	CategoryNodeName string
}

// showTransferFundsLocalForm collects details using a form about a transfer transaction within the same ledger
// and adds it to the database
func showTransferFundsLocalForm(config TransferFundsConfig) {

	inputFieldFocused = true

	var (
		fromAccountID   = 0
		fromAccountName string
		toAccountID     = 0
		toAccountName   string
		amount          = 0.0

		accounts, _       = ledger.FetchAccounts(config.WorkingLedger.Name, "", false)
		accountsFormatted = ledger.FormatAccounts(accounts, "")
		mainFormTitle     = "[ Funds Transfer ]"
		pageName          = "transferFundsLocalForm"
		errorField        *tview.TextView
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
  mainForm.SetLabelColor(common.TCellColorBlue)

  // ============================
  // FORM: Cross Ledger
  // ============================
	mainForm.AddCheckbox("Cross Ledger?", false, func(checked bool) {
		if checked {
			pages.HidePage("transferFundsLocalForm")
			showTransferFundsCrossForm(config)
		}
	})

  // ============================
  // FORM: Date
  // ============================
	mainForm.AddInputField("Date", time.Now().Format("2006-01-02"), 11, nil, nil)

  // ============================
  // FORM: From Account
  // ============================
	mainForm.AddInputField("From Account", "", 20, nil, func(text string) {
		fromAccountName = strings.TrimSpace(text)
		fromAccountID = ledger.GetAccountID(fromAccountName, accounts)
	})
	fieldFromAccount := mainForm.GetFormItemByLabel("From Account").(*tview.InputField)
	fieldFromAccount.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault.Foreground(common.TCellColorDefaultText).Background(common.TCellColorFormBg), tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
	fieldFromAccount.SetAutocompleteFunc(func(currentText string) (entries []string) {
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
	fieldFromAccount.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldFromAccount.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

  // ============================
  // FORM: Amount
  // ============================
	mainForm.AddInputField(fmt.Sprintf("Amount (%v)", config.WorkingLedger.Currency), "", 11, nil, func(text string) {
		amount = common.ProcessExpression(text)
	})

  // ============================
  // FORM: To Account
  // ============================
	mainForm.AddInputField("To Account", "", 20, nil, func(text string) {
		toAccountName = strings.TrimSpace(text)
		toAccountID = ledger.GetAccountID(toAccountName, accounts)
	})
	fieldToAccount := mainForm.GetFormItemByLabel("To Account").(*tview.InputField)
	fieldToAccount.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault.Foreground(common.TCellColorDefaultText).Background(common.TCellColorFormBg), tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
	fieldToAccount.SetAutocompleteFunc(func(currentText string) (entries []string) {
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
	fieldToAccount.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldToAccount.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

  // ============================
  // FORM: Notes
  // ============================
	mainForm.AddInputField("Notes", "", 36, nil, nil)
	fieldNotes := mainForm.GetFormItemByLabel("Notes").(*tview.InputField)
  debouncer := common.NewDebouncer(300 * time.Millisecond)
  var lastSearchText string
  var selectedText string
	fieldNotes.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault.Foreground(common.TCellColorDefaultText).Background(common.TCellColorFormBg), tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))

  fieldNotes.SetChangedFunc(func(text string) {
    currentText := strings.TrimSpace(text)
    if currentText != selectedText {
      selectedText = ""
    }
    if selectedText == "" && len(currentText) >= 3 && currentText != lastSearchText {
      lastSearchText = currentText
      debouncer.Debounce(func() {
        go func() {
          notes, err := ledger.GetTransactionNotesForKeywords(config.WorkingLedger.Name, currentText, true)
          if err != nil {
            return
          }
          app.QueueUpdateDraw(func() {
            fieldNotes.SetAutocompleteFunc(func(currentText string) []string {
              return notes
            })
          })
        }()
      })
    }
  })

  fieldNotes.SetAutocompletedFunc(func(text string, _, source int) bool {
    if source != tview.AutocompletedNavigate {
      selectedText = text
      fieldNotes.SetText(text)
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

		notesText := mainForm.GetFormItemByLabel("Notes").(*tview.InputField).GetText()
		if len(notesText) > 0 {
			notesText = fmt.Sprintf("[ %s ]", notesText)
		}
		notes := fmt.Sprintf("<trans> %s -> %s %s", fromAccountName, toAccountName, notesText)

		dateText := mainForm.GetFormItemByLabel("Date").(*tview.InputField).GetText()
		transDate, err := time.Parse("2006-01-02", dateText)
		if err != nil {
			showError(errorField, "invalid date")
			return
		}

		if fromAccountID == toAccountID || fromAccountID == 0 || toAccountID == 0 {
			showError(errorField, "invalid accounts")
			return
		}

		if amount <= 0.0 {
			showError(errorField, "invalid amount")
			return
		}

		fromTransaction := ledger.Transaction{
			Date:      transDate,
			Notes:     notes,
			Credit:    0.0,
			Debit:     amount,
			AccountID: fromAccountID,
			IsSplit:   0,
		}

		toTransaction := ledger.Transaction{
			Date:      transDate,
			Notes:     notes,
			Credit:    amount,
			Debit:     0.0,
			AccountID: toAccountID,
			IsSplit:   0,
		}

		transactions := []ledger.Transaction{fromTransaction, toTransaction}

		if err := ledger.TransferFunds(config.WorkingLedger.Name, config.WorkingLedger.Name, transactions); err != nil {
			app.Stop()
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
			os.Exit(1)
		}

		var tableTransactions []ledger.Transaction
		switch {
		case len(config.AccountNodeName) > 0:
			tableTransactions, _ = ledger.GetTransactionsForAccount(config.WorkingLedger.Name, config.AccountNodeName, 100)
      switch config.AccountNodeName {
        case ".", "Assets", "Liabilities":
          break
        default:
          accounts, _ := ledger.FetchAccounts(config.WorkingLedger.Name, "", false)
          balance := ledger.GetAccountBalance(accounts, config.AccountNodeName)
          config.SourceTable.SetTitle(common.FormatAccountsTableTitle(config.AccountNodeName, config.WorkingLedger.Currency, balance))
      }
		case len(config.CategoryNodeName) > 0:
			tableTransactions, _ = ledger.GetTransactionsForCategory(config.WorkingLedger.Name, config.CategoryNodeName, 100)
		}
		populateTransactionsTable(config.SourceTable, tableTransactions, config.WorkingLedger.Currency)

		pages.RemovePage(pageName)
		app.SetFocus(config.SourceTable)
		inputFieldFocused = false
	})

	mainForm.AddButton("Cancel", func() {
		pages.RemovePage(pageName)
		app.SetFocus(config.SourceTable)
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
			app.SetFocus(config.SourceTable)
			inputFieldFocused = false
		}
		return event
	})

  // ============================
  // FORM: GRID
  // ============================
	grid := tview.NewGrid().
		SetRows(0, 19, 0).
		SetColumns(0, 55, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage(pageName, grid, true, true)
}
