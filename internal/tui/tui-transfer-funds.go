package tui

import (
	"strings"
	"time"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

type TransferFundsConfig struct {
	WorkingLedger    ledger.Ledger
	SourceTable      *tview.Table
	AccountNodeName  string
	CategoryNodeName string
}

// showTransferFundsForm collects transaction details for funds transfer using forms and adds it to the database
func showTransferFundsForm(config TransferFundsConfig) {

	inputFieldFocused = true

	var (
		accounts, _         = ledger.FetchAccounts(config.WorkingLedger.Name, "", false)
		accountsFormatted   = ledger.FormatAccounts(accounts, "")
		toAccounts          []*ledger.Account
		toAccountsFormatted []string
	)

	// Main mainForm
	mainForm := tview.NewForm()

	// Date field
	mainForm.AddInputField("Date", time.Now().Format("2006-01-02"), 11, nil, func(text string) {
		if strings.TrimSpace(text) != "" {
		}
	})

	// From Account field
	mainForm.AddInputField("From Account", "", 20, nil, nil)
	fieldFromAccount := mainForm.GetFormItemByLabel("From Account").(*tview.InputField)
	fieldFromAccount.SetAutocompleteStyles(tcell.Color236, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
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

	var (
		fieldToLedger  *tview.DropDown
		fieldToAccount *tview.InputField
		// fieldCharge    *tview.InputField
	)

	// Cross ledger? field
	mainForm.AddCheckbox("Cross Ledger?", false, func(checked bool) {
		if checked {
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
			if len(sortedLedgersList) == 0 {
				// display error in status text
			}
			fieldToLedger = tview.NewDropDown().SetLabel("To Ledger")
			fieldToLedger.SetOptions(sortedLedgersList, func(text string, _ int) {
				toAccounts, _ = ledger.FetchAccounts(text, "", false)
				toAccountsFormatted = ledger.FormatAccounts(toAccounts, "")
			})
			mainForm.AddFormItem(fieldToLedger)

			// To account
			fieldToAccount = tview.NewInputField().SetLabel("To Account").SetFieldWidth(20)
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
			mainForm.AddFormItem(fieldToAccount)
		} else {
			mainForm.RemoveFormItem(mainForm.GetFormItemIndex("To Ledger"))
			mainForm.RemoveFormItem(mainForm.GetFormItemIndex("To Account"))
		}
	})

	// Amount field
	mainForm.AddInputField("Amount", "", 11, nil, nil)

	// Notes field
	mainForm.AddInputField("Notes", "", 50, nil, nil)

	// Form buttons
	mainForm.AddButton("Submit", nil)
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage("transferFundsForm")
		app.SetFocus(config.SourceTable)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(tcell.Color238)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	mainForm.AddTextView("  ", "", 50, 1, true, false)

	mainForm.SetTitle("[ Transfer Funds ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)

	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("transferFundsForm")
			app.SetFocus(config.SourceTable)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 21, 0).
		SetColumns(0, 55, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("transferFundsForm", grid, true, true)
}
