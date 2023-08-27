package cmd

import (
	"fmt"
	"os"

	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "initialize cashio database",
	Run:   initCmdStart,
}

// initCmdStart is the entrypoint for "cashio init" command that initializes cashio
func initCmdStart(_ *cobra.Command, _ []string) {

	if len(viper.GetString("db_filename")) == 0 {
		fmt.Fprintln(os.Stderr, common.ColorizeRed("[E] invalid data_directory in configuration"))
		os.Exit(1)
	}

	if err := common.CheckDBFile(); err == nil {
		fmt.Fprintln(os.Stdout, common.ColorizeYellow("[I] cashio already initialized"))
		return
	}

	if err := common.InitializeCashio(); err != nil {
		fmt.Fprintln(os.Stderr, err)
	} else {
		fmt.Fprintln(os.Stdout, common.ColorizeBlue("[I] cashio initialized"))
	}
}

func init() {
	rootCmd.AddCommand(initCmd)
}
