package main

import (
	"fmt"
	"runtime/debug"

	"github.com/justmeandopensource/cashio/cmd"
)

var (
	version = "(devel)"
	commit  = "none"
	date    = "unknown"
)

func setCashioVersion() {

	var versionString string

	info, _ := debug.ReadBuildInfo()

	if info.Main.Version != "" {
		version = info.Main.Version
	}

	for _, kv := range info.Settings {
		switch kv.Key {
		case "vcs.revision":
			commit = kv.Value
		case "vcs.time":
			date = kv.Value
		}
	}

	if commit == "none" {
		versionString = version
	} else {
		versionString = fmt.Sprintf("%v (commit: %v, built: %v)", version, commit, date)
	}

	cmd.SetCashioVersion(versionString)
}
