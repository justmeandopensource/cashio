package cmd

import (
	"fmt"
	"os"

	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/justmeandopensource/cashio/internal/ledger"
	"github.com/spf13/cobra"
)

// initCmd represents the init command
var addLedgerCmd = &cobra.Command{
	Use:   "add-ledger",
	Short: "create a new ledger",
	Run:   addLedgerStart,
}

// addLedgerStart is the entrypoint for "cashio add-ledger" command that adds a new ledger
func addLedgerStart(_ *cobra.Command, _ []string) {
	if err := common.CheckDBFile(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	ledger.AddLedger()
}

func init() {
	rootCmd.AddCommand(addLedgerCmd)
}
