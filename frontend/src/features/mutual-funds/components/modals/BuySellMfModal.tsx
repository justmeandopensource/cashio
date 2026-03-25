import React, { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightElement,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  HStack,
  Text,
  Badge,
  Box,
  Stack,
  Spinner,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Building2,
  Coins,
  Search,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import { buyMutualFund, sellMutualFund } from "../../api";
import { MutualFund, MfTransactionCreate } from "../../types";
import { formatUnits, formatAmount } from "../../utils";
import useLedgerStore from "@/components/shared/store";

interface BuySellMfModalProps {
  isOpen: boolean;
  onClose: () => void;
  fund?: MutualFund;
  onSuccess: () => void;
}

interface Account {
  account_id: number;
  name: string;
  type: "asset" | "liability";
  subtype?: string;
  owner?: string;
}

interface FormData {
  mutual_fund_id: string;
  units: string;
  amount_excluding_charges: string;
  other_charges: string;
  expense_category_id: string;
  account_id: string;
  transaction_date: Date;
  notes: string;
}

const BuySellMfModal: FC<BuySellMfModalProps> = ({
  isOpen,
  onClose,
  fund,
  onSuccess,
}) => {
  const { ledgerId } = useLedgerStore();
  const { currencySymbol } = useLedgerStore();
  const queryClient = useQueryClient();
  const [tabIndex, setTabIndex] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    mutual_fund_id: fund?.mutual_fund_id.toString() || "",
    units: "",
    amount_excluding_charges: "",
    other_charges: "",
    expense_category_id: "",
    account_id: "",
    transaction_date: new Date(),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const addonColor = useColorModeValue("gray.600", "gray.200");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");
  const tabUnselectedColor = useColorModeValue("gray.600", "gray.200");

  // Searchable dropdown state — Account
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [highlightedAccountIndex, setHighlightedAccountIndex] = useState<number>(-1);

  // Searchable dropdown state — Expense Category
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1);

  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["accounts", ledgerId],
    queryFn: async () => {
      const response = await api.get(`/ledger/${Number(ledgerId)}/accounts`);
      return response.data;
    },
    enabled: !!ledgerId && isOpen,
  });

  const { data: expenseCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", ledgerId, "expense"],
    queryFn: async () => {
      const response = await api.get(
        `/category/list?type=expense&ignore_group=true`,
      );
      return response.data;
    },
    enabled: !!ledgerId && isOpen,
  });

  const transactionMutation = useMutation({
    mutationFn: (transactionData: MfTransactionCreate) => {
      if (transactionData.transaction_type === "buy") {
        return buyMutualFund(Number(ledgerId), transactionData);
      } else {
        return sellMutualFund(Number(ledgerId), transactionData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["accounts", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["fund-transactions", ledgerId] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({
          general: `Failed to ${tabIndex === 0 ? "buy" : "sell"} mutual fund units. Please try again.`,
        });
      }
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && fund) {
      setTabIndex(0);
      setFormData({
        mutual_fund_id: fund.mutual_fund_id.toString(),
        units: "",
        amount_excluding_charges: "",
        other_charges: "",
        expense_category_id: "",
        account_id: "",
        transaction_date: new Date(),
        notes: "",
      });
      setErrors({});
      resetDropdownState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fund]);

  // Computed filtered accounts
  const selectedAccount = (accounts || []).find(
    a => a.account_id.toString() === formData.account_id,
  );
  const filteredAssetAccounts = (accounts || []).filter(
    a => a.type === "asset" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const filteredLiabilityAccounts = (accounts || []).filter(
    a => a.type === "liability" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const allFilteredAccounts = [...filteredAssetAccounts, ...filteredLiabilityAccounts];
  const hasFilteredAccountResults = allFilteredAccounts.length > 0;

  // Computed filtered expense categories
  const selectedCategory = (expenseCategories || []).find(
    (c: any) => c.category_id.toString() === formData.expense_category_id,
  );
  const filteredCategories = (expenseCategories || []).filter(
    (c: any) => c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const hasFilteredCategoryResults = filteredCategories.length > 0;

  const resetDropdownState = () => {
    setAccountSearch("");
    setIsAccountOpen(false);
    setHighlightedAccountIndex(-1);
    setCategorySearch("");
    setIsCategoryOpen(false);
    setHighlightedCategoryIndex(-1);
  };

  const handleAccountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isAccountOpen) { setIsAccountOpen(true); setHighlightedAccountIndex(0); }
        else { setHighlightedAccountIndex(prev => total === 0 ? -1 : (prev + 1) % total); }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isAccountOpen && total > 0) setHighlightedAccountIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        break;
      case "Enter":
        if (isAccountOpen && highlightedAccountIndex >= 0 && highlightedAccountIndex < total) {
          e.preventDefault();
          const acc = allFilteredAccounts[highlightedAccountIndex];
          handleInputChange("account_id", acc.account_id.toString());
          setAccountSearch("");
          setIsAccountOpen(false);
          setHighlightedAccountIndex(-1);
        }
        break;
      case "Escape":
        setIsAccountOpen(false);
        setHighlightedAccountIndex(-1);
        break;
      case "Tab":
        setIsAccountOpen(false);
        setHighlightedAccountIndex(-1);
        break;
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isCategoryOpen) { setIsCategoryOpen(true); setHighlightedCategoryIndex(0); }
        else { setHighlightedCategoryIndex(prev => total === 0 ? -1 : (prev + 1) % total); }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isCategoryOpen && total > 0) setHighlightedCategoryIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        break;
      case "Enter":
        if (isCategoryOpen && highlightedCategoryIndex >= 0 && highlightedCategoryIndex < total) {
          e.preventDefault();
          const cat = filteredCategories[highlightedCategoryIndex];
          handleInputChange("expense_category_id", cat.category_id.toString());
          setCategorySearch("");
          setIsCategoryOpen(false);
          setHighlightedCategoryIndex(-1);
        }
        break;
      case "Escape":
        setIsCategoryOpen(false);
        setHighlightedCategoryIndex(-1);
        break;
      case "Tab":
        setIsCategoryOpen(false);
        setHighlightedCategoryIndex(-1);
        break;
    }
  };

  const handleClose = () => {
    transactionMutation.reset();
    setFormData({
      mutual_fund_id: fund?.mutual_fund_id.toString() || "",
      units: "",
      amount_excluding_charges: "",
      other_charges: "",
      expense_category_id: "",
      account_id: "",
      transaction_date: new Date(),
      notes: "",
    });
    setErrors({});
    resetDropdownState();
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.units || parseFloat(formData.units) <= 0) {
      newErrors.units = "Units must be greater than 0";
    }
    if (
      !formData.amount_excluding_charges ||
      parseFloat(formData.amount_excluding_charges) <= 0
    ) {
      newErrors.amount_excluding_charges =
        "Amount excluding charges must be greater than 0";
    }
    if (parseFloat(formData.other_charges || "0") < 0) {
      newErrors.other_charges = "Other charges cannot be negative";
    }
    if (
      parseFloat(formData.other_charges || "0") > 0 &&
      !formData.expense_category_id
    ) {
      newErrors.expense_category_id =
        "Expense category is required when other charges are present";
    }
    if (!formData.account_id) {
      newErrors.account_id = "Please select an account.";
    }
    if (
      !formData.transaction_date ||
      isNaN(formData.transaction_date.getTime())
    ) {
      newErrors.transaction_date = "Transaction date is required.";
    }

    // Additional validation for sell transactions
    if (
      tabIndex === 1 &&
      selectedFund &&
      parseFloat(formData.units) > totalUnits
    ) {
      newErrors.units = `Cannot sell more than available units (${totalUnits}).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const transactionData: MfTransactionCreate = {
      mutual_fund_id: fund!.mutual_fund_id,
      transaction_type: tabIndex === 0 ? "buy" : "sell",
      units: parseFloat(formData.units),
      amount_excluding_charges: parseFloat(formData.amount_excluding_charges),
      other_charges: parseFloat(formData.other_charges || "0"),
      expense_category_id: formData.expense_category_id
        ? parseInt(formData.expense_category_id)
        : undefined,
      account_id: parseInt(formData.account_id),
      transaction_date: formData.transaction_date.toISOString(),
      notes: formData.notes.trim() || undefined,
    };

    transactionMutation.mutate(transactionData);
  };

  const handleInputChange = (field: keyof FormData, value: string | Date) => {
    let processedValue: string | Date = value;

    // For transaction_date field, value is Date
    if (field === "transaction_date") {
      processedValue = value as Date;
    } else {
      // For units field, limit to 3 decimal places
      if (field === "units") {
        const stringValue = value as string;
        // Allow empty string, numbers, and decimal point
        if (stringValue === "" || /^\d*\.?\d*$/.test(stringValue)) {
          // Check if there are more than 3 decimal places
          const decimalPart = stringValue.split(".")[1];
          if (decimalPart && decimalPart.length > 3) {
            // Truncate to 3 decimal places
            const integerPart = stringValue.split(".")[0];
            processedValue = `${integerPart}.${decimalPart.substring(0, 3)}`;
          }
        } else {
          // If invalid characters, don't update
          return;
        }
      }

      // For amount_excluding_charges and other_charges fields, limit to 2 decimal places
      if (field === "amount_excluding_charges" || field === "other_charges") {
        const stringValue = value as string;
        // Allow empty string, numbers, and decimal point
        if (stringValue === "" || /^\d*\.?\d*$/.test(stringValue)) {
          // Check if there are more than 2 decimal places
          const decimalPart = stringValue.split(".")[1];
          if (decimalPart && decimalPart.length > 2) {
            // Truncate to 2 decimal places
            const integerPart = stringValue.split(".")[0];
            processedValue = `${integerPart}.${decimalPart.substring(0, 2)}`;
          }
        } else {
          // If invalid characters, don't update
          return;
        }
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const selectedFund = fund;
  const totalUnits = selectedFund ? Number(selectedFund.total_units) : 0;
  const currentType = tabIndex === 0 ? "buy" : "sell";
  const amountExcludingCharges =
    parseFloat(formData.amount_excluding_charges) || 0;
  const units = parseFloat(formData.units) || 0;
  const navPerUnit = units > 0 ? amountExcludingCharges / units : 0;

  const isFormValid = () => {
    return (
      formData.units &&
      formData.amount_excluding_charges &&
      formData.account_id &&
      (parseFloat(formData.units) || 0) > 0 &&
      (parseFloat(formData.amount_excluding_charges) || 0) > 0 &&
      parseFloat(formData.other_charges || "0") >= 0 &&
      (!(parseFloat(formData.other_charges || "0") > 0) ||
        formData.expense_category_id) &&
      !(
        currentType === "sell" &&
        selectedFund &&
        parseFloat(formData.units) > totalUnits
      ) &&
      Object.keys(errors).length === 0
    );
  };

  const renderForm = (type: "buy" | "sell") => (
    <VStack spacing={{ base: 5, sm: 6 }} align="stretch">
      {/* Transaction Details Card */}
      <Box
        bg={cardBg}
        p={{ base: 4, sm: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack spacing={5} align="stretch">
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.units}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Coins size={16} />
                  <Text>Units to {type}</Text>
                  {formData.units && parseFloat(formData.units) > 0 && (
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
                  )}
                </HStack>
              </FormLabel>
              <Input
                type="number"
                step="0.001"
                value={formData.units}
                onChange={(e) => handleInputChange("units", e.target.value)}
                placeholder="0.000"
                min={0}
                 max={type === "sell" ? totalUnits : undefined}
                size="lg"
                bg={inputBg}
                borderColor={inputBorderColor}
                borderWidth="2px"
                borderRadius="md"
                autoFocus
                _hover={{ borderColor: "teal.300" }}
                _focus={{
                  borderColor: focusBorderColor,
                  boxShadow: `0 0 0 1px ${focusBorderColor}`,
                }}
              />
              <FormErrorMessage>{errors.units}</FormErrorMessage>
              <FormHelperText>
                {type === "buy" ? "Current holdings" : "Available to sell"}:{" "}
                {selectedFund ? formatUnits(totalUnits) : "0"}
              </FormHelperText>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.amount_excluding_charges}>
               <FormLabel fontWeight="semibold" mb={2}>
                 <HStack spacing={2}>
                   <DollarSign size={16} />
                   <Text>Amount</Text>
                   {formData.amount_excluding_charges && parseFloat(formData.amount_excluding_charges) > 0 && (
                     <Icon as={Check} boxSize={3.5} color="teal.500" />
                   )}
                 </HStack>
               </FormLabel>
               <InputGroup size="lg">
                 <InputLeftAddon
                   bg={inputBorderColor}
                   borderWidth="2px"
                   borderColor={inputBorderColor}
                   color={addonColor}
                   fontWeight="semibold"
                 >
                  {currencySymbol || "₹"}
                </InputLeftAddon>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount_excluding_charges}
                  onChange={(e) =>
                    handleInputChange(
                      "amount_excluding_charges",
                      e.target.value,
                    )
                  }
                  placeholder="0.00"
                  min={0}
                  bg={inputBg}
                  borderColor={inputBorderColor}
                  borderWidth="2px"
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                />
              </InputGroup>
              <FormErrorMessage>
                {errors.amount_excluding_charges}
              </FormErrorMessage>
               <FormHelperText>
                 NAV per unit: {currencySymbol || "₹"}
                 {formatAmount(navPerUnit)}
               </FormHelperText>
            </FormControl>
          </Stack>

          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.account_id}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Building2 size={16} />
                  <Text>{type === "buy" ? "Source Account" : "Destination Account"}</Text>
                  {formData.account_id && (
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
                  )}
                </HStack>
              </FormLabel>
              {accountsLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" color="teal.500" />
                  <Text fontSize="sm" color={helperTextColor}>
                    Loading accounts...
                  </Text>
                </HStack>
              ) : (
                <Popover
                  isOpen={isAccountOpen}
                  onClose={() => { setIsAccountOpen(false); setHighlightedAccountIndex(-1); }}
                  matchWidth
                  placement="bottom-start"
                  autoFocus={false}
                  returnFocusOnClose={false}
                >
                  <PopoverTrigger>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none" height="100%">
                        <Icon as={Search} boxSize={4} color={helperTextColor} />
                      </InputLeftElement>
                      <Input
                        value={isAccountOpen ? accountSearch : (selectedAccount?.name ?? "")}
                        onChange={(e) => {
                          setAccountSearch(e.target.value);
                          handleInputChange("account_id", "");
                          setHighlightedAccountIndex(-1);
                          setIsAccountOpen(true);
                        }}
                        onFocus={() => {
                          setAccountSearch("");
                          setHighlightedAccountIndex(-1);
                          setIsAccountOpen(true);
                        }}
                        onKeyDown={handleAccountKeyDown}
                        placeholder="Search accounts..."
                        borderWidth="2px"
                        borderColor={formData.account_id ? "teal.400" : inputBorderColor}
                        bg={inputBg}
                        borderRadius="md"
                        _hover={{ borderColor: "teal.300" }}
                        _focus={{
                          borderColor: focusBorderColor,
                          boxShadow: `0 0 0 1px ${focusBorderColor}`,
                        }}
                        autoComplete="off"
                      />
                      <InputRightElement height="100%" pr={1}>
                        {formData.account_id ? (
                          <Icon
                            as={X}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => {
                              handleInputChange("account_id", "");
                              setAccountSearch("");
                              setIsAccountOpen(false);
                              setHighlightedAccountIndex(-1);
                            }}
                          />
                        ) : (
                          <Icon
                            as={ChevronDown}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => setIsAccountOpen(!isAccountOpen)}
                          />
                        )}
                      </InputRightElement>
                    </InputGroup>
                  </PopoverTrigger>
                  <PopoverContent
                    p={0}
                    bg={bgColor}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    boxShadow="lg"
                    maxH="220px"
                    overflowY="auto"
                    _focus={{ outline: "none" }}
                  >
                    {filteredAssetAccounts.length > 0 && (
                      <>
                        <Box px={3} py={2} bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
                          <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                            Asset
                          </Text>
                        </Box>
                        {filteredAssetAccounts.map((acc, i) => (
                          <Box
                            key={acc.account_id}
                            px={4} py={3}
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            bg={formData.account_id === acc.account_id.toString() || i === highlightedAccountIndex ? highlightColor : "transparent"}
                            _hover={{ bg: highlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleInputChange("account_id", acc.account_id.toString());
                              setAccountSearch("");
                              setIsAccountOpen(false);
                              setHighlightedAccountIndex(-1);
                            }}
                          >
                            <Text fontSize="sm" fontWeight={formData.account_id === acc.account_id.toString() ? "semibold" : "normal"}>
                              {acc.name}
                            </Text>
                            {formData.account_id === acc.account_id.toString() && <Icon as={Check} boxSize={4} color="teal.500" />}
                          </Box>
                        ))}
                      </>
                    )}
                    {filteredLiabilityAccounts.length > 0 && (
                      <>
                        <Box
                          px={3} py={2} bg={cardBg}
                          borderBottom="1px solid" borderColor={borderColor}
                          borderTop={filteredAssetAccounts.length > 0 ? "1px solid" : undefined}
                          borderTopColor={borderColor}
                        >
                          <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                            Liability
                          </Text>
                        </Box>
                        {filteredLiabilityAccounts.map((acc, i) => {
                          const flatIndex = filteredAssetAccounts.length + i;
                          return (
                            <Box
                              key={acc.account_id}
                              px={4} py={3}
                              cursor="pointer"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              bg={formData.account_id === acc.account_id.toString() || flatIndex === highlightedAccountIndex ? highlightColor : "transparent"}
                              _hover={{ bg: highlightColor }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange("account_id", acc.account_id.toString());
                                setAccountSearch("");
                                setIsAccountOpen(false);
                                setHighlightedAccountIndex(-1);
                              }}
                            >
                              <Text fontSize="sm" fontWeight={formData.account_id === acc.account_id.toString() ? "semibold" : "normal"}>
                                {acc.name}
                              </Text>
                              {formData.account_id === acc.account_id.toString() && <Icon as={Check} boxSize={4} color="teal.500" />}
                            </Box>
                          );
                        })}
                      </>
                    )}
                    {!hasFilteredAccountResults && (
                      <Box px={4} py={5} textAlign="center">
                        <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                      </Box>
                    )}
                  </PopoverContent>
                </Popover>
              )}
              <FormErrorMessage>{errors.account_id}</FormErrorMessage>
              <FormHelperText>
                {type === "buy"
                  ? "Account to deduct funds from"
                  : "Account to receive funds"}
              </FormHelperText>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.transaction_date}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Calendar size={16} />
                  <Text>Date</Text>
                  <Icon as={Check} boxSize={3.5} color="teal.500" />
                </HStack>
              </FormLabel>
              <Box
                sx={{
                  ".react-datepicker-wrapper": {
                    width: "100%",
                  },
                  ".react-datepicker__input-container input": {
                    width: "100%",
                    height: "48px",
                    borderWidth: "2px",
                    borderColor: inputBorderColor,
                    borderRadius: "md",
                    bg: inputBg,
                    fontSize: "lg",
                    _hover: { borderColor: "teal.300" },
                    _focus: {
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    },
                  },
                }}
              >
                <ChakraDatePicker
                  selected={formData.transaction_date}
                  onChange={(date: Date | null) => {
                    if (date) {
                      handleInputChange("transaction_date", date);
                    }
                  }}
                  shouldCloseOnSelect={true}
                />
              </Box>
              <FormErrorMessage>{errors.transaction_date}</FormErrorMessage>
              <FormHelperText>Transaction date</FormHelperText>
            </FormControl>
          </Stack>

          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.other_charges}>
               <FormLabel fontWeight="semibold" mb={2}>
                 <HStack spacing={2}>
                   <DollarSign size={16} />
                   <Text>Other Charges</Text>
                 </HStack>
               </FormLabel>
               <InputGroup size="lg">
                 <InputLeftAddon
                   bg={inputBorderColor}
                   borderWidth="2px"
                   borderColor={inputBorderColor}
                   color={addonColor}
                   fontWeight="semibold"
                 >
                  {currencySymbol || "₹"}
                </InputLeftAddon>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.other_charges}
                  onChange={(e) =>
                    handleInputChange("other_charges", e.target.value)
                  }
                  placeholder="0.00"
                  min={0}
                  bg={inputBg}
                  borderColor={inputBorderColor}
                  borderWidth="2px"
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                />
              </InputGroup>
              <FormErrorMessage>{errors.other_charges}</FormErrorMessage>
              <FormHelperText>
                Stamp duty, transaction fees, etc.
              </FormHelperText>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.expense_category_id}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <FileText size={16} />
                  <Text>Expense Category</Text>
                </HStack>
              </FormLabel>
              {categoriesLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" color="teal.500" />
                  <Text fontSize="sm" color={helperTextColor}>
                    Loading categories...
                  </Text>
                </HStack>
              ) : (
                <Popover
                  isOpen={isCategoryOpen}
                  onClose={() => { setIsCategoryOpen(false); setHighlightedCategoryIndex(-1); }}
                  matchWidth
                  placement="bottom-start"
                  autoFocus={false}
                  returnFocusOnClose={false}
                >
                  <PopoverTrigger>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none" height="100%">
                        <Icon as={Search} boxSize={4} color={helperTextColor} />
                      </InputLeftElement>
                      <Input
                        value={isCategoryOpen ? categorySearch : (selectedCategory?.name ?? "")}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          handleInputChange("expense_category_id", "");
                          setHighlightedCategoryIndex(-1);
                          setIsCategoryOpen(true);
                        }}
                        onFocus={() => {
                          setCategorySearch("");
                          setHighlightedCategoryIndex(-1);
                          setIsCategoryOpen(true);
                        }}
                        onKeyDown={handleCategoryKeyDown}
                        placeholder="Search categories (optional)"
                        borderWidth="2px"
                        borderColor={formData.expense_category_id ? "teal.400" : inputBorderColor}
                        bg={inputBg}
                        borderRadius="md"
                        _hover={{ borderColor: "teal.300" }}
                        _focus={{
                          borderColor: focusBorderColor,
                          boxShadow: `0 0 0 1px ${focusBorderColor}`,
                        }}
                        autoComplete="off"
                      />
                      <InputRightElement height="100%" pr={1}>
                        {formData.expense_category_id ? (
                          <Icon
                            as={X}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => {
                              handleInputChange("expense_category_id", "");
                              setCategorySearch("");
                              setIsCategoryOpen(false);
                              setHighlightedCategoryIndex(-1);
                            }}
                          />
                        ) : (
                          <Icon
                            as={ChevronDown}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                          />
                        )}
                      </InputRightElement>
                    </InputGroup>
                  </PopoverTrigger>
                  <PopoverContent
                    p={0}
                    bg={bgColor}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    boxShadow="lg"
                    maxH="220px"
                    overflowY="auto"
                    _focus={{ outline: "none" }}
                  >
                    {filteredCategories.map((cat: any, i: number) => (
                      <Box
                        key={cat.category_id}
                        px={4} py={3}
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        bg={formData.expense_category_id === cat.category_id.toString() || i === highlightedCategoryIndex ? highlightColor : "transparent"}
                        _hover={{ bg: highlightColor }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleInputChange("expense_category_id", cat.category_id.toString());
                          setCategorySearch("");
                          setIsCategoryOpen(false);
                          setHighlightedCategoryIndex(-1);
                        }}
                      >
                        <Text fontSize="sm" fontWeight={formData.expense_category_id === cat.category_id.toString() ? "semibold" : "normal"}>
                          {cat.name}
                        </Text>
                        {formData.expense_category_id === cat.category_id.toString() && <Icon as={Check} boxSize={4} color="teal.500" />}
                      </Box>
                    ))}
                    {!hasFilteredCategoryResults && (
                      <Box px={4} py={5} textAlign="center">
                        <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                      </Box>
                    )}
                  </PopoverContent>
                </Popover>
              )}
              <FormErrorMessage>{errors.expense_category_id}</FormErrorMessage>
              <FormHelperText>Required if other charges &gt; 0</FormHelperText>
            </FormControl>
          </Stack>

          <FormControl>
            <FormLabel fontWeight="semibold" mb={2}>
              <HStack spacing={2}>
                <FileText size={16} />
                <Text>Notes (Optional)</Text>
              </HStack>
            </FormLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any notes about this transaction..."
              rows={3}
              size="lg"
              bg={inputBg}
              borderColor={inputBorderColor}
              borderWidth="2px"
              borderRadius="md"
              _hover={{ borderColor: "teal.300" }}
              _focus={{
                borderColor: focusBorderColor,
                boxShadow: `0 0 0 1px ${focusBorderColor}`,
              }}
              resize="vertical"
            />
            <FormHelperText>
              Additional details about this {type} transaction
            </FormHelperText>
          </FormControl>
        </VStack>
      </Box>

      {/* Error Display */}
      {errors.general && (
        <Alert
          status="error"
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
        >
          <AlertIcon />
          <Box>
            <AlertTitle fontWeight="bold">Transaction Failed!</AlertTitle>
            <AlertDescription>{errors.general}</AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Mobile-only action buttons that stay at bottom */}
      <Box display={{ base: "block", sm: "none" }}>
        <Button
          onClick={() => handleSubmit()}
          colorScheme={type === "buy" ? "brand" : "red"}
          size="lg"
          width="100%"
          mb={3}
          borderRadius="lg"
          fontWeight="bold"
          isLoading={transactionMutation.isPending}
          loadingText={`Processing ${type === "buy" ? "Purchase" : "Sale"}...`}
          isDisabled={!isFormValid()}
        >
          {type === "buy" ? "Buy Units" : "Sell Units"}
        </Button>

        <Button
          variant="ghost"
          colorScheme="gray"
          onClick={handleClose}
          size="lg"
          width="100%"
          borderRadius="lg"
          isDisabled={transactionMutation.isPending}
        >
          Cancel
        </Button>
      </Box>
    </VStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={handleClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius={{ base: 0, sm: "xl" }}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: 4 }}
        my={{ base: 0, sm: "auto" }}
        maxHeight={{ base: "100%", md: "90vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Gradient accent line */}
        <Box
          h="3px"
          bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
        />
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={Coins} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <HStack spacing={3} mb={1} align="center">
                <Text
                  fontSize="lg"
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  color={modalTitleColor}
                >
                  {fund ? fund.name : "Mutual Fund Transaction"}
                </Text>
                {fund && (
                  <Badge
                    colorScheme="brand"
                    variant="subtle"
                    fontSize="sm"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                  >
                    {fund.amc?.name}
                  </Badge>
                )}
              </HStack>
              <Text
                fontSize="sm"
                color={modalSubtitleColor}
              >
                {tabIndex === 0 ? "Buy units" : "Sell units"}
              </Text>
            </Box>
          </HStack>
        </Box>

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          display="flex"
          flexDirection="column"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <Box
            onKeyDown={(e) => {
              if (e.key === "Enter" && !transactionMutation.isPending) {
                if (isAccountOpen || isCategoryOpen) return;
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          >
            {/* Sliding pill Buy / Sell toggle */}
            <Box
              position="relative"
              display="flex"
              bg={cardBg}
              borderRadius="full"
              border="2px solid"
              borderColor={inputBorderColor}
              p="1"
              overflow="hidden"
              mb={6}
            >
              <motion.div
                animate={{
                  x: tabIndex === 1 ? "100%" : "0%",
                  background: tabIndex === 0 ? "#319795" : "#FC8181",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                style={{
                  position: "absolute",
                  top: "4px",
                  left: "4px",
                  width: "calc(50% - 4px)",
                  height: "calc(100% - 8px)",
                  borderRadius: "9999px",
                  zIndex: 0,
                }}
              />
              <Button
                flex={1}
                variant="unstyled"
                position="relative"
                zIndex={1}
                onClick={() => setTabIndex(0)}
                color={tabIndex === 0 ? "white" : tabUnselectedColor}
                fontWeight="semibold"
                fontSize="sm"
                height="40px"
                borderRadius="full"
                transition="color 0.2s"
                _hover={{}}
                _active={{}}
              >
                <HStack spacing={2} justify="center">
                  <TrendingUp size={16} />
                  <Text>Buy</Text>
                </HStack>
              </Button>
              <Button
                flex={1}
                variant="unstyled"
                position="relative"
                zIndex={1}
                onClick={() => { if (!(fund ? totalUnits <= 0 : false)) setTabIndex(1); }}
                color={tabIndex === 1 ? "white" : tabUnselectedColor}
                fontWeight="semibold"
                fontSize="sm"
                height="40px"
                borderRadius="full"
                transition="color 0.2s"
                opacity={fund && totalUnits <= 0 ? 0.4 : 1}
                cursor={fund && totalUnits <= 0 ? "not-allowed" : "pointer"}
                _hover={{}}
                _active={{}}
              >
                <HStack spacing={2} justify="center">
                  <TrendingDown size={16} />
                  <Text>Sell</Text>
                </HStack>
              </Button>
            </Box>

            {tabIndex === 0 ? renderForm("buy") : renderForm("sell")}
          </Box>
        </ModalBody>

        {/* Desktop-only footer */}
        <ModalFooter
          display={{ base: "none", sm: "flex" }}
          px={8}
          py={6}
          bg={footerBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            onClick={() => handleSubmit()}
            colorScheme={currentType === "buy" ? "brand" : "red"}
            mr={3}
            px={8}
            py={3}
            borderRadius="lg"
            fontWeight="bold"
            isLoading={transactionMutation.isPending}
            loadingText={`Processing ${currentType === "buy" ? "Purchase" : "Sale"}...`}
            isDisabled={!isFormValid()}
          >
            {currentType === "buy" ? "Buy Units" : "Sell Units"}
          </Button>

          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={handleClose}
            isDisabled={transactionMutation.isPending}
            px={6}
            py={3}
            borderRadius="lg"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BuySellMfModal;
