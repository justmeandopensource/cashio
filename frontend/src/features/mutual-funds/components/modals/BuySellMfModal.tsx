import React, { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  InputGroup,
  InputLeftAddon,
  HStack,
  Text,
  Badge,
  Box,
  Stack,
  Spinner,
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
} from "lucide-react";
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
  is_group: boolean;
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
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
   const focusBorderColor = useColorModeValue("teal.500", "teal.300");
   const addonColor = useColorModeValue("gray.600", "gray.200");
   const buttonBorderColor = useColorModeValue("gray.300", "gray.600");
   const buttonColor = useColorModeValue("gray.600", "gray.200");
   const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
   const buttonHoverBorderColor = useColorModeValue("gray.400", "gray.500");
   const tabBuyHoverBg = useColorModeValue("teal.50", "teal.700");
   const tabSellHoverBg = useColorModeValue("red.50", "red.700");

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
    }
  }, [isOpen, fund]);

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
        borderRadius="md"
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack spacing={5} align="stretch">
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.units}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Coins size={16} />
                  <Text>
                    Units to {type}{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
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
                   <Text>
                      Amount{" "}
                     <Text as="span" color="red.500">
                       *
                     </Text>
                   </Text>
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
                  <Text>
                    {type === "buy" ? "Source Account" : "Destination Account"}{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                </HStack>
              </FormLabel>
              {accountsLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.500">
                    Loading accounts...
                  </Text>
                </HStack>
              ) : (
                <Select
                  value={formData.account_id}
                  onChange={(e) =>
                    handleInputChange("account_id", e.target.value)
                  }
                  placeholder="Select account"
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
                >
                  <optgroup label="Asset Accounts">
                    {accounts
                      ?.filter((account) => account.type === "asset")
                      .map((account) => (
                        <option
                          key={account.account_id}
                          value={account.account_id.toString()}
                        >
                          {account.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Liability Accounts">
                    {accounts
                      ?.filter((account) => account.type === "liability")
                      .map((account) => (
                        <option
                          key={account.account_id}
                          value={account.account_id.toString()}
                        >
                          {account.name}
                        </option>
                      ))}
                  </optgroup>
                </Select>
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
                  <Text>
                    Date{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
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
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.500">
                    Loading categories...
                  </Text>
                </HStack>
              ) : (
                <Select
                  value={formData.expense_category_id}
                  onChange={(e) =>
                    handleInputChange("expense_category_id", e.target.value)
                  }
                  placeholder="Select category (optional)"
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
                >
                  {expenseCategories?.map((category: any) => (
                    <option
                      key={category.category_id}
                      value={category.category_id.toString()}
                    >
                      {category.name}
                    </option>
                  ))}
                </Select>
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
          bg={type === "buy" ? "teal.500" : "red.400"}
          color="white"
          _hover={{
            bg: type === "buy" ? "teal.600" : "red.500",
            transform: transactionMutation.isPending
              ? "none"
              : "translateY(-2px)",
            boxShadow: transactionMutation.isPending ? "none" : "lg",
          }}
          size="lg"
          width="100%"
          mb={3}
          borderRadius="md"
          isLoading={transactionMutation.isPending}
          loadingText={`Processing ${type === "buy" ? "Purchase" : "Sale"}...`}
          isDisabled={!isFormValid()}
          leftIcon={
            type === "buy" ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )
          }
          transition="all 0.2s"
        >
          {type === "buy" ? "Buy Units" : "Sell Units"}
        </Button>

         <Button
           variant="outline"
           onClick={handleClose}
           size="lg"
           width="100%"
           borderRadius="md"
           borderWidth="2px"
           borderColor={buttonBorderColor}
           color={buttonColor}
           _hover={{
             bg: buttonHoverBg,
             borderColor: buttonHoverBorderColor,
           }}
          isDisabled={transactionMutation.isPending}
          transition="all 0.2s"
        >
          Cancel
        </Button>
      </Box>
    </VStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius={{ base: 0, sm: "md" }}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: 4 }}
        my={{ base: 0, sm: "auto" }}
        maxHeight={{ base: "100%", md: "95vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Modern gradient header */}
        <Box
          bgGradient="linear(135deg, teal.400, teal.600)"
          color="white"
          px={{ base: 4, sm: 8 }}
          py={{ base: 6, sm: 6 }}
          pt={{ base: 12, sm: 6 }}
          position="relative"
        >
          <HStack spacing={{ base: 3, sm: 4 }} align="center">
            <Box
              p={{ base: 2, sm: 3 }}
              bg="whiteAlpha.200"
              borderRadius="md"
              backdropFilter="blur(10px)"
            >
              <Coins size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <HStack spacing={3} mb={2} align="center">
                <Text
                  fontSize={{ base: "xl", sm: "2xl" }}
                  fontWeight="bold"
                  lineHeight="1.2"
                >
                  {fund ? fund.name : "Mutual Fund Transaction"}
                </Text>
                {fund && (
                  <Badge
                    bg="whiteAlpha.200"
                    color="white"
                    fontSize="sm"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {fund.amc?.name}
                  </Badge>
                )}
              </HStack>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
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
          overflow="auto"
          display="flex"
          flexDirection="column"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <Box
            onKeyDown={(e) => {
              if (e.key === "Enter" && !transactionMutation.isPending) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          >
            <Tabs
              isFitted
              variant="enclosed"
              index={tabIndex}
              onChange={setTabIndex}
              colorScheme="teal"
            >
              <TabList
                borderRadius="md"
                bg={cardBg}
                border="2px solid"
                borderColor={inputBorderColor}
                mb={6}
              >
                 <Tab
                   _selected={{
                     bg: "teal.500",
                     color: "white",
                     borderColor: "teal.500",
                     fontWeight: "bold",
                   }}
                                   _hover={{
                                     bg: tabBuyHoverBg,
                                     _selected: { bg: "teal.400" },                  }}
                  borderRadius="sm"
                  fontSize="md"
                  py={3}
                  transition="all 0.2s"
                >
                  <HStack spacing={2}>
                    <TrendingUp size={18} />
                    <Text>Buy</Text>
                  </HStack>
                </Tab>
                 <Tab
                   _selected={{
                     bg: "red.400",
                     color: "white",
                     borderColor: "red.400",
                     fontWeight: "bold",
                   }}
                                   _hover={{
                                     bg: tabSellHoverBg,
                                     _selected: { bg: "red.300" },                  }}
                  borderRadius="sm"
                  fontSize="md"
                  py={3}
                  transition="all 0.2s"
                  isDisabled={fund ? totalUnits <= 0 : false}
                >
                  <HStack spacing={2}>
                    <TrendingDown size={18} />
                    <Text>Sell</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>{renderForm("buy")}</TabPanel>
                <TabPanel p={0}>{renderForm("sell")}</TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </ModalBody>

        {/* Desktop-only footer */}
        <ModalFooter
          display={{ base: "none", sm: "flex" }}
          px={8}
          py={6}
          bg={cardBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            onClick={() => handleSubmit()}
            bg={currentType === "buy" ? "teal.500" : "red.400"}
            color="white"
            _hover={{
              bg: currentType === "buy" ? "teal.600" : "red.500",
              transform: transactionMutation.isPending
                ? "none"
                : "translateY(-2px)",
              boxShadow: transactionMutation.isPending ? "none" : "lg",
            }}
            mr={3}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={transactionMutation.isPending}
            loadingText={`Processing ${currentType === "buy" ? "Purchase" : "Sale"}...`}
            isDisabled={!isFormValid()}
            leftIcon={
              currentType === "buy" ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )
            }
            transition="all 0.2s"
          >
            {currentType === "buy" ? "Buy Units" : "Sell Units"}
          </Button>

           <Button
             variant="outline"
             onClick={handleClose}
             isDisabled={transactionMutation.isPending}
             px={6}
             py={3}
             borderRadius="md"
             borderWidth="2px"
             borderColor={buttonBorderColor}
             color={buttonColor}
             _hover={{
               bg: buttonHoverBg,
               borderColor: buttonHoverBorderColor,
             }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BuySellMfModal;
