import React from "react";

// Function to handle numeric input validation
export const handleNumericInput = (
  e: React.KeyboardEvent<HTMLInputElement>,
  currentValue: string,
) => {
  const key = e.key;
  const inputElement = e.currentTarget;
  const selectionStart = inputElement.selectionStart || 0;
  const selectionEnd = inputElement.selectionEnd || 0;

  // Allow navigation keys, backspace, delete, tab
  if (
    key === "Backspace" ||
    key === "Delete" ||
    key === "Tab" ||
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "Home" ||
    key === "End" ||
    (key === "a" && (e.ctrlKey || e.metaKey)) || // Ctrl+A or Cmd+A
    (key === "c" && (e.ctrlKey || e.metaKey)) || // Ctrl+C or Cmd+C
    (key === "v" && (e.ctrlKey || e.metaKey)) || // Ctrl+V or Cmd+V
    (key === "x" && (e.ctrlKey || e.metaKey)) // Ctrl+X or Cmd+X
  ) {
    return; // Allow these keys
  }

  // Only allow digits and decimal point
  if (!/^[0-9.]$/.test(key)) {
    e.preventDefault();
    return;
  }

  // Handle decimal point
  if (key === ".") {
    // Don't allow decimal point if one already exists
    if (currentValue.includes(".")) {
      e.preventDefault();
      return;
    }
  }

  // For digits, check if we would exceed 2 decimal places
  if (/^[0-9]$/.test(key)) {
    const beforeCursor = currentValue.substring(0, selectionStart);
    const afterCursor = currentValue.substring(selectionEnd);
    const newValue = beforeCursor + key + afterCursor;

    // Check decimal places
    const decimalIndex = newValue.indexOf(".");
    if (decimalIndex !== -1 && newValue.length - decimalIndex > 3) {
      e.preventDefault();
      return;
    }
  }
};

// Function to handle paste events for numeric inputs
export const handleNumericPaste = (  
  e: React.ClipboardEvent<HTMLInputElement>,
  // eslint-disable-next-line no-unused-vars
  onValue: (newValue: string) => void,
) => {
  e.preventDefault();
  const pastedText = e.clipboardData.getData("text");

  // Remove any non-numeric characters except decimal point
  let cleanedText = pastedText.replace(/[^0-9.]/g, "");

  // Ensure only one decimal point
  const decimalIndex = cleanedText.indexOf(".");
  if (decimalIndex !== -1) {
    cleanedText =
      cleanedText.substring(0, decimalIndex + 1) +
      cleanedText.substring(decimalIndex + 1).replace(/\./g, "");
  }

  // Limit to 2 decimal places
  const finalDecimalIndex = cleanedText.indexOf(".");
  if (finalDecimalIndex !== -1 && cleanedText.length - finalDecimalIndex > 3) {
    cleanedText = cleanedText.substring(0, finalDecimalIndex + 3);
  }

  // Don't allow decimal point as first character
  if (cleanedText.startsWith(".")) {
    cleanedText = cleanedText.substring(1);
  }

  onValue(cleanedText);
};
