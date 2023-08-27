package cmd

import (
	"fmt"
	"os"

	"github.com/justmeandopensource/cashio/internal/common"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var rootCmd = &cobra.Command{
	Use:   "cashio",
	Short: "a command line personal finance manager",
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {

	home, _ := os.UserHomeDir()
	cashioCfg := ".cashio.yaml"

	viper.AddConfigPath(home)
	viper.SetConfigType("yaml")
	viper.SetConfigName(cashioCfg)

	if err := viper.ReadInConfig(); err != nil {
		fmt.Fprintln(os.Stderr, common.ColorizeRed(fmt.Sprint("[E] ", err)))
		os.Exit(1)
	}

	if err := common.CheckDataDir(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func SetCashioVersion(version string) {
	rootCmd.Version = version
}
