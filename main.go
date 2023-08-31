package main

import (
	"github.com/justmeandopensource/cashio/cmd"
	"github.com/justmeandopensource/cashio/internal/common"
)

func main() {

	setCashioVersion()

	common.InitializeDBConnection()
	defer common.DbConn.Close()

	cmd.Execute()
}
