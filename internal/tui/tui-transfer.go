package tui

import (
	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

func showTransferChoiceModal(config TransferFundsConfig) {

	modal := tview.NewModal()
	modal.SetText("Transfer funds to an account in another ledger?")
	modal.AddButtons([]string{"Yes", "No"})
	modal.SetFocus(1)
	modal.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))
	modal.SetBackgroundColor(tcell.Color235)

	modal.SetDoneFunc(func(_ int, buttonLabel string) {
		pages.RemovePage("transferChoiceModal")
		switch {
		case buttonLabel == "Yes":
			showTransferFundsCrossForm(config)
		case buttonLabel == "No":
			showTransferFundsLocalForm(config)
		}
	})

	flex := tview.NewFlex()
	flex.AddItem(nil, 0, 1, true)
	flex.AddItem(modal, 0, 5, true)

	pages.AddPage("transferChoiceModal", flex, true, true)
}
