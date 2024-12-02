package common

import (
	"fmt"

	"github.com/gdamore/tcell/v2"
)

const (
	ColorDefault = "\x1b[39m"
	ColorRed     = "\x1b[91m"
	ColorGreen   = "\x1b[32m"
	ColorBlue    = "\x1b[94m"
	ColorYellow  = "\x1b[33m"

  ColorActiveBorder   = 38
  ColorInactiveBorder = 246

  TCellColorDefaultText         = tcell.Color246
  TCellColorDullText            = tcell.Color242
  TCellColorBorderActive        = tcell.Color31
  TCellColorBorderInactive      = tcell.Color240
  TCellColorAccountsRowActiveBg = tcell.Color237
  TCellColorTransRowActiveBg    = tcell.Color237
  TCellColorTableAltColumns     = tcell.Color235
  TCellColorTableHeaderRow      = tcell.Color24
  TCellColorFormBg              = tcell.Color236
  TCellColorFormHighlight       = tcell.Color24
  TCellColorBlue                = tcell.Color38
  TCellColorGreen               = tcell.Color34
  TCellColorRed                 = tcell.Color202
)

// ColorizeRed returns a given string that is formatted in red color
func ColorizeRed(s string) string {
	return fmt.Sprintf("%s%s%s", ColorRed, s, ColorDefault)
}

// ColorizeGreen returns a given string that is formatted in green color
func ColorizeGreen(s string) string {
	return fmt.Sprintf("%s%s%s", ColorGreen, s, ColorDefault)
}

// ColorizeBlue returns a given string that is formatted in blue color
func ColorizeBlue(s string) string {
	return fmt.Sprintf("%s%s%s", ColorBlue, s, ColorDefault)
}

// ColorizeYellow returns a given string that is formatted in yellow color
func ColorizeYellow(s string) string {
	return fmt.Sprintf("%s%s%s", ColorYellow, s, ColorDefault)
}
