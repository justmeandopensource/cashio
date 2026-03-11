import React, { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Text,
  VStack,
  HStack,
  useToast,
  Box,
  useColorModeValue,
  InputGroup,
  InputLeftAddon,
  Stack,
  FormHelperText,
} from "@chakra-ui/react";
import { ArrowRightLeft, Check, X } from "lucide-react";
import { AxiosError } from "axios";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import api from "@/lib/api";
import FormNotes from "../shared/FormNotes";
import useLedgerStore from "../shared/store";
import { toastDefaults } from "../shared/utils";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";

interface Ledger {
  ledger_id: string;
  name: string;
  currency_symbol: string;
}

interface Account {
  account_id: string;
  name: string;
  type: string;
  net_balance?: number;
  is_group: boolean;
}

interface Transaction {
  transaction_id: string;
  date: string;
  category_id?: string;
  category_name: string;
  account_id?: string;
  account_name?: string;
  is_split: boolean;
  is_transfer: boolean;
  notes?: string;
  credit: number;
  debit: number;
  transfer_id?: string;
  splits?: any[];
  tags?: any[];
}

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  onTransferCompleted: () => void;
  initialData?: Transaction;
}

const TransferFundsModal: React.FC<TransferFundsModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onTransferCompleted,
  initialData,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [fromAccountId, setFromAccountId] = useState<string>(
    accountId?.toString() || "",
  );
  const [toAccountId, setToAccountId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isDifferentLedger, setIsDifferentLedger] = useState<boolean>(false);
  const [destinationLedgerId, setDestinationLedgerId] = useState<string>("");
  const [destinationCurrencySymbol, setDestinationCurrencySymbol] =
    useState<string>("");
  const [destinationAmount, setDestinationAmount] = useState<string>("");
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [destinationAccounts, setDestinationAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<number>(0);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { ledgerId, currencySymbol } = useLedgerStore();

  function formatCurrency(amount: number) {
    const locale = currencySymbol === "₹" ? "en-IN" : "en-US";
    return `${currencySymbol}${Math.abs(amount).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Modern theme colors - matching CreateTransactionModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
   const focusBorderColor = useColorModeValue("teal.500", "teal.300");
   const highlightColor = useColorModeValue("teal.50", "teal.900");
   const helperTextColor = useColorModeValue("gray.500", "gray.400");
   const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
   const addonColor = useColorModeValue("gray.600", "gray.200");
   const tealTextColor = useColorModeValue("teal.700", "teal.300");
   const buttonBorderColor = useColorModeValue("gray.300", "gray.600");
   const buttonColor = useColorModeValue("gray.600", "gray.200");
   const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
   const buttonHoverBorderColor = useColorModeValue("gray.400", "gray.500");

  const resetForm = useCallback(() => {
    setDate(new Date());
    setFromAccountId(accountId?.toString() || "");
    setToAccountId("");
    setAmount("");
    setNotes("");
    setIsDifferentLedger(false);
    setDestinationLedgerId("");
    setDestinationAmount("");
  }, [accountId]);

  const fetchLedgers = useCallback(async () => {
    try {
      const response = await api.get<Ledger[]>("/ledger/list");
      setLedgers(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description:
            axiosError.response?.data?.detail || "Failed to fetch ledgers.",
          status: "error",
          ...toastDefaults,
        });
      }
    }
  }, [toast]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get<Account[]>(
        `/ledger/${ledgerId}/accounts`,
      );
      setAccounts(response.data.filter(a => !a.is_group));
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description:
            axiosError.response?.data?.detail || "Failed to fetch accounts.",
          status: "error",
          ...toastDefaults,
        });
      }
    }
  }, [ledgerId, toast]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(new Date());
        setFromAccountId(initialData.account_id || "");
        setToAccountId("");
        setAmount(
          initialData.debit > 0
            ? initialData.debit.toString()
            : initialData.credit.toString(),
        );
        setNotes(initialData.notes || "");
        setIsDifferentLedger(false);
        setDestinationLedgerId("");
        setDestinationAmount("");
      } else {
        resetForm();
      }
      fetchLedgers();
      fetchAccounts();
    } else {
      // Clear state when modal is closed
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setNotes("");
      setIsDifferentLedger(false);
      setDestinationLedgerId("");
      setDestinationAmount("");
    }
  }, [isOpen, resetForm, fetchLedgers, fetchAccounts, initialData]);

  const fetchDestinationAccounts = useCallback(
    async (ledgerId: string) => {
      try {
        const response = await api.get<Account[]>(
          `/ledger/${ledgerId}/accounts`,
        );
        setDestinationAccounts(response.data.filter(a => !a.is_group));
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status !== 401) {
          toast({
            description:
              axiosError.response?.data?.detail || "Failed to fetch accounts.",
            status: "error",
            ...toastDefaults,
          });
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    if (isDifferentLedger && destinationLedgerId) {
      fetchDestinationAccounts(destinationLedgerId);
    }
  }, [isDifferentLedger, destinationLedgerId, fetchDestinationAccounts]);

  useEffect(() => {
    if (fromAccountId) {
      api.get(`/ledger/${ledgerId}/account/${fromAccountId}`)
        .then(response => {
          setSelectedAccountBalance(response.data.net_balance || 0);
        })
        .catch(() => setSelectedAccountBalance(0));
    } else {
      setSelectedAccountBalance(0);
    }
  }, [fromAccountId, ledgerId]);

  // Filter out the current ledger from the "destination ledger" dropdown
  const getFilteredLedgers = (ledgers: Ledger[]) => {
    return ledgers.filter((ledger) => ledger.ledger_id != ledgerId);
  };

  // Filter out the current account from the "to account" dropdown
  const getFilteredAccounts = (accounts: Account[]) => {
    return accounts.filter((account) => account.account_id != fromAccountId);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        source_account_id: fromAccountId,
        destination_account_id: toAccountId,
        date: date.toISOString(),
        source_amount: parseFloat(amount),
        notes: notes || "Fund Transfer",
        destination_amount: destinationAmount
          ? parseFloat(destinationAmount)
          : null,
      };

      await api.post(`/ledger/${ledgerId}/transaction/transfer`, payload);

      // Invalidate accounts queries for both source and destination ledgers
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });

      toast({
        description: "Transfer completed successfully.",
        status: "success",
        ...toastDefaults,
      });

      onClose();
      onTransferCompleted();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description: axiosError.response?.data?.detail || "Transfer failed",
          status: "error",
          ...toastDefaults,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
        maxHeight={{ base: "100%", md: "90vh" }}
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
              <ArrowRightLeft size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Box
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Transfer Funds
              </Box>
              <Box
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
              >
                Move money between accounts
              </Box>
            </Box>
          </HStack>
        </Box>

         <ModalBody
           px={{ base: 4, sm: 8 }}
           py={{ base: 4, sm: 6 }}
           flex="1"
           display="flex"
           flexDirection="column"
           overflow="auto"
           justifyContent={{ base: "space-between", sm: "flex-start" }}
         >
            <form id="transfer-funds-form" onSubmit={handleSubmit}>
              <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
             {/* From Account Selection (only shown if no accountId) */}
             {!accountId && (
               <Box
                 bg={cardBg}
                 p={{ base: 4, sm: 6 }}
                 borderRadius="md"
                 border="1px solid"
                 borderColor={borderColor}
               >
                 <FormControl isRequired>
                   <FormLabel fontWeight="semibold" mb={2}>
                     From Account
                   </FormLabel>
                   <Select
                     value={fromAccountId}
                     onChange={(e) => setFromAccountId(e.target.value)}
                     placeholder="Select source account"
                     borderWidth="2px"
                     borderColor={inputBorderColor}
                     bg={inputBg}
                     size="lg"
                     borderRadius="md"
                     _hover={{ borderColor: "teal.300" }}
                     _focus={{
                       borderColor: focusBorderColor,
                       boxShadow: `0 0 0 1px ${focusBorderColor}`,
                     }}
                     data-testid="transferfundsmodal-from-account-dropdown"
                     autoFocus
                   >
                     <optgroup label="Asset Accounts">
                       {accounts
                         .filter((account) => account.type === "asset")
                         .map((account) => (
                           <option
                             key={account.account_id}
                             value={account.account_id}
                           >
                             {account.name}
                           </option>
                         ))}
                     </optgroup>
                     <optgroup label="Liability Accounts">
                       {accounts
                         .filter((account) => account.type === "liability")
                         .map((account) => (
                           <option
                             key={account.account_id}
                             value={account.account_id}
                           >
                             {account.name}
                           </option>
                         ))}
                     </optgroup>
                   </Select>
                    <FormHelperText mt={2} color={helperTextColor}>
                      Select the account to transfer funds from
                    </FormHelperText>
                 </FormControl>
               </Box>
             )}

             {/* Basic Info Card */}
             <Box
               bg={cardBg}
               p={{ base: 4, sm: 6 }}
               borderRadius="md"
               border="1px solid"
               borderColor={borderColor}
             >
               <VStack spacing={5} align="stretch">
                 <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                   {/* Date Picker */}
                   <FormControl flex="1" isRequired>
                     <FormLabel fontWeight="semibold" mb={2}>
                       Date
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
                         selected={date}
                         onChange={(date: Date | null) => {
                           if (date) {
                             setDate(date);
                           }
                         }}
                         shouldCloseOnSelect={true}
                         data-testid="transferfundsmodal-date-picker"
                       />
                     </Box>
                   </FormControl>

                   {/* Amount Input */}
                   <FormControl flex="1" isRequired>
                     <FormLabel fontWeight="semibold" mb={2}>
                       Amount
                     </FormLabel>
                     <InputGroup size="lg">
                        <InputLeftAddon
                          bg={inputBorderColor}
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          color={addonColor}
                          fontWeight="semibold"
                        >
                         {currencySymbol}
                       </InputLeftAddon>
                       <Input
                         type="text"
                         inputMode="decimal"
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                         onKeyDown={(e) => handleNumericInput(e, amount)}
                         onPaste={(e) => handleNumericPaste(e, setAmount)}
                         placeholder="0.00"
                         borderWidth="2px"
                         borderColor={inputBorderColor}
                         bg={inputBg}
                         borderRadius="md"
                         _hover={{ borderColor: "teal.300" }}
                         _focus={{
                           borderColor: focusBorderColor,
                           boxShadow: `0 0 0 1px ${focusBorderColor}`,
                         }}
                          autoFocus={!!accountId}
                       />
                     </InputGroup>
                      <FormHelperText mt={2} color={helperTextColor}>
                        {fromAccountId
                          ? `Available funds: ${formatCurrency(selectedAccountBalance)}`
                          : "Enter the transfer amount"}
                      </FormHelperText>
                   </FormControl>
                 </Stack>
               </VStack>
             </Box>

            {/* Different Ledger Toggle Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <HStack justifyContent="space-between" align="center">
                <Box>
                  <Text fontWeight="semibold" mb={1}>
                    Transfer to Different Ledger
                  </Text>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    Transfer amount
                  </Text>
                </Box>
                <Switch
                  colorScheme="teal"
                  size="lg"
                  isChecked={isDifferentLedger}
                  onChange={(e) => setIsDifferentLedger(e.target.checked)}
                />
              </HStack>
            </Box>

            {/* Destination Section Card */}
            <Box
              bg={highlightColor}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="2px solid"
              borderColor="teal.200"
            >
              <VStack spacing={5} align="stretch">
                <Text fontWeight="bold" color={tealTextColor} mb={2}>
                  Transfer Summary
                </Text>

                {/* Destination Ledger (if different ledger) */}
                {isDifferentLedger && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" mb={2}>
                      Destination Ledger
                    </FormLabel>
                    <Select
                      value={destinationLedgerId}
                      onChange={(e) => {
                        const selectedLedger = ledgers.find(
                          (ledger) => ledger.ledger_id == e.target.value,
                        );
                        setDestinationLedgerId(e.target.value);
                        if (selectedLedger) {
                          setDestinationCurrencySymbol(
                            selectedLedger.currency_symbol,
                          );
                        }
                        setToAccountId("");
                      }}
                      placeholder="Select destination ledger"
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      size="lg"
                      borderRadius="md"
                      _hover={{ borderColor: "teal.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      data-testid="transferfundsmodal-to-ledger-dropdown"
                    >
                      {getFilteredLedgers(ledgers).map((ledger) => (
                        <option key={ledger.ledger_id} value={ledger.ledger_id}>
                          {ledger.name}
                        </option>
                      ))}
                    </Select>
                     <FormHelperText mt={2} color={helperTextColor}>
                       Choose the destination ledger
                     </FormHelperText>
                  </FormControl>
                )}

                {/* To Account Selection */}
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2}>
                    To Account
                  </FormLabel>
                  <Select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    placeholder="Select destination account"
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    size="lg"
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    data-testid="transferfundsmodal-to-account-dropdown"
                  >
                    <optgroup label="Asset Accounts">
                      {getFilteredAccounts(
                        isDifferentLedger ? destinationAccounts : accounts,
                      )
                        .filter((account) => account.type === "asset")
                        .map((account) => (
                          <option
                            key={account.account_id}
                            value={account.account_id}
                          >
                            {account.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Liability Accounts">
                      {getFilteredAccounts(
                        isDifferentLedger ? destinationAccounts : accounts,
                      )
                        .filter((account) => account.type === "liability")
                        .map((account) => (
                          <option
                            key={account.account_id}
                            value={account.account_id}
                          >
                            {account.name}
                          </option>
                        ))}
                    </optgroup>
                  </Select>
                      <FormHelperText mt={2} color={helperTextColor}>
                        Select the account to transfer funds to
                      </FormHelperText>
                </FormControl>

                {/* Destination Amount (if different ledger) */}
                {isDifferentLedger && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" mb={2}>
                      Destination Amount
                    </FormLabel>
                    <InputGroup size="lg">
                       <InputLeftAddon
                         bg={inputBorderColor}
                         borderWidth="2px"
                         borderColor={inputBorderColor}
                         color={addonColor}
                         fontWeight="semibold"
                       >
                        {destinationCurrencySymbol || currencySymbol}
                      </InputLeftAddon>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={destinationAmount}
                        onChange={(e) => setDestinationAmount(e.target.value)}
                        onKeyDown={(e) =>
                          handleNumericInput(e, destinationAmount)
                        }
                        onPaste={(e) =>
                          handleNumericPaste(e, setDestinationAmount)
                        }
                        placeholder="0.00"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        bg={inputBg}
                        borderRadius="md"
                        _hover={{ borderColor: "teal.300" }}
                        _focus={{
                          borderColor: focusBorderColor,
                          boxShadow: `0 0 0 1px ${focusBorderColor}`,
                        }}
                      />
                    </InputGroup>
                     <FormHelperText mt={2} color={helperTextColor}>
                       Enter the amount to transfer
                     </FormHelperText>
                  </FormControl>
                )}
              </VStack>
            </Box>

            {/* Notes Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormNotes
                ledgerId={ledgerId as string}
                notes={notes}
                setNotes={setNotes}
                borderColor={inputBorderColor}
              />
             </Box>
           </VStack>
           </form>

           {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              type="submit"
              form="transfer-funds-form"
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={isLoading}
              loadingText="Transferring..."
              isDisabled={
                !fromAccountId ||
                !toAccountId ||
                !amount ||
                (isDifferentLedger &&
                  (!destinationLedgerId || !destinationAmount))
              }
              leftIcon={<Check />}
              _hover={{
                transform: isLoading ? "none" : "translateY(-2px)",
                boxShadow: isLoading ? "none" : "lg",
              }}
              transition="all 0.2s"
            >
              Complete Transfer
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="md"
              isDisabled={isLoading}
              leftIcon={<X />}
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
             type="submit"
             form="transfer-funds-form"
             colorScheme="teal"
             mr={3}
             px={8}
             py={3}
             borderRadius="md"
             isLoading={isLoading}
             loadingText="Transferring..."
             isDisabled={
               !fromAccountId ||
               !toAccountId ||
               !amount ||
               (isDifferentLedger &&
                 (!destinationLedgerId || !destinationAmount))
             }
             leftIcon={<Check />}
             _hover={{
               transform: isLoading ? "none" : "translateY(-2px)",
               boxShadow: isLoading ? "none" : "lg",
             }}
             transition="all 0.2s"
           >
             Complete Transfer
           </Button>
          <Button
            variant="outline"
            onClick={onClose}
            isDisabled={isLoading}
            leftIcon={<X />}
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

export default TransferFundsModal;
