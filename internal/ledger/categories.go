package ledger

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/c-bata/go-prompt"
	"github.com/justmeandopensource/cashio/internal/common"
)

// A Category is a representation of a record from the categories table
type Category struct {
	ID          int
	Name        string
	Type        string
	Placeholder int
	ParentID    int
	Children    []*Category
}

// FetchCategories fetches category records for the given ledger from the database and returns a slice of Category struct.
//
// If placeholder is true, only records where placeholder is set to 1 is fetched.
//
// If categoryType is set to either income or expense, only those records are fetched.
func FetchCategories(ledger string, categoryType string, placeholder bool) ([]*Category, error) {

	var queryFilter string

	switch categoryType {
	case "income":
		queryFilter = "WHERE type = 'income'"
	case "expense":
		queryFilter = "WHERE type = 'expense'"
	default:
		queryFilter = "WHERE 1"
	}

	if placeholder {
		queryFilter += " AND placeholder = 1"
	}

	query := fmt.Sprintf(`
    SELECT id, name, type, parent_id, placeholder
    FROM %s_categories
    %s
    ORDER BY parent_id
    `, ledger, queryFilter)

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categoryMap := make(map[int]*Category)
	var categories []*Category

	for rows.Next() {
		var categoryID, parentID, placeholder int
		var name, categoryType string
		if err := rows.Scan(&categoryID, &name, &categoryType, &parentID, &placeholder); err != nil {
			return nil, err
		}

		category := &Category{
			ID:          categoryID,
			Name:        name,
			Type:        categoryType,
			ParentID:    parentID,
			Placeholder: placeholder,
		}

		categoryMap[categoryID] = category

		if parentID == 0 {
			categories = append(categories, category)
		} else {
			parentCategory := categoryMap[parentID]
			parentCategory.Children = append(parentCategory.Children, category)
		}
	}

	return categories, nil
}

// AddCategory adds the given category to the database
func AddCategory(ledger string, category Category) error {

	stmt, err := common.DbConn.Prepare(fmt.Sprintf(
		`INSERT INTO %s_categories (name, type, placeholder, parent_id)
    VALUES (?, ?, ?, ?)
    `, ledger))
	if err != nil {
		return err
	}

	_, err = stmt.Exec(category.Name, category.Type, category.Placeholder, category.ParentID)
	if err != nil {
		return err
	}

	defer stmt.Close()

	return nil
}

// FormatCategories takes a slice of Category struct and returns a slice of string with category names
// prefixed with appropriate spaces to give it a nested list look
func FormatCategories(categories []*Category, prefix string) []string {

	var options []string

	for _, category := range categories {
		option := fmt.Sprintf("%s%s", prefix, category.Name)
		options = append(options, option)

		if len(category.Children) > 0 {
			subOptions := FormatCategories(category.Children, prefix+"   ")
			options = append(options, subOptions...)
		}
	}

	return options
}

// PromptForNewCategory gathers new category details from the user and returns an Category struct
// which can then be added to the database
func PromptForNewCategory(ledger string) Category {

	reader := bufio.NewReader(os.Stdin)

	var (
		name             string
		categoryType     string
		placeholder      int
		parentCategoryID int
	)

	// category name
	for {
		fmt.Printf("category name: ")
		name, _ = reader.ReadString('\n')
		name = strings.TrimSuffix(name, "\n")

		if len(name) > 0 {
			break
		}

		fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] category name is required"))
	}

	// category type
	categoryTypeChoice := []string{"income", "expense"}

	for {
		common.SaveTermState()
		categoryType = prompt.Input("category type [tab for options]: ", common.Completer(categoryTypeChoice), prompt.OptionShowCompletionAtStart())
		common.RestoreTermState()

		if len(categoryType) > 0 {
			break
		}

		fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] category type is required"))
	}

	// placeholder category?
	fmt.Print("is this going to be a placeholder category? (y/N): ")
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(strings.ToLower(response))

	if response == "y" {
		placeholder = 1
	} else {
		placeholder = 0
	}

	// parent category id
	parentCategoryID, _ = promptForSelectingCategory(ledger, "parent category", categoryType, true)

	category := Category{
		Name:        name,
		Type:        categoryType,
		Placeholder: placeholder,
		ParentID:    parentCategoryID,
	}

	return category
}

// promptForSelectingCategory displays a prompt asking the user to pick a category from the list
func promptForSelectingCategory(ledger string, promptMsg string, categoryType string, placeholder bool) (int, error) {

	var categoryID int

	if len(promptMsg) == 0 {
		promptMsg = "pick a category [tab for options]: "
	} else {
		promptMsg = fmt.Sprintf("%s [tab for options]: ", promptMsg)
	}

	categories, err := FetchCategories(ledger, categoryType, placeholder)
	if err != nil {
		return 0, err
	}

	categoriesFormatted := FormatCategories(categories, "")

	if len(categoriesFormatted) > 0 {
		common.SaveTermState()
		parentCategory := prompt.Input(
			promptMsg,
			common.Completer(categoriesFormatted),
			prompt.OptionShowCompletionAtStart(),
			prompt.OptionMaxSuggestion(30),
		)
		common.RestoreTermState()
		categoryID = GetCategoryID(parentCategory, categories)
	}

	return categoryID, nil
}

// GetCategoryID returns the category id of the given category name
func GetCategoryID(categoryName string, categories []*Category) int {
	categoryName = strings.TrimSpace(categoryName)
	for _, category := range categories {
		option := category.Name
		if option == categoryName {
			return category.ID
		}
		if category.Children != nil {
			subCategoryID := GetCategoryID(categoryName, category.Children)
			if subCategoryID != 0 {
				return subCategoryID
			}
		}
	}
	return 0
}

// getCategoryType returns the category type of the given category name
func getCategoryType(categoryName string, categories []*Category) string {
	categoryName = strings.TrimSpace(categoryName)
	for _, category := range categories {
		if category.Name == categoryName {
			return category.Type
		}
		if category.Children != nil {
			subCategoryType := getCategoryType(categoryName, category.Children)
			if subCategoryType != "" {
				return subCategoryType
			}
		}
	}
	return ""
}

// isPlaceHolderCategory returns true if the given category is a placeholder category,
// false otherwise
func isPlaceHolderCategory(categoryID int, categories []*Category) bool {
	for _, category := range categories {
		if category.ID == categoryID {
			if category.Placeholder == 1 {
				return true
			}
		}
		if category.Children != nil {
			if isPlaceHolderCategory(categoryID, category.Children) {
				return true
			}
		}
	}
	return false
}

// GetChildCategoryIDs returns a slice of IDs of all the child categories for the given category
func GetChildCategoryIDs(categoryID int, categories []*Category) []int {
	var cids []int
	for _, category := range categories {
		if category.ID == categoryID {
			if category.Children != nil {
				childIDs := getChildCategoryIDsHelper(category.Children)
				cids = append(cids, childIDs...)
			}
			break
		}
		if category.Children != nil {
			childIDs := GetChildCategoryIDs(categoryID, category.Children)
			cids = append(cids, childIDs...)
		}
	}
	return cids
}

// getChildCategoryIDsHelper recurses through all child categories of a given category
// and returns a slice of all IDs
func getChildCategoryIDsHelper(categories []*Category) []int {
	var cids []int
	for _, category := range categories {
		if category.Placeholder == 1 {
			childIDs := getChildCategoryIDsHelper(category.Children)
			cids = append(cids, childIDs...)
		} else {
			cids = append(cids, category.ID)
		}
	}
	return cids
}

// FetchCategoryStatsData returns a slice of StatsData struct for the given period
// for the given category for the given count.
//
// Period can be either "monthly" or "yearly"
func FetchCategoryStatsData(ledgerName string, category string, period string, count int) ([]*StatsData, error) {

	categories, err := FetchCategories(ledgerName, "", false)
	if err != nil {
		return nil, err
	}

	categoryID := GetCategoryID(category, categories)
	categoryType := getCategoryType(category, categories)

	var debitOrCredit string
	switch categoryType {
	case "income":
		debitOrCredit = "credit"
	case "expense":
		debitOrCredit = "debit"
	}

	var query, inClause string

	if isPlaceHolderCategory(categoryID, categories) {
		childIDs := GetChildCategoryIDs(categoryID, categories)
		for i, id := range childIDs {
			if i != 0 {
				inClause += ", "
			}
			inClause += fmt.Sprintf("%d", id)
		}
	} else {
		inClause = strconv.Itoa(categoryID)
	}

	if period == "monthly" {
		query = fmt.Sprintf(`
      WITH RECURSIVE months AS (
        SELECT strftime('%%Y-%%m', date('now')) AS month
        UNION ALL
        SELECT strftime('%%Y-%%m', date(month || '-01', '-1 month'))
        FROM months
        LIMIT %d
      )
      SELECT
        months.month,
        COALESCE(ROUND(SUM(amount)), 0) AS total
      FROM months
      LEFT JOIN (
        SELECT strftime('%%Y-%%m', t.date) AS month, sum(t.%s) AS amount
        FROM %s_transactions t
        JOIN %s_categories c ON t.category_id = c.id
        WHERE c.id IN (%s)
          AND t.date >= date('now', '-%d months', 'start of month')
        GROUP BY month

        UNION ALL

        SELECT strftime('%%Y-%%m', st.date) AS month, sum(st.%s) AS amount
        FROM %s_split_transactions st
        JOIN %s_categories c ON st.category_id = c.id
        WHERE c.id IN (%s)
          AND st.date >= date('now', '-%d months', 'start of month')
        GROUP BY month
      ) AS transactions ON months.month = transactions.month
      GROUP BY months.month
      ORDER BY months.month ASC;
    `, count,
			debitOrCredit,
			ledgerName,
			ledgerName,
			inClause,
			count,
			debitOrCredit,
			ledgerName,
			ledgerName,
			inClause,
			count,
		)
	} else {
		query = fmt.Sprintf(`
      WITH RECURSIVE years AS (
        SELECT strftime('%%Y', date('now')) AS year
        UNION ALL
        SELECT strftime('%%Y', date(year || '-01-01', '-1 year'))
        FROM years
        LIMIT %d
      )
      SELECT
        years.year,
        COALESCE(ROUND(SUM(amount)), 0) AS total
      FROM years
      LEFT JOIN (
        SELECT strftime('%%Y', t.date) AS year, sum(t.%s) AS amount
        FROM %s_transactions t
        JOIN %s_categories c ON t.category_id = c.id
        WHERE c.id IN (%s)
          AND t.date >= date('now', '-%d years', 'start of year')
        GROUP BY year

        UNION ALL

        SELECT strftime('%%Y', st.date) AS year, sum(st.%s) AS amount
        FROM %s_split_transactions st
        JOIN %s_categories c ON st.category_id = c.id
        WHERE c.id IN (%s)
          AND st.date >= date('now', '-%d years', 'start of year')
        GROUP BY year
      ) AS transactions ON years.year = transactions.year
      GROUP BY years.year
      ORDER BY years.year ASC;
    `, count,
			debitOrCredit,
			ledgerName,
			ledgerName,
			inClause,
			count,
			debitOrCredit,
			ledgerName,
			ledgerName,
			inClause,
			count,
		)
	}

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var statsData []*StatsData
	for rows.Next() {
		var period string
		var amount float64
		if err := rows.Scan(&period, &amount); err != nil {
			return nil, err
		}
		data := &StatsData{
			Period: period,
			Amount: amount,
		}
		statsData = append(statsData, data)
	}

	return statsData, nil
}

// FetchIncomeExpenseStatsData returns a slice of StatsData of either income or expense  for the given period
// for given count
func FetchIncomeExpenseStatsData(ledgerName string, incomeOrExpense string, period string, count int) ([]*StatsData, error) {

	var debitOrCredit string
	switch incomeOrExpense {
	case "income":
		debitOrCredit = "credit"
	case "expense":
		debitOrCredit = "debit"
	}

	var query string

	if period == "monthly" {
		query = fmt.Sprintf(`
      WITH RECURSIVE months AS (
        SELECT strftime('%%Y-%%m', date('now')) AS month
        UNION ALL
        SELECT strftime('%%Y-%%m', date(month || '-01', '-1 month'))
        FROM months
        LIMIT %d
      )
      SELECT
        months.month,
        COALESCE(ROUND(SUM(amount)), 0) AS total
      FROM months
      LEFT JOIN (
        SELECT strftime('%%Y-%%m', t.date) AS month, sum(t.%s) AS amount
        FROM %s_transactions t
        WHERE t.date >= date('now', '-%d months', 'start of month')
          AND category_id IS NOT NULL
        GROUP BY month
      ) AS transactions ON months.month = transactions.month
      GROUP BY months.month
      ORDER BY months.month ASC;
    `, count,
			debitOrCredit,
			ledgerName,
			count,
		)
	} else {
		query = fmt.Sprintf(`
      WITH RECURSIVE years AS (
        SELECT strftime('%%Y', date('now')) AS year
        UNION ALL
        SELECT strftime('%%Y', date(year || '-01-01', '-1 year'))
        FROM years
        LIMIT %d
      )
      SELECT
        years.year,
        COALESCE(ROUND(SUM(amount)), 0) AS total
      FROM years
      LEFT JOIN (
        SELECT strftime('%%Y', t.date) AS year, sum(t.%s) AS amount
        FROM %s_transactions t
        WHERE t.date >= date('now', '-%d years', 'start of year')
          AND category_id IS NOT NULL
        GROUP BY year
      ) AS transactions ON years.year = transactions.year
      GROUP BY years.year
      ORDER BY years.year ASC;
    `, count,
			debitOrCredit,
			ledgerName,
			count,
		)
	}

	rows, err := common.DbConn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var statsData []*StatsData
	for rows.Next() {
		var period string
		var amount float64
		if err := rows.Scan(&period, &amount); err != nil {
			return nil, err
		}
		data := &StatsData{
			Period: period,
			Amount: amount,
		}
		statsData = append(statsData, data)
	}

	return statsData, nil
}
