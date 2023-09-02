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

func showAddTransactionForm(ledgerName string) {

	inputFieldFocused = true

	var (
		baseAmount          = 0.0
		transAmount         = 0.0
		transDate           = time.Now()
		transType           = "Expense"
		transAccountID      = 0
		isSplit             = 0
		splitCounter        = 0
		splitTransactions   = []ledger.SplitTransaction{}
		accounts, _         = ledger.FetchAccounts(ledgerName, "", false)
		accountsFormatted   = ledger.FormatAccounts(accounts, "")
		categories, _       = ledger.FetchCategories(ledgerName, "", false)
		categoriesFormatted = ledger.FormatCategories(categories, "")
	)

	var displaySplitForm func()

	displaySplitForm = func() {
		if baseAmount <= 0 {
			return
		}
		splitCounter += 1
		var childForm *tview.Form
		childForm = tview.NewForm()
		childForm.SetTitle(fmt.Sprintf("[ Split %d ]", splitCounter))
		childForm.SetBorder(true)
		childForm.SetBorderColor(tview.Styles.SecondaryTextColor)
		childForm.AddTextView("Balance", fmt.Sprintf("%v", baseAmount), 5, 1, true, false)
		childForm.AddInputField("Amount", "", 12, nil, nil)
		fieldAmount := childForm.GetFormItemByLabel("Amount").(*tview.InputField)
		childForm.AddInputField("Notes", "", 50, nil, nil)
		fieldNotes := childForm.GetFormItemByLabel("Notes").(*tview.InputField)

		// child category field
		childForm.AddInputField("Category", "", 20, nil, nil)
		fieldCategory := childForm.GetFormItemByLabel("Category").(*tview.InputField)
		fieldCategory.SetAutocompleteStyles(tcell.Color236, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
		fieldCategory.SetAutocompleteFunc(func(currentText string) (entries []string) {
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
		fieldCategory.SetAutocompletedFunc(func(text string, _, source int) bool {
			if source != tview.AutocompletedNavigate {
				fieldCategory.SetText(text)
			}
			return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
		})

		// child form buttons
		childForm.AddButton("Next", func() {
			amountText := childForm.GetFormItemByLabel("Amount").(*tview.InputField).GetText()
			amountText = strings.TrimSpace(amountText)
			if amountText == "" {
				childForm.SetFocus(1)
			} else {
				amount := common.ProcessExpression(amountText)
				baseAmount -= amount
				if baseAmount < 0 {
					baseAmount += amount
					fieldAmount.SetText("")
					return
				}
				credit, debit := 0.00, 0.00
				switch transType {
				case "Income":
					credit = amount
				case "Expense":
					debit = amount
				}
				splitTransaction := ledger.SplitTransaction{
					Date:       transDate,
					Notes:      fieldNotes.GetText(),
					Credit:     credit,
					Debit:      debit,
					AccountID:  transAccountID,
					CategoryID: ledger.GetCategoryID(fieldCategory.GetText(), categories),
				}
				splitTransactions = append(splitTransactions, splitTransaction)
				pages.RemovePage(fmt.Sprintf("split%d", splitCounter))
				displaySplitForm()
			}
		})
		childForm.AddButton("Cancel", func() {
			pages.RemovePage(fmt.Sprintf("split%d", splitCounter))
		})
		childForm.SetButtonsAlign(tview.AlignCenter)
		childForm.SetButtonBackgroundColor(tcell.Color238)
		childForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

		childForm.SetBackgroundColor(tcell.ColorDefault)
		childForm.SetFieldBackgroundColor(tcell.Color238)

		childGrid := tview.NewGrid().
			SetRows(0, 19, 0).
			SetColumns(0, 55, 0).
			AddItem(childForm, 1, 1, 1, 1, 0, 0, true)

		pages.AddPage(fmt.Sprintf("split%d", splitCounter), childGrid, true, true)
	}

	// Main mainForm
	mainForm := tview.NewForm()

	// Transaction Type field
	mainForm.AddDropDown("Type", []string{"Income", "Expense"}, 1, func(option string, _ int) {
		transType = option
	})
	fieldTransType := mainForm.GetFormItemByLabel("Type").(*tview.DropDown)
	fieldTransType.SetListStyles(
		tcell.StyleDefault.Background(tcell.Color236),
		tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor),
	)
	fieldTransType.SetFieldBackgroundColor(tcell.ColorDefault)

	// Date field
	mainForm.AddInputField("Date", time.Now().Format("2006-01-02"), 12, nil, func(text string) {
		transDate, _ = time.Parse("2006-01-02", text)
	})

	// Account field
	mainForm.AddInputField("Account", "", 20, nil, func(text string) {
		transAccountID = ledger.GetAccountID(text, accounts)
	})
	fieldAccount := mainForm.GetFormItemByLabel("Account").(*tview.InputField)
	fieldAccount.SetAutocompleteStyles(tcell.Color236, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
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

	// Amount field
	mainForm.AddInputField("Amount", "", 12, nil, func(text string) {
		amount := common.ProcessExpression(text)
		baseAmount, transAmount = amount, amount
	})

	// Notes field
	mainForm.AddInputField("Notes", "", 50, nil, nil)
	fieldNotes := mainForm.GetFormItemByLabel("Notes").(*tview.InputField)

	// Split? field
	mainForm.AddCheckbox("Split?", false, func(checked bool) {
		if checked {
			isSplit = 1
			mainForm.GetFormItemByLabel("Category").(*tview.InputField).SetDisabled(true)
			displaySplitForm()
			mainForm.SetFocus(7)
		} else {
			isSplit = 0
			mainForm.GetFormItemByLabel("Category").(*tview.InputField).SetDisabled(false)
		}
	})

	// Category field
	mainForm.AddInputField("Category", "", 20, nil, nil)
	fieldCategory := mainForm.GetFormItemByLabel("Category").(*tview.InputField)
	fieldCategory.SetAutocompleteStyles(tcell.Color236, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
	fieldCategory.SetAutocompleteFunc(func(currentText string) (entries []string) {
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
	fieldCategory.SetAutocompletedFunc(func(text string, _, source int) bool {
		if source != tview.AutocompletedNavigate {
			fieldCategory.SetText(text)
		}
		return source == tview.AutocompletedEnter || source == tview.AutocompletedClick
	})

	// Form buttons
	mainForm.AddButton("Submit", func() {
		categoryName := fieldCategory.GetText()
		categoryID := ledger.GetCategoryID(categoryName, categories)
		notes := fieldNotes.GetText()
		credit, debit := 0.00, 0.00
		if len(splitTransactions) > 0 {
			notes = "<split> " + notes
		}
		switch transType {
		case "Income":
			credit = transAmount
		case "Expense":
			debit = transAmount
		}

		transaction := ledger.Transaction{
			Date:       transDate,
			Notes:      notes,
			Credit:     credit,
			Debit:      debit,
			AccountID:  transAccountID,
			CategoryID: categoryID,
			IsSplit:    isSplit,
			Splits:     splitTransactions,
		}

		if err := ledger.AddTransaction(ledgerName, transaction); err != nil {
			app.Stop()
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
			os.Exit(1)
		}
		pages.RemovePage("addTransactionForm")
		app.SetFocus(page2TransTable)
		inputFieldFocused = false
	})
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage("addTransactionForm")
		app.SetFocus(page2TransTable)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(tcell.Color238)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	mainForm.SetTitle("[ Add a new transaction ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)

	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("addTransactionForm")
			app.SetFocus(page2TransTable)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 19, 0).
		SetColumns(0, 55, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("addTransactionForm", grid, true, true)
}
