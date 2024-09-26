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
	"github.com/shopspring/decimal"
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
		baseAmount          = decimal.NewFromInt(0)
		transAmount         = decimal.NewFromInt(0)
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
		if baseAmount.LessThanOrEqual(decimal.NewFromFloat(0)) {
			return
		}
		splitCounter += 1
		childForm := tview.NewForm()
		childForm.SetTitle(fmt.Sprintf("[ Split %d ]", splitCounter))
		childForm.SetBorder(true)
		childForm.SetBorderColor(common.TCellColorBorderActive)
		childForm.AddTextView("Balance", fmt.Sprintf("%v", baseAmount), 15, 1, true, true)
		childForm.AddInputField("Amount", "", 12, nil, nil)
		fieldAmount := childForm.GetFormItemByLabel("Amount").(*tview.InputField)
		childForm.AddInputField("Notes", "", 50, nil, nil)
		fieldNotes := childForm.GetFormItemByLabel("Notes").(*tview.InputField)

		// child category field
		childForm.AddInputField("Category", "", 20, nil, nil)
		fieldCategory := childForm.GetFormItemByLabel("Category").(*tview.InputField)
		fieldCategory.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
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
			amount := decimal.NewFromFloat(common.ProcessExpression(amountText))
			baseAmount = baseAmount.Sub(amount)
			if baseAmount.IsNegative() {
				baseAmount = baseAmount.Add(amount)
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
				credit, _ = amount.Float64()
			case "expense":
				debit, _ = amount.Float64()
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
		childForm.SetButtonBackgroundColor(common.TCellColorFormBg)
    childForm.SetButtonTextColor(tcell.ColorWhite)
		childForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))

		// child form footer
		childForm.AddTextView("  ", "", 50, 1, true, false)

		childForm.SetBackgroundColor(tcell.ColorDefault)
		childForm.SetFieldBackgroundColor(common.TCellColorFormBg)
    childForm.SetFieldTextColor(tcell.ColorWhite)
    childForm.SetLabelColor(common.TCellColorBlue)

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
		tcell.StyleDefault.Background(common.TCellColorFormBg),
		tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight),
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
	fieldAccount.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
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
		baseAmount = decimal.NewFromFloat(amount)
		transAmount = decimal.NewFromFloat(amount)
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
	fieldCategory.SetAutocompleteStyles(common.TCellColorFormBg, tcell.StyleDefault, tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))
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
			credit, _ = transAmount.Float64()
		case "expense":
			debit, _ = transAmount.Float64()
		}

		if date == "" || accountName == "" || transAccountID == 0 || notes == "" || transAmount.IsZero() {
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
			mainForm.GetFormItemByLabel("  ").(*tview.TextView).SetText("[red]Invalid transaction")
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
			transactions, _ = ledger.GetTransactionsForAccount(config.WorkingLedger.Name, config.AccountNodeName, 100)
      switch config.AccountNodeName {
        case ".", "Assets", "Liabilities":
          break
        default:
          accounts, _ := ledger.FetchAccounts(config.WorkingLedger.Name, "", false)
          balance := ledger.GetAccountBalance(accounts, config.AccountNodeName)
          config.SourceTable.SetTitle(common.FormatAccountsTableTitle(config.AccountNodeName, config.WorkingLedger.Currency, balance))
      }
		case len(config.CategoryNodeName) > 0:
			transactions, _ = ledger.GetTransactionsForCategory(config.WorkingLedger.Name, config.CategoryNodeName, 100)
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
	mainForm.SetButtonBackgroundColor(common.TCellColorFormBg)
  mainForm.SetButtonTextColor(tcell.ColorWhite)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))

	mainForm.AddTextView("  ", "", 50, 1, true, false)

	mainForm.SetTitle("[ Add a new transaction ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(common.TCellColorBorderActive)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(common.TCellColorFormBg)
  mainForm.SetFieldTextColor(tcell.ColorWhite)
  mainForm.SetLabelColor(common.TCellColorBlue)

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
