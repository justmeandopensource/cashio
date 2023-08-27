package common

import "fmt"

const (
	ColorDefault = "\x1b[39m"
	ColorRed     = "\x1b[91m"
	ColorGreen   = "\x1b[32m"
	ColorBlue    = "\x1b[94m"
	ColorYellow  = "\x1b[33m"
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
