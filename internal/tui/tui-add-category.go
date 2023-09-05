package tui

import (
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// showAddCategoryForm collects new category details using form and adds it to the database
func showAddCategoryForm(workingLedger ledger.Ledger, categoryID int, categoryType string) {

	inputFieldFocused = true

	var placeholder = 0

	// form
	mainForm := tview.NewForm()

	// category name
	mainForm.AddInputField("Category Name", "", 20, nil, nil)
	categoryField := mainForm.GetFormItemByLabel("Category Name").(*tview.InputField)

	// placeholder
	mainForm.AddCheckbox("Placeholder?", false, func(checked bool) {
		if checked {
			placeholder = 1
		}
	})

	// status text
	mainForm.AddTextView("  ", "", 30, 1, true, false)
	errorField := mainForm.GetFormItemByLabel("  ").(*tview.TextView)

	mainForm.AddButton("Submit", func() {
		categoryName := strings.TrimSpace(categoryField.GetText())
		if categoryName == "" {
			showError(errorField, "invalid category name")
			return
		} else {
			category := ledger.Category{
				Name:        categoryName,
				Type:        categoryType,
				Placeholder: placeholder,
				ParentID:    categoryID,
			}
			if err := ledger.AddCategory(workingLedger.Name, category); err != nil {
				pages.RemovePage("addCategoryForm")
				app.SetFocus(page3CatTree)
				inputFieldFocused = false
				showModal(page3CatTree, err.Error())
				return
			} else {
				pages.RemovePage(workingLedger.Name + page3)
				setupTransByCatPage(workingLedger)
				newCategoryNode := findNodeByText(page3CatTree.GetRoot(), categoryName)
				expandParentNodes(page3CatTreeMap, newCategoryNode)
				page3CatTree.SetCurrentNode(newCategoryNode)
				page3TransTable.SetBorderColor(tcell.Color246)
			}
		}
		pages.RemovePage("addCategoryForm")
		app.SetFocus(page3CatTree)
		inputFieldFocused = false
	})
	mainForm.AddButton("Cancel", func() {
		pages.RemovePage("addCategoryForm")
		app.SetFocus(page3CatTree)
		inputFieldFocused = false
	})
	mainForm.SetButtonsAlign(tview.AlignCenter)
	mainForm.SetButtonBackgroundColor(tcell.Color238)
	mainForm.SetButtonActivatedStyle(tcell.StyleDefault.Foreground(tcell.ColorBlack).Background(tview.Styles.SecondaryTextColor))

	mainForm.SetTitle("[ Add Category ]")
	mainForm.SetBorder(true)
	mainForm.SetBorderColor(tview.Styles.SecondaryTextColor)
	mainForm.SetBackgroundColor(tcell.ColorDefault)
	mainForm.SetFieldBackgroundColor(tcell.Color238)
	mainForm.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		if event.Key() == tcell.KeyEsc {
			pages.RemovePage("addCategoryForm")
			app.SetFocus(page3CatTree)
			inputFieldFocused = false
		}
		return event
	})

	grid := tview.NewGrid().
		SetRows(0, 11, 0).
		SetColumns(0, 45, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage("addCategoryForm", grid, true, true)

}
