package tui

import (
	"strings"

	"github.com/gdamore/tcell/v2"
	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/rivo/tview"
)

// showAddCategoryForm collects new category details using form and adds it to the database
func showAddCategoryForm(workingLedger ledger.Ledger, categoryID int, categoryType string) {

	inputFieldFocused = true

	var (
		placeholder   = 0
		mainFormTitle = "[ Add Category ]"
		pageName      = "addCategoryForm"
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
  // FORM: Category
  // ============================
	mainForm.AddInputField("Category Name", "", 20, nil, nil)
	categoryField := mainForm.GetFormItemByLabel("Category Name").(*tview.InputField)

  // ============================
  // FORM: Placeholder
  // ============================
	mainForm.AddCheckbox("Placeholder?", false, func(checked bool) {
		if checked {
			placeholder = 1
		}
	})

  // ============================
  // FORM: Footer
  // ============================
	mainForm.AddTextView("  ", "", 30, 1, true, false)
	errorField := mainForm.GetFormItemByLabel("  ").(*tview.TextView)
	errorField.SetDynamicColors(true)

  // ============================
  // FORM: Buttons
  // ============================
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
				pages.RemovePage(pageName)
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
				page3TransTable.SetBorderColor(common.TCellColorBorderInactive)
			}
		}
		pages.RemovePage(pageName)
		app.SetFocus(page3CatTree)
		inputFieldFocused = false
	})

	mainForm.AddButton("Cancel", func() {
		pages.RemovePage(pageName)
		app.SetFocus(page3CatTree)
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
			app.SetFocus(page3CatTree)
			inputFieldFocused = false
		}
		return event
	})

  // ============================
  // FORM: Grid
  // ============================
	grid := tview.NewGrid().
		SetRows(0, 11, 0).
		SetColumns(0, 45, 0).
		AddItem(mainForm, 1, 1, 1, 1, 0, 0, true)

	pages.AddPage(pageName, grid, true, true)
}
