import React, { useState, useEffect, useCallback, useRef } from "react";
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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Switch,
  Text,
  VStack,
  HStack,
  useToast,
  Box,
  useColorModeValue,
  Stack,
  FormHelperText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import FormSplits from "./FormSplits";
import FormNotes from "@/components/shared/FormNotes";
import FormStore from "@/components/shared/FormStore";
import FormLocation from "@/components/shared/FormLocation";
import FormTags from "@/components/shared/FormTags";
import useLedgerStore from "@/components/shared/store";
import { motion } from "framer-motion";
import { Plus, Check, X, Search, ChevronDown } from "lucide-react";
import { toastDefaults } from "@/components/shared/utils";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";

// Define interfaces for the props and state
interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  onTransactionAdded: () => void;
  initialData?: Transaction;
}

interface Category {
  category_id: string;
  name: string;
  type: string;
}

interface Account {
  account_id: string;
  name: string;
  type: string;
}

interface Split {
  amount: string;
  categoryId: string;
  notes?: string;
}

interface Tag {
  name: string;
}

interface Transaction {
  debit: number;
  credit: number;
  category_id?: string;
  notes?: string;
  store?: string;
  location?: string;
  account_id?: string;
  is_split: boolean;
  splits?: Split[];
  tags?: Tag[];
}

const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onTransactionAdded,
  initialData,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [store, setStore] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotesSuggestionsOpen, setIsNotesSuggestionsOpen] = useState<boolean>(false);
  const [isStoreSuggestionsOpen, setIsStoreSuggestionsOpen] = useState<boolean>(false);
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState<boolean>(false);
  const [isTagInputActive, setIsTagInputActive] = useState<boolean>(false);
  const [isSplitDropdownOpen, setIsSplitDropdownOpen] = useState<boolean>(false);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [highlightedAccountIndex, setHighlightedAccountIndex] = useState<number>(-1);
  const toast = useToast();

  const { ledgerId, currencySymbol } = useLedgerStore();

  // Modern theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
   const focusBorderColor = useColorModeValue("teal.500", "teal.300");
   const highlightColor = useColorModeValue("teal.50", "teal.900");
   const helperTextColor = useColorModeValue("gray.500", "gray.400");
   const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
   const buttonBorderColor = useColorModeValue("gray.300", "gray.600");
   const buttonColor = useColorModeValue("gray.600", "gray.200");
   const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
   const buttonHoverBorderColor = useColorModeValue("gray.400", "gray.500");
   const errorBg = useColorModeValue("red.50", "red.700");
   const successBg = useColorModeValue("teal.50", "teal.700");
  const heroExpenseBg = useColorModeValue("red.50", "red.900");
  const heroIncomeBg = useColorModeValue("teal.50", "teal.900");
  const heroExpenseBorder = useColorModeValue("red.200", "red.800");
  const heroIncomeBorder = useColorModeValue("teal.200", "teal.800");
  const heroExpenseColor = useColorModeValue("red.500", "red.300");
  const heroIncomeColor = useColorModeValue("teal.600", "teal.300");
  const heroExpensePlaceholder = useColorModeValue("red.300", "red.700");
  const heroIncomePlaceholder = useColorModeValue("teal.300", "teal.700");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

  const selectedCategory = categories.find((c) => c.category_id === categoryId);
  const filteredIncomeCategories = categories.filter(
    (c) => c.type === "income" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredExpenseCategories = categories.filter(
    (c) => c.type === "expense" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const hasFilteredResults =
    filteredIncomeCategories.length > 0 || filteredExpenseCategories.length > 0;
  const allFilteredCategories = [...filteredIncomeCategories, ...filteredExpenseCategories];

  const selectedAccount = accounts.find((a) => a.account_id === selectedAccountId);
  const filteredAssetAccounts = accounts.filter(
    (a) => a.type === "asset" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const filteredLiabilityAccounts = accounts.filter(
    (a) => a.type === "liability" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const hasFilteredAccountResults =
    filteredAssetAccounts.length > 0 || filteredLiabilityAccounts.length > 0;
  const allFilteredAccounts = [...filteredAssetAccounts, ...filteredLiabilityAccounts];

  const resetForm = () => {
    setDate(new Date());
    setType("expense");
    setCategoryId("");
    setNotes("");
    setStore("");
    setLocation("");
    setAmount("");
    setIsSplit(false);
    setSplits([]);
    setTags([]);
    setCategorySearch("");
    setIsCategoryOpen(false);
    setHighlightedIndex(-1);
    setSelectedAccountId("");
    setAccountSearch("");
    setIsAccountOpen(false);
    setHighlightedAccountIndex(-1);
    setIsNotesSuggestionsOpen(false);
    setIsStoreSuggestionsOpen(false);
    setIsLocationSuggestionsOpen(false);
    setIsTagInputActive(false);
  };

  // Fetch categories based on the transaction type
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<Category[]>(
        `/category/list?ignore_group=true`,
      );
      setCategories(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description:
            axiosError.response?.data?.detail || "Failed to fetch categories.",
          status: "error",
          ...toastDefaults,
        });
      }
    }
  }, [toast]);

  // Fetch accounts if no accountId is provided (from ledger page)
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get<Account[]>(
        `/ledger/${ledgerId}/accounts?ignore_group=true`,
      );
      setAccounts(response.data);
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
  }, [toast, ledgerId]);

  // Fetch categories when modal is opened
  // Fetch accounts if no accountId is provided
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(new Date()); // Set to current date for copied transaction
        setType(initialData.debit > 0 ? "expense" : "income");
        setCategoryId(initialData.category_id || "");
        setNotes(initialData.notes || "");
        setStore(initialData.store || "");
        setLocation(initialData.location || "");
        setAmount(
          initialData.debit > 0
            ? initialData.debit.toString()
            : initialData.credit.toString(),
        );
        setSelectedAccountId(initialData.account_id || "");
        setIsSplit(initialData.is_split);
        setSplits(initialData.splits || []);
        setTags(initialData.tags || []);
      } else {
        resetForm();
      }
      fetchCategories();
      if (!accountId) {
        fetchAccounts();
      }
    }
  }, [isOpen, accountId, fetchCategories, fetchAccounts, initialData]);

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isCategoryOpen) {
          setIsCategoryOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => (total === 0 ? -1 : (prev + 1) % total));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isCategoryOpen && total > 0) {
          setHighlightedIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
        }
        break;
      case "Enter":
        if (isCategoryOpen && highlightedIndex >= 0 && highlightedIndex < total) {
          e.preventDefault();
          const cat = allFilteredCategories[highlightedIndex];
          setCategoryId(cat.category_id);
          setCategorySearch("");
          setIsCategoryOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        setIsCategoryOpen(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        setIsCategoryOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleAccountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isAccountOpen) {
          setIsAccountOpen(true);
          setHighlightedAccountIndex(0);
        } else {
          setHighlightedAccountIndex((prev) => (total === 0 ? -1 : (prev + 1) % total));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isAccountOpen && total > 0) {
          setHighlightedAccountIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
        }
        break;
      case "Enter":
        if (isAccountOpen && highlightedAccountIndex >= 0 && highlightedAccountIndex < total) {
          e.preventDefault();
          const acc = allFilteredAccounts[highlightedAccountIndex];
          setSelectedAccountId(acc.account_id);
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

  // Handle split transaction toggle
  const handleSplitToggle = (isChecked: boolean) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        description: "Amount required before enabling split transactions.",
        status: "error",
        ...toastDefaults,
      });
      return;
    }

    setIsSplit(isChecked);

    if (isChecked) {
      // Initialize with the total amount
      setSplits([{ amount: amount, categoryId: "" }]);
    } else {
      // Clear splits when toggle is turned off
      setSplits([]);
    }
  };

  // Calculate remaining amount
  const calculateRemainingAmount = () => {
    const allocatedAmount = roundToTwoDecimals(
      splits.reduce((sum, split) => {
        return roundToTwoDecimals(
          sum + roundToTwoDecimals(parseFloat(split.amount) || 0),
        );
      }, 0),
    );

    return roundToTwoDecimals((parseFloat(amount) || 0) - allocatedAmount);
  };

  // Always points to latest handleSubmit — used in keyboard shortcut effect
  const handleSubmitRef = useRef<() => void>(() => {});

  // Handle form submission
  const handleSubmit = async () => {
    if (categories.length === 0) {
      toast({
        description: "No categories found. Please create categories first.",
        status: "error",
        ...toastDefaults,
      });
      return;
    }

    // Validate all splits have categories if split is enabled
    if (isSplit) {
      const invalidSplits = splits.filter(
        (split) => !split.categoryId && (parseFloat(split.amount) || 0) > 0,
      );
      if (invalidSplits.length > 0) {
        toast({
          description: "Please select a category for each split.",
          status: "error",
          ...toastDefaults,
        });
        return;
      }

      // Check if the total split amount matches the transaction amount
      const totalSplitAmount = splits.reduce(
        (sum, split) => sum + (parseFloat(split.amount) || 0),
        0,
      );

      if (Math.abs(totalSplitAmount - (parseFloat(amount) || 0)) > 0.01) {
        // Allow for small rounding differences
        toast({
          description:
            "The sum of split amounts must equal the total transaction amount.",
          status: "error",
          ...toastDefaults,
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        account_id: parseInt(accountId || selectedAccountId, 10),
        category_id: parseInt(categoryId, 10),
        type: type,
        date: date.toISOString(),
        notes: notes,
        store: store,
        location: location,
        credit: type === "income" ? parseFloat(amount) || 0 : 0,
        debit: type === "expense" ? parseFloat(amount) || 0 : 0,
        is_transfer: false,
        transfer_id: null,
        transfer_type: null,
        is_split: isSplit,
        splits: isSplit
          ? splits
              .filter((split) => (parseFloat(split.amount) || 0) > 0)
              .map((split) => ({
                credit: type === "income" ? parseFloat(split.amount) || 0 : 0,
                debit: type === "expense" ? parseFloat(split.amount) || 0 : 0,
                category_id: parseInt(split.categoryId, 10),
                notes: split.notes,
              }))
          : [],
        tags: tags.map((tag) => ({ name: tag.name })),
      };

      const endpoint =
        type === "income"
          ? `/ledger/${ledgerId}/transaction/income`
          : `/ledger/${ledgerId}/transaction/expense`;

      await api.post(endpoint, payload);

      toast({
        description: "Transaction added successfully.",
        status: "success",
        ...toastDefaults,
      });

      onClose();
      onTransactionAdded();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description:
            axiosError.response?.data?.detail || "Transaction failed",
          status: "error",
          ...toastDefaults,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update ref on every render so the keyboard effect never goes stale
  handleSubmitRef.current = handleSubmit;

  const isSaveDisabled =
    (isSplit && splits.some((split) => (parseFloat(split.amount) || 0) > 0 && !split.categoryId)) ||
    (!isSplit && (!categoryId || (accountId ? !accountId : !selectedAccountId))) ||
    !amount ||
    (isSplit && calculateRemainingAmount() !== 0) ||
    (isSplit && !accountId && !selectedAccountId);

  // Keyboard shortcuts: Enter to submit, Escape closes dropdowns before the modal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCategoryOpen) {
          e.stopPropagation();
          setIsCategoryOpen(false);
          setHighlightedIndex(-1);
          return;
        }
        if (isAccountOpen) {
          e.stopPropagation();
          setIsAccountOpen(false);
          setHighlightedAccountIndex(-1);
          return;
        }
        if (isNotesSuggestionsOpen || isStoreSuggestionsOpen || isLocationSuggestionsOpen || isSplitDropdownOpen) {
          // Let child components close their own suggestion dropdowns
          return;
        }
        // No overlays open — close the modal reliably regardless of focus
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        if (isCategoryOpen || isAccountOpen || isNotesSuggestionsOpen || isStoreSuggestionsOpen || isLocationSuggestionsOpen || isTagInputActive || isSplitDropdownOpen) return;
        if (isSaveDisabled || isLoading) return;
        e.preventDefault();
        handleSubmitRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, isCategoryOpen, isAccountOpen, isNotesSuggestionsOpen, isStoreSuggestionsOpen, isLocationSuggestionsOpen, isTagInputActive, isSplitDropdownOpen, isSaveDisabled, isLoading, onClose]);

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
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={Plus} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Box
                fontSize="lg"
                fontWeight="bold"
                color={modalTitleColor}
              >
                Add Transaction
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
              >
                Record your {type === "expense" ? "expense" : "income"}
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
          overflowY="auto"
          overflowX="hidden"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack
            spacing={{ base: 5, sm: 6 }}
            align="stretch"
            w="100%"
            sx={{ "& .chakra-form__required-indicator": { display: "none" } }}
          >
            {/* Transaction Type Toggle */}
            <Box
              position="relative"
              display="flex"
              bg={cardBg}
              borderRadius="full"
              border="2px solid"
              borderColor={inputBorderColor}
              p="1"
              overflow="hidden"
            >
              {/* Sliding pill indicator */}
              <motion.div
                animate={{
                  x: type === "income" ? "100%" : "0%",
                  background: type === "expense" ? "#FC8181" : "#319795",
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
                onClick={() => setType("expense")}
                color={type === "expense" ? "white" : buttonColor}
                fontWeight="semibold"
                fontSize="sm"
                height="40px"
                borderRadius="full"
                transition="color 0.2s"
                _hover={{}}
                _active={{}}
              >
                Expense
              </Button>
              <Button
                flex={1}
                variant="unstyled"
                position="relative"
                zIndex={1}
                onClick={() => setType("income")}
                color={type === "income" ? "white" : buttonColor}
                fontWeight="semibold"
                fontSize="sm"
                height="40px"
                borderRadius="full"
                transition="color 0.2s"
                _hover={{}}
                _active={{}}
              >
                Income
              </Button>
            </Box>

            {/* Hero Amount Section */}
            <Box
              bg={type === "expense" ? heroExpenseBg : heroIncomeBg}
              borderRadius="xl"
              p={{ base: 5, sm: 7 }}
              border="2px solid"
              borderColor={type === "expense" ? heroExpenseBorder : heroIncomeBorder}
              textAlign="center"
              sx={{ transition: "background-color 0.2s, border-color 0.2s" }}
            >
              <HStack justify="center" spacing={1.5} mb={3}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  color={type === "expense" ? heroExpenseColor : heroIncomeColor}
                  opacity={0.7}
                  sx={{ transition: "color 0.2s" }}
                >
                  {type === "expense" ? "Expense Amount" : "Income Amount"}
                </Text>
                {amount && parseFloat(amount) > 0 && (
                  <Icon
                    as={Check}
                    boxSize={3.5}
                    color={type === "expense" ? heroExpenseColor : heroIncomeColor}
                    opacity={0.8}
                    sx={{ transition: "color 0.2s" }}
                  />
                )}
              </HStack>
              <Box position="relative" width="100%" display="flex" alignItems="center">
                <Text
                  position="absolute"
                  left={4}
                  fontSize={{ base: "xl", sm: "2xl" }}
                  fontWeight="bold"
                  color={type === "expense" ? heroExpenseColor : heroIncomeColor}
                  lineHeight="1"
                  sx={{ transition: "color 0.2s" }}
                  userSelect="none"
                  pointerEvents="none"
                >
                  {currencySymbol}
                </Text>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => handleNumericInput(e, amount)}
                  onPaste={(e) => handleNumericPaste(e, setAmount)}
                  placeholder="0.00"
                  fontSize={{ base: "4xl", sm: "5xl" }}
                  fontWeight="bold"
                  color={type === "expense" ? heroExpenseColor : heroIncomeColor}
                  _placeholder={{
                    color: type === "expense"
                      ? heroExpensePlaceholder
                      : heroIncomePlaceholder,
                  }}
                  textAlign="center"
                  variant="unstyled"
                  autoFocus
                  width="100%"
                  sx={{ transition: "color 0.2s" }}
                  data-testid="createtransactionmodal-amount-input"
                />
              </Box>
            </Box>

            {/* Basic Info Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                {/* Date Picker */}
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                    Transaction date
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
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
                      data-testid="createtransactionmodal-date-picker"
                    />
                  </Box>
                </FormControl>

                {/* Account Dropdown (only shown if no accountId is provided) */}
                {!accountId && accounts.length > 0 && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                      Account
                      {selectedAccountId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                    </FormLabel>
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
                              setSelectedAccountId("");
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
                            borderColor={selectedAccountId ? "teal.400" : inputBorderColor}
                            bg={inputBg}
                            borderRadius="md"
                            _hover={{ borderColor: "teal.300" }}
                            _focus={{
                              borderColor: focusBorderColor,
                              boxShadow: `0 0 0 1px ${focusBorderColor}`,
                            }}
                            autoComplete="off"
                            data-testid="createtransactionmodal-account-dropdown"
                          />
                          <InputRightElement height="100%" pr={1}>
                            {selectedAccountId ? (
                              <Icon
                                as={X}
                                boxSize={4}
                                color={helperTextColor}
                                cursor="pointer"
                                onClick={() => {
                                  setSelectedAccountId("");
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
                                bg={selectedAccountId === acc.account_id || i === highlightedAccountIndex ? highlightColor : "transparent"}
                                _hover={{ bg: highlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSelectedAccountId(acc.account_id);
                                  setAccountSearch("");
                                  setIsAccountOpen(false);
                                  setHighlightedAccountIndex(-1);
                                }}
                              >
                                <Text fontSize="sm" fontWeight={selectedAccountId === acc.account_id ? "semibold" : "normal"}>
                                  {acc.name}
                                </Text>
                                {selectedAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                                  bg={selectedAccountId === acc.account_id || flatIndex === highlightedAccountIndex ? highlightColor : "transparent"}
                                  _hover={{ bg: highlightColor }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSelectedAccountId(acc.account_id);
                                    setAccountSearch("");
                                    setIsAccountOpen(false);
                                    setHighlightedAccountIndex(-1);
                                  }}
                                >
                                  <Text fontSize="sm" fontWeight={selectedAccountId === acc.account_id ? "semibold" : "normal"}>
                                    {acc.name}
                                  </Text>
                                  {selectedAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                    <FormHelperText mt={2} color={helperTextColor}>
                      Choose which account this transaction belongs to
                    </FormHelperText>
                  </FormControl>
                )}
              </VStack>
            </Box>

             {/* Split Toggle Card */}
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
                     Split Transaction
                   </Text>
                   <Text fontSize="sm" color={secondaryTextColor}>
                     Divide this transaction across multiple categories
                   </Text>
                 </Box>
                 <Switch
                   colorScheme="teal"
                   size="lg"
                   isChecked={isSplit}
                   onChange={(e) => handleSplitToggle(e.target.checked)}
                   isDisabled={!amount} // Disable if amount is not entered
                 />
               </HStack>
             </Box>

            {/* Category or Split Transaction Section */}
            {isSplit ? (
               <FormSplits
                 splits={splits}
                 calculateRemainingAmount={calculateRemainingAmount}
                 currencySymbol={currencySymbol as string}
                 amount={amount}
                 type={type}
                 categories={categories}
                 setSplits={setSplits}
                 borderColor={inputBorderColor}
                 bgColor={inputBg}
                 highlightColor={highlightColor}
                 buttonColorScheme="teal"
                 ledgerId={ledgerId as string}
                 onDropdownOpenChange={setIsSplitDropdownOpen}
               />
            ) : (
              /* Category Dropdown Card */
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                    Category
                    {categoryId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                  </FormLabel>
                  <Popover
                    isOpen={isCategoryOpen}
                    onClose={() => { setIsCategoryOpen(false); setHighlightedIndex(-1); }}
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
                            setCategoryId("");
                            setHighlightedIndex(-1);
                            setIsCategoryOpen(true);
                          }}
                          onFocus={() => {
                            setCategorySearch("");
                            setHighlightedIndex(-1);
                            setIsCategoryOpen(true);
                          }}
                          onKeyDown={handleCategoryKeyDown}
                          placeholder="Search categories..."
                          borderWidth="2px"
                          borderColor={categoryId ? "teal.400" : inputBorderColor}
                          bg={inputBg}
                          borderRadius="md"
                          _hover={{ borderColor: "teal.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}
                          autoComplete="off"
                          data-testid="createtransactionmodal-category-dropdown"
                        />
                        <InputRightElement height="100%" pr={1}>
                          {categoryId ? (
                            <Icon
                              as={X}
                              boxSize={4}
                              color={helperTextColor}
                              cursor="pointer"
                              onClick={() => {
                                setCategoryId("");
                                setCategorySearch("");
                                setIsCategoryOpen(false);
                                setHighlightedIndex(-1);
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
                      {filteredIncomeCategories.length > 0 && (
                        <>
                          <Box px={3} py={2} bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
                            <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                              Income
                            </Text>
                          </Box>
                          {filteredIncomeCategories.map((cat, i) => (
                            <Box
                              key={cat.category_id}
                              px={4} py={3}
                              cursor="pointer"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              bg={categoryId === cat.category_id || i === highlightedIndex ? highlightColor : "transparent"}
                              _hover={{ bg: highlightColor }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setCategoryId(cat.category_id);
                                setCategorySearch("");
                                setIsCategoryOpen(false);
                                setHighlightedIndex(-1);
                              }}
                            >
                              <Text fontSize="sm" fontWeight={categoryId === cat.category_id ? "semibold" : "normal"}>
                                {cat.name}
                              </Text>
                              {categoryId === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                            </Box>
                          ))}
                        </>
                      )}
                      {filteredExpenseCategories.length > 0 && (
                        <>
                          <Box
                            px={3} py={2} bg={cardBg}
                            borderBottom="1px solid" borderColor={borderColor}
                            borderTop={filteredIncomeCategories.length > 0 ? "1px solid" : undefined}
                            borderTopColor={borderColor}
                          >
                            <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                              Expense
                            </Text>
                          </Box>
                          {filteredExpenseCategories.map((cat, i) => {
                            const flatIndex = filteredIncomeCategories.length + i;
                            return (
                              <Box
                                key={cat.category_id}
                                px={4} py={3}
                                cursor="pointer"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                bg={categoryId === cat.category_id || flatIndex === highlightedIndex ? highlightColor : "transparent"}
                                _hover={{ bg: highlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCategoryId(cat.category_id);
                                  setCategorySearch("");
                                  setIsCategoryOpen(false);
                                  setHighlightedIndex(-1);
                                }}
                              >
                                <Text fontSize="sm" fontWeight={categoryId === cat.category_id ? "semibold" : "normal"}>
                                  {cat.name}
                                </Text>
                                {categoryId === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                              </Box>
                            );
                          })}
                        </>
                      )}
                      {!hasFilteredResults && (
                        <Box px={4} py={5} textAlign="center">
                          <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                        </Box>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormHelperText mt={2} color={helperTextColor}>
                    Choose the category for this {type}
                  </FormHelperText>
                </FormControl>
              </Box>
            )}

            {/* Details */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                <FormNotes
                  ledgerId={ledgerId as string}
                  notes={notes}
                  setNotes={setNotes}
                  borderColor={inputBorderColor}
                  onDropdownOpenChange={setIsNotesSuggestionsOpen}
                />
                {type === "expense" && (
                  <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                    <FormStore
                      ledgerId={ledgerId as string}
                      store={store}
                      setStore={setStore}
                      borderColor={inputBorderColor}
                      onDropdownOpenChange={setIsStoreSuggestionsOpen}
                    />
                    <FormLocation
                      ledgerId={ledgerId as string}
                      location={location}
                      setLocation={setLocation}
                      borderColor={inputBorderColor}
                      onDropdownOpenChange={setIsLocationSuggestionsOpen}
                    />
                  </Stack>
                )}
                <FormTags
                  tags={tags}
                  setTags={setTags}
                  borderColor={inputBorderColor}
                  buttonColorScheme="teal"
                  onShouldBlockSubmit={setIsTagInputActive}
                />
              </VStack>
            </Box>
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={isLoading}
              loadingText="Saving..."
              isDisabled={isSaveDisabled}
            >
              Save Transaction
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="md"
              isDisabled={isLoading}
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
          bg={footerBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={isLoading}
            loadingText="Saving..."
            isDisabled={isSaveDisabled}
          >
            Save Transaction
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={isLoading}
            px={6}
            py={3}
            borderRadius="md"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTransactionModal;
