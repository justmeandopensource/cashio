import { UseToastOptions } from "@chakra-ui/react";

// prettier-ignore
export const currencyLocales: Record<string, string> = {
  "£": "en-GB",
  "₹": "en-IN",
  "$": "en-US",
};

export const formatNumberAsCurrency = (
  number: number,
  currencySymbol: string,
): string => {
  const locale = currencyLocales[currencySymbol] || "en-GB";
  const formattedBalance = Number(number).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formattedBalance}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  // Use local date components to avoid timezone conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

interface FormattedAmount {
  value: string;
  color: string;
  prefix: string;
}

export const formatAmount = (
  credit: number,
  debit: number,
  currencySymbol: string,
): FormattedAmount => {
  const amount = credit > 0 ? credit : debit;
  const formattedAmount = formatNumberAsCurrency(amount, currencySymbol);
  if (credit > 0) {
    return { value: formattedAmount, color: "teal.500", prefix: "+" };
  } else {
    return { value: formattedAmount, color: "red.500", prefix: "-" };
  }
};

export const toastDefaults: Partial<UseToastOptions> = {
  duration: 2000,
  position: "bottom",
  isClosable: false,
};
