package tui

import (
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// showAddAccountForm collects new account details using form and adds it to the database
func showAddAccountForm(workingLedger ledger.Ledger, accountID int, accountType string) {

	inputFieldFocused = true

	var (
		placeholder    = 0
		openingBalance = 0.0
	)

	// form
	mainForm := tview.NewForm()

	// account name
	mainForm.AddInputField("Account Name", "", 20, nil, nil)
	accountField := mainForm.GetFormItemByLabel("Account Name").(*tview.InputField)

	// placeholder
	mainForm.AddCheckbox("Placeholder?", false, func(checked bool) {
		if checked {
			placeholder = 1
			mainForm.GetFormItemByLabel("Opening Balance").(*tview.InputField).SetDisabled(true)
		} else {
			mainForm.GetFormItemByLabel("Opening Balance").(*tview.InputField).SetDisabled(false)
		}
	})

	mainForm.AddInputField("Opening Balance", "", 11, nil, func(text string) {
		openingBalance = common.ProcessExpression(text)
	})

	// status text
	mainForm.AddTextView("  ", "", 30, 1, true, false)
	errorField := mainForm.GetFormItemByLabel("  ").(*tview.TextView)

	mainForm.AddButton("Submit", func() {
		accountName := strings.TrimSpace(accountField.GetText())
		if accountName == "" {
			showError(errorField, "invalid account name")
			return
		} else {
			account := ledger.Account{
				Name:        accountName,
				Type:        accountType,
				Placeholder: placeholder,
				ParentID:    accountID,
			}
			if placeholder == 0 {
				account.OpeningBalance = openingBalance
			}
			if err := ledger.AddAccount(workingLedger.Name, account); err != nil {
				pages.RemovePage("addAccountForm")
				app.SetFocus(page2AccTree)
				inputFieldFocused = false
				showModal(page2AccTree, err.Error())
				return
			} else {
				pages.RemovePage(workingLedger.Name + page2)
				setupTransByAccPage(workingLedger)
				newAccountNode := findNodeByText(page2AccTree.GetRoot(), accountName)
				expandParentNodes(page2AccTreeMap, newAccountNode)
				page2AccTree.SetCurrentNode(newAccountNode)
				page2TransTable.SetBorderColor(tcell.Color246)
			}
		}
		pages.RemovePage("addAccountForm")
		app.SetFocus(page2AccTree)
		inputFieldFocused = false
	})
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage("addAccountForm")
		app.SetFocus(page2AccTree)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(tcell.Color238)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	mainForm.SetTitle("[ Add Account ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)
	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("addAccountForm")
			app.SetFocus(page2AccTree)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 13, 0).
		SetColumns(0, 45, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("addAccountForm", grid, true, true)

}
