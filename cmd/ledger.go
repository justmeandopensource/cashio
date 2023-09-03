package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/justmeandopensource/cashio/internal/tui"
	"github.com/spf13/cobra"
)

var ledgerName string

var ledgerCmd = &cobra.Command{
	Use:   "ledger",
	Short: "set of sub commands to manage transactions in a ledger",
	Run: func(cmd *cobra.Command, _ []string) {
		cmd.Help()
		os.Exit(1)
	},
}

var addAccountCmd = &cobra.Command{
	Use:   "add-account",
	Short: "add a new account",
	Run:   addAccountCmdStart,
}

var addCategoryCmd = &cobra.Command{
	Use:   "add-category",
	Short: "add a new transaction category",
	Run:   addCategoryCmdStart,
}

var transferFundsCmd = &cobra.Command{
	Use:   "transfer-funds",
	Short: "make a fund transfer between accounts",
	Run:   transferFundsCmdStart,
}

var uiCmd = &cobra.Command{
	Use:   "ui",
	Short: "open ledger ui",
	Run:   uiCmdStart,
}

// addAccountCmdStart is the entrypoint for "add-account" sub-command to cashio
func addAccountCmdStart(_ *cobra.Command, _ []string) {

	checkEnv()

	reader := bufio.NewReader(os.Stdin)

	for {
		account := ledger.PromptForNewAccount(ledgerName)
		if err := ledger.AddAccount(ledgerName, account); err != nil {
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
		} else {
			fmt.Fprintln(os.Stdout, "account added")
		}

		fmt.Print("add another account? (y/n): ")
		response, _ := reader.ReadString('\n')
		response = strings.TrimSpace(strings.ToLower(response))

		if response != "y" {
			break
		}
	}
}

// addCategoryCmdStart is the entrypoint for "add-category" sub-command to cashio
func addCategoryCmdStart(_ *cobra.Command, _ []string) {

	checkEnv()

	reader := bufio.NewReader(os.Stdin)

	for {
		category := ledger.PromptForNewCategory(ledgerName)
		if err := ledger.AddCategory(ledgerName, category); err != nil {
			fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
		} else {
			fmt.Fprintln(os.Stdout, "category added")
		}

		fmt.Print("add another category? (y/n): ")
		response, _ := reader.ReadString('\n')
		response = strings.TrimSpace(strings.ToLower(response))

		if response != "y" {
			break
		}
	}
}

// transferFundsCmdStart is the entrypoint for "transfer-funds" sub-command to cashio
func transferFundsCmdStart(_ *cobra.Command, _ []string) {
	checkEnv()
	toLedger, transactions := ledger.PromptForNewTransfer(ledgerName)
	if err := ledger.TransferFunds(ledgerName, toLedger, transactions); err != nil {
		fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err.Error())))
	} else {
		fmt.Fprintln(os.Stdout, common.ColorizeYellow("\nfunds transferred!"))
	}
}

// uiCmdStart is the entrypoint for "transactions-ui" sub-command to cashio
func uiCmdStart(_ *cobra.Command, _ []string) {
	checkEnv()
	tui.TransactionsUI(ledgerName)
}

// checkEnv checks for the presence of database file and if the ledger exist in the ledgers table,
// otherwise exits the program with status code 1
func checkEnv() {
	if err := common.CheckDBFile(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	if !ledger.IsValidLedger(ledgerName) {
		fmt.Fprintln(os.Stdout, common.ColorizeRed("[E] ledger not found"))
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(ledgerCmd)
	ledgerCmd.PersistentFlags().StringVarP(&ledgerName, "name", "n", "", "ledger name")
	ledgerCmd.MarkFlagRequired("name")
	ledgerCmd.AddCommand(addAccountCmd)
	ledgerCmd.AddCommand(addCategoryCmd)
	ledgerCmd.AddCommand(transferFundsCmd)
	ledgerCmd.AddCommand(uiCmd)
}
