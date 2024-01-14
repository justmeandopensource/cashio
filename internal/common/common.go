package common

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"math"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/antonmedv/expr"
	"github.com/c-bata/go-prompt"
	"github.com/spf13/viper"
	"golang.org/x/term"
)

var termState *term.State

// A map of currency names to symbols
var CurrencySymbols = map[string]string{
	"GBP": "£",
	"INR": "₹",
	"USD": "$",
}

// A map of currencies to locales
var Locales = map[string]string{
	"GBP": "en-GB",
	"INR": "en-IN",
	"USD": "en-US",
}

// GetCurrencyNames iterates through CurrencySymbols map and returns a slice of strings that contains the currency names
func GetCurrencyNames() []string {
	var currencyNames []string
	for key := range CurrencySymbols {
		currencyNames = append(currencyNames, key)
	}
	return currencyNames
}

// GetCashioDBPath reads viper config and returns the absolute path to the cashio sqlite database file as string
func GetCashioDBPath() string {
	dataDir := getSanitisedPath(viper.GetString("data_directory"))
	dbFileName := viper.GetString("db_filename")
	return filepath.Join(dataDir, dbFileName)
}

// CheckDataDir checks if data_directory is present in the viper configuration file and that it exists in the filesystem,
// otherwise it returns an error
func CheckDataDir() error {

	dataDir := viper.GetString("data_directory")
	if len(dataDir) == 0 {
		return errors.New(ColorizeRed("[E] invalid data_directory in configuration"))
	}

	dataDir = getSanitisedPath(dataDir)
	if _, err := os.Stat(dataDir); errors.Is(err, fs.ErrNotExist) {
		return errors.New(ColorizeRed(fmt.Sprintf("[E] cashio data directory [%s] missing", dataDir)))
	}

	return nil
}

// CheckDBFile checks if db_filename is present in the viper configuration file and that it exists in the filesystem,
// otherwise it returns an error
func CheckDBFile() error {

	dataDir := getSanitisedPath(viper.GetString("data_directory"))
	dbFileName := viper.GetString("db_filename")

	if len(dbFileName) == 0 {
		return errors.New(ColorizeRed("[E] invalid db_filename in configuration"))
	}

	dbFile := filepath.Join(dataDir, dbFileName)
	if _, err := os.Stat(dbFile); errors.Is(err, fs.ErrNotExist) {
		return errors.New(ColorizeRed(ColorizeRed(fmt.Sprintf("[E] cashio db file [%s] missing", dbFile))))
	}

	return nil
}

// getSanitisedPath returns absolute path of the given path expanding any environment variables or tilda ~ sign
func getSanitisedPath(path string) string {
	sanitizedPath := os.ExpandEnv(path)
	home, _ := os.UserHomeDir()

	if strings.HasPrefix(path, "~/") {
		sanitizedPath = filepath.Join(home, path[2:])
	}

	return sanitizedPath
}

// BackupDBFile creates a backup of current db file in the same dataDir location
func BackupDBFile() error {

	var (
		sourceFilePath      = GetCashioDBPath()
		dataDir             = getSanitisedPath(viper.GetString("data_directory"))
		dbFile              = path.Base(sourceFilePath)
		dbFileExt           = path.Ext(sourceFilePath)
		timestamp           = time.Now().Format("20060102_150405")
		destinationFilePath = filepath.Join(dataDir, fmt.Sprintf("%s_%s.%s", dbFile, timestamp, dbFileExt))
	)

	sourceFile, err := os.Open(sourceFilePath)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destinationFile, err := os.Create(destinationFilePath)
	if err != nil {
		return err
	}
	defer destinationFile.Close()

	_, err = io.Copy(destinationFile, sourceFile)
	if err != nil {
		return err
	}

	return nil
}

// CleanupDBBackupFiles deletes DB backup files older than 5 days
func CleanupDBBackupFiles() error {

	var (
		currentTime             = time.Now()
		dataDir                 = getSanitisedPath(viper.GetString("data_directory"))
		minimumModificationTime = currentTime.Add(-5 * 24 * time.Hour) // files older than 5 days
		fileNamePattern         = regexp.MustCompile(`_backup_`)
	)

	err := filepath.Walk(dataDir, func(filePath string, fileInfo os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if fileInfo.Mode().IsRegular() && fileNamePattern.MatchString(fileInfo.Name()) && fileInfo.ModTime().Before(minimumModificationTime) {
			err := os.Remove(filePath)
			if err != nil {
				return err
			}
		}

		return nil
	})

	return err
}

// SaveTermState saves the current terminal state which can then be restored if needed
func SaveTermState() {
	oldState, err := term.GetState(int(os.Stdin.Fd()))
	if err != nil {
		return
	}
	termState = oldState
}

// RestoreTermState restores a previously saved terminal state
func RestoreTermState() {
	if termState != nil {
		term.Restore(int(os.Stdin.Fd()), termState)
	}
}

// Completer returns matched suggestions from the list of options as the input is typed
func Completer(options []string) func(d prompt.Document) []prompt.Suggest {
	return func(d prompt.Document) []prompt.Suggest {
		s := []prompt.Suggest{}
		for _, option := range options {
			if strings.Contains(option, d.GetWordBeforeCursor()) {
				s = append(s, prompt.Suggest{Text: option})
			}
		}
		return s
	}
}

// PadLeft returns the text with padCount number of spaces prefixed to it
func PadLeft(text string, padCount int) string {
	if padCount < 1 {
		return text
	}
	padChar := " "
	prefix := strings.Repeat(padChar, padCount)
	return prefix + text
}

// GetDateFromUser prompts the user for date input.
//
// Date can be entered either as YYYY-MM-DD (eg: 2023-08-21) or DD (eg: 21)
// If DD format is used, the date will default to the day in the current month and year
func GetDateFromUser() time.Time {

	var parsedDate time.Time
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("date [YYYY-MM-DD]: ")
	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(input)

	if input == "" {
		return time.Now()
	}

	if strings.Contains(input, "-") {
		parsedDate, _ = time.Parse("2006-01-02", input)
	} else {
		if len(input) == 1 {
			input = "0" + input
		}
		currentDate := time.Now()
		fullDateInput := fmt.Sprintf("%d-%02d-%s", currentDate.Year(), currentDate.Month(), input)
		parsedDate, _ = time.Parse("2006-01-02", fullDateInput)
	}

	return parsedDate
}

// ProcessExpression returns the value of an arithmetic expression
//
// Example: input of "3+4" will return 7.00
func ProcessExpression(input string) float64 {

	var processedOutput float64

	input = strings.TrimSpace(input)

	if strings.ContainsAny(input, "+-*/") {
		expression, _ := expr.Compile(input, expr.Env(nil))
		evalResult, _ := expr.Run(expression, nil)
		switch val := evalResult.(type) {
		case float64:
			processedOutput = val
		case int:
			processedOutput = float64(val)
		case int64:
			processedOutput = float64(val)
		}
	} else {
		processedOutput, _ = strconv.ParseFloat(input, 64)
	}

	return processedOutput
}

// PrecisionRoundAFloat returns the given float rounded to the precision number of places
func PrecisionRoundAFloat(value float64, precision int) float64 {
	return math.Round(value*math.Pow(10, float64(precision))) / math.Pow(10, float64(precision))
}

// SliceContains returns true if the slice contains given string otherwise false
func SliceContains(slice []string, item string) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}
