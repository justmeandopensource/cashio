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

// An AddTransactionConfig holds helper data for the add transaction process
type AddTransactionConfig struct {
	WorkingLedger    ledger.Ledger
	SourceTable      *tview.Table
	AccountNodeName  string
	CategoryNodeName string
}

// showAddTransactionForm collects transaction details using forms and adds it to the database
func showAddTransactionForm(config AddTransactionConfig) {

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
		accounts, _         = ledger.FetchAccounts(config.WorkingLedger.Name, "", false)
		accountsFormatted   = ledger.FormatAccounts(accounts, "")
		categories, _       = ledger.FetchCategories(config.WorkingLedger.Name, "expense", false)
		categoriesFormatted = ledger.FormatCategories(categories, "")
	)

	var displaySplitForm func()

	displaySplitForm = func() {
		if baseAmount <= 0 {
			return
		}
		splitCounter += 1
		childForm := tview.NewForm()
		childForm.SetTitle(fmt.Sprintf("[ Split %d ]", splitCounter))
		childForm.SetBorder(true)
		childForm.SetBorderColor(tview.Styles.SecondaryTextColor)
		childForm.AddTextView("Balance", fmt.Sprintf("%v", baseAmount), 15, 1, true, true)
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
				childForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("Amount field is mandatory")
				go time.AfterFunc(3*time.Second, func() {
					childForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("")
				})
				return
			}
			if fieldCategory.GetText() == "" {
				childForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("Category field is mandatory")
				go time.AfterFunc(3*time.Second, func() {
					childForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("")
				})
				return
			}
			amount := common.ProcessExpression(amountText)
			baseAmount -= amount
			if baseAmount < 0 {
				baseAmount += amount
				fieldAmount.SetText("")
				childForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("Split amount over the limit")
				go time.AfterFunc(3*time.Second, func() {
					childForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("")
				})
				return
			}
			credit, debit := 0.0, 0.0
			switch transType {
			case "income":
				credit = amount
			case "expense":
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
		})
		childForm.AddButton("Cancel", func() {
			splitTransactions = splitTransactions[:0]
			baseAmount = transAmount
			pages.RemovePage(fmt.Sprintf("split%d", splitCounter))
			splitCounter = 0
		})
		childForm.SetButtonsAlign(tview.AlignCenter)
		childForm.SetButtonBackgroundColor(tcell.Color238)
		childForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

		// child form footer
		childForm.AddTextView("  ", "", 50, 1, true, false)

		childForm.SetBackgroundColor(tcell.ColorDefault)
		childForm.SetFieldBackgroundColor(tcell.Color238)

		childForm.SetFocus(1)

		childForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
			if event.Key() == tcell.KeyEsc {
				splitTransactions = splitTransactions[:0]
				baseAmount = transAmount
				pages.RemovePage(fmt.Sprintf("split%d", splitCounter))
				splitCounter = 0
			}
			return event
		})

		childGrid := tview.NewGrid().
			SetRows(0, 21, 0).
			SetColumns(0, 55, 0).
			AddItem(childForm, 1, 1, 1, 1, 0, 0, true)

		pages.AddPage(fmt.Sprintf("split%d", splitCounter), childGrid, true, true)
	}

	// Main mainForm
	mainForm := tview.NewForm()

	// Transaction Type field
	mainForm.AddDropDown("Type", []string{"income", "expense"}, 1, func(option string, _ int) {
		transType = option
		categories, _ = ledger.FetchCategories(config.WorkingLedger.Name, transType, false)
		categoriesFormatted = ledger.FormatCategories(categories, "")
	})
	fieldTransType := mainForm.GetFormItemByLabel("Type").(*tview.DropDown)
	fieldTransType.SetListStyles(
		tcell.StyleDefault.Background(tcell.Color236),
		tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor),
	)
	fieldTransType.SetFieldBackgroundColor(tcell.ColorDefault)

	// Date field
	mainForm.AddInputField("Date", time.Now().Format("2006-01-02"), 11, nil, func(text string) {
		if strings.TrimSpace(text) != "" {
			transDate, _ = time.Parse("2006-01-02", text)
		}
	})
	fieldDate := mainForm.GetFormItemByLabel("Date").(*tview.InputField)

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
	mainForm.AddInputField("Amount", "", 11, nil, func(text string) {
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
		missingFields := false
		date := strings.TrimSpace(fieldDate.GetText())
		accountName := strings.TrimSpace(fieldAccount.GetText())
		categoryID := 0
		notes := strings.TrimSpace(fieldNotes.GetText())
		credit, debit := 0.0, 0.0
		switch transType {
		case "income":
			credit = transAmount
		case "expense":
			debit = transAmount
		}

		if date == "" || accountName == "" || transAccountID == 0 || notes == "" || transAmount == 0.0 {
			missingFields = true
		}

		if len(splitTransactions) > 0 {
			notes = "<split> " + notes
		} else {
			categoryName := fieldCategory.GetText()
			categoryID = ledger.GetCategoryID(categoryName, categories)
			if categoryID == 0 {
				missingFields = true
			}
		}

		if isSplit == 1 && len(splitTransactions) == 0 {
			missingFields = true
		}

		if missingFields {
			mainForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("Invalid transaction")
			go time.AfterFunc(3*time.Second, func() {
				mainForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("")
			})
			return
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

		if err := ledger.AddTransaction(config.WorkingLedger.Name, transaction); err != nil {
			app.Stop()
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
			os.Exit(1)
		}

		var transactions []ledger.Transaction
		switch {
		case len(config.AccountNodeName) > 0:
			transactions, _ = ledger.GetTransactionsForAccount(config.WorkingLedger.Name, config.AccountNodeName, 50)
		case len(config.CategoryNodeName) > 0:
			transactions, _ = ledger.GetTransactionsForCategory(config.WorkingLedger.Name, config.CategoryNodeName, 50)
		}
		populateTransactionsTable(config.SourceTable, transactions, config.WorkingLedger.Currency)

		pages.RemovePage("addTransactionForm")
		app.SetFocus(config.SourceTable)
		inputFieldFocused = false
	})
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage("addTransactionForm")
		app.SetFocus(config.SourceTable)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(tcell.Color238)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	mainForm.AddTextView("  ", "", 50, 1, true, false)

	mainForm.SetTitle("[ Add a new transaction ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)

	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("addTransactionForm")
			app.SetFocus(config.SourceTable)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 21, 0).
		SetColumns(0, 55, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("addTransactionForm", grid, true, true)
}
