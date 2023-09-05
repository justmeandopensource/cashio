package cmd

import (
	"fmt"
	"os"

	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/justmeandopensource/cashio/internal/tui"
	"github.com/spf13/cobra"
)

var ledgerCmd = &cobra.Command{
	Use:   "ledger",
	Short: "set of sub commands to manage transactions in a ledger",
	Run: func(cmd *cobra.Command, _ []string) {
		name, _ := cmd.Flags().GetString("name")
		if name == "" {
			cmd.Help()
			os.Exit(1)
		}
		checkEnv(name)
		tui.TransactionsUI(name)
	},
}

// checkEnv checks for the presence of database file and if the ledger exist in the ledgers table,
// otherwise exits the program with status code 1
func checkEnv(ledgerName string) {
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
	ledgerCmd.PersistentFlags().StringP("name", "n", "", "ledger name")
	ledgerCmd.MarkFlagRequired("name")
}
