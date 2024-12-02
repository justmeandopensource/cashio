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
		mainFormTitle  = "[ Add Account ]"
		pageName       = "addAccountForm"
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
	errorField.SetDynamicColors(true)

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
				pages.RemovePage(pageName)
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
				page2TransTable.SetBorderColor(common.TCellColorBorderInactive)
			}
		}
		pages.RemovePage(pageName)
		app.SetFocus(page2AccTree)
		inputFieldFocused = false
	})
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage(pageName)
		app.SetFocus(page2AccTree)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(common.TCellColorFormBg)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorWhite).Background(common.TCellColorFormHighlight))

	mainForm.SetTitle(mainFormTitle)
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(common.TCellColorBorderActive)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
  mainForm.SetLabelColor(common.TCellColorBlue)
	mainForm.SetFieldBackgroundColor(common.TCellColorFormBg)
	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage(pageName)
			app.SetFocus(page2AccTree)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 13, 0).
		SetColumns(0, 45, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage(pageName, grid, true, true)
}
