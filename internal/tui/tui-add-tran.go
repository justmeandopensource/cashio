package tui

import (
	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

func showAddTransactionForm() {

	inputFieldFocused = true

	form := tview.NewForm()
	form.AddDropDown("Type", []string{"Income", "Expense"}, 1, nil)
	form.AddInputField("Date", "", 12, nil, nil)
	form.AddInputField("Account", "", 20, nil, nil)
	form.AddInputField("Amount", "", 12, nil, nil)
	form.AddInputField("Notes", "", 50, nil, nil)
	form.AddCheckbox("Split?", false, nil)
	form.AddInputField("Category", "", 20, nil, nil)
	form.AddButton("Submit", nil)
	form.AddButton("Cancel", func() {
		pages.RemovePage("addTransactionForm")
		app.SetFocus(page2TransTable)
		inputFieldFocused = false
	})

	form.SetTitle("[ Add a new transaction ]")
	form.SetBorder(true)
	form.SetBorderColor(tview.Styles.SecondaryTextColor)
	form.SetBackgroundColor(tcell.ColorDefault)
	form.SetFieldBackgroundColor(tcell.Color238)
	form.SetButtonsAlign(tview.AlignCenter)
	form.SetButtonBackgroundColor(tcell.Color238)
	form.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	typeDropDown := form.GetFormItemByLabel("Type")
	typeDropDown.(*tview.DropDown).SetListStyles(
		tcell.StyleDefault.Background(tcell.Color236),
		tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor),
	)
	typeDropDown.(*tview.DropDown).SetFieldBackgroundColor(tcell.ColorDefault)

	form.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
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
		AddItem(form, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("addTransactionForm", grid, true, true)
}
