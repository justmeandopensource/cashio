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
  Box,
  useColorModeValue,
  Stack,
  FormHelperText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import FormSplits from "../CreateTransactionModal/FormSplits";
import FormNotes from "@/components/shared/FormNotes";
import FormStore from "@/components/shared/FormStore";
import FormLocation from "@/components/shared/FormLocation";
import FormTags from "@/components/shared/FormTags";
import useLedgerStore from "@/components/shared/store";
import { motion } from "framer-motion";
import { Edit, Check, X, Search, ChevronDown } from "lucide-react";
import { notify } from "@/components/shared/notify";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";

// Define interfaces for the props and state
interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onTransactionUpdated: () => void;
}

interface Category {
  category_id: string;
  name: string;
  type: string;
}

interface Split {
  amount: string;
  categoryId: string;
  notes?: string;
}

interface ApiSplit {
  debit: number;
  credit: number;
  category_id: string;
  notes?: string;
}

interface Tag {
  name: string;
}

interface InitialTransactionState {
  date: Date;
  type: "expense" | "income";
  categoryId: string;
  notes: string;
  store: string;
  location: string;
  amount: string;
  isSplit: boolean;
  splits: Split[];
  tags: Tag[];
}

const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [store, setStore] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initialTransactionState, setInitialTransactionState] =
    useState<InitialTransactionState | null>(null);
  const [isNotesSuggestionsOpen, setIsNotesSuggestionsOpen] = useState<boolean>(false);
  const [isStoreSuggestionsOpen, setIsStoreSuggestionsOpen] = useState<boolean>(false);
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState<boolean>(false);
  const [isTagInputActive, setIsTagInputActive] = useState<boolean>(false);
  const [isSplitDropdownOpen, setIsSplitDropdownOpen] = useState<boolean>(false);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
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
  const buttonColor = useColorModeValue("gray.600", "gray.200");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");
  const heroExpenseBg = useColorModeValue("red.50", "red.900");
  const heroIncomeBg = useColorModeValue("teal.50", "teal.900");
  const heroExpenseBorder = useColorModeValue("red.200", "red.800");
  const heroIncomeBorder = useColorModeValue("teal.200", "teal.800");
  const heroExpenseColor = useColorModeValue("red.500", "red.300");
  const heroIncomeColor = useColorModeValue("teal.600", "teal.300");
  const heroExpensePlaceholder = useColorModeValue("red.300", "red.700");
  const heroIncomePlaceholder = useColorModeValue("teal.300", "teal.700");

  const selectedCategory = categories.find((c) => String(c.category_id) === String(categoryId));
  const filteredIncomeCategories = categories.filter(
    (c) => c.type === "income" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredExpenseCategories = categories.filter(
    (c) => c.type === "expense" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const hasFilteredResults =
    filteredIncomeCategories.length > 0 || filteredExpenseCategories.length > 0;
  const allFilteredCategories = [...filteredIncomeCategories, ...filteredExpenseCategories];

  const fetchSplits = useCallback(
    async (transactionId: string): Promise<Split[]> => {
      try {
        const response = await api.get<ApiSplit[]>(
          `/ledger/${ledgerId}/transaction/${transactionId}/splits`,
        );
        const fetchedSplits = response.data.map((split) => ({
          amount: (split.debit > 0 ? split.debit : split.credit).toString(),
          categoryId: split.category_id.toString(),
          notes: split.notes,
        }));
        setSplits(fetchedSplits);
        return fetchedSplits;
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status !== 401) {
          notify({
            description:
              axiosError.response?.data?.detail || "Failed to fetch splits.",
            status: "error",
              });
        }
        return [];
      }
    },
    [ledgerId],
  );

  useEffect(() => {
    if (isOpen && transaction) {
      const initialType = transaction.credit > 0 ? "income" : "expense";
      const initialAmount =
        transaction.credit > 0
          ? transaction.credit.toString()
          : transaction.debit.toString();
      const initialDate = new Date(transaction.date);
      const initialNotes = transaction.notes || "";
      const initialStore = transaction.store || "";
      const initialLocation = transaction.location || "";
      const initialTags = transaction.tags || [];
      const initialCategoryId = transaction.category_id
        ? String(transaction.category_id)
        : "";
      const initialIsSplit = transaction.is_split;

      setDate(initialDate);
      setNotes(initialNotes);
      setStore(initialStore);
      setLocation(initialLocation);
      setTags(initialTags);
      setType(initialType);
      setCategoryId(initialCategoryId);
      setAmount(initialAmount);
      setIsSplit(initialIsSplit);
      setCategorySearch("");
      setIsCategoryOpen(false);
      setHighlightedIndex(-1);
      setIsNotesSuggestionsOpen(false);
      setIsStoreSuggestionsOpen(false);
      setIsLocationSuggestionsOpen(false);
      setIsTagInputActive(false);

      if (initialIsSplit) {
        fetchSplits(transaction.transaction_id).then((fetchedSplits) => {
          setInitialTransactionState({
            date: initialDate,
            type: initialType,
            categoryId: initialCategoryId,
            notes: initialNotes,
            store: initialStore,
            location: initialLocation,
            amount: initialAmount,
            isSplit: initialIsSplit,
            splits: fetchedSplits,
            tags: initialTags,
          });
        });
      } else {
        setInitialTransactionState({
          date: initialDate,
          type: initialType,
          categoryId: initialCategoryId,
          notes: initialNotes,
          store: initialStore,
          location: initialLocation,
          amount: initialAmount,
          isSplit: initialIsSplit,
          splits: [],
          tags: initialTags,
        });
      }
    }
  }, [isOpen, transaction, fetchSplits]);

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
        notify({
          description:
            axiosError.response?.data?.detail || "Failed to fetch categories.",
          status: "error",
          });
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

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

  // Handle split transaction toggle
  const handleSplitToggle = (isChecked: boolean) => {
    if (!amount || parseFloat(amount) <= 0) {
      notify({
        description: "Amount required before enabling split transactions.",
        status: "error",
      });
      return;
    }

    setIsSplit(isChecked);

    if (isChecked) {
      setSplits([{ amount: amount, categoryId: "" }]);
    } else {
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
      notify({
        description: "No categories found. Please create categories first.",
        status: "error",
      });
      return;
    }

    // Validate all splits have categories if split is enabled
    if (isSplit) {
      const invalidSplits = splits.filter(
        (split) => !split.categoryId && (parseFloat(split.amount) || 0) > 0,
      );
      if (invalidSplits.length > 0) {
        notify({
          description: "Please select a category for each split.",
          status: "error",
          });
        return;
      }

      const totalSplitAmount = splits.reduce(
        (sum, split) => sum + (parseFloat(split.amount) || 0),
        0,
      );

      if (Math.abs(totalSplitAmount - (parseFloat(amount) || 0)) > 0.01) {
        notify({
          description:
            "The sum of split amounts must equal the total transaction amount.",
          status: "error",
          });
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        category_id: parseInt(categoryId, 10),
        type: type,
        date: date.toISOString(),
        notes: notes,
        store: store,
        location: location,
        credit: type === "income" ? parseFloat(amount) || 0 : 0,
        debit: type === "expense" ? parseFloat(amount) || 0 : 0,
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
      await api.put(
        `/ledger/${ledgerId}/transaction/${transaction.transaction_id}`,
        payload,
      );

      notify({
        description: "Transaction updated successfully.",
        status: "success",
      });

      onClose();
      onTransactionUpdated();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description:
            axiosError.response?.data?.detail || "Transaction failed",
          status: "error",
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update ref on every render so the keyboard effect never goes stale
  handleSubmitRef.current = handleSubmit;

  const hasFormChanged = useCallback(() => {
    if (!initialTransactionState) return false;

    if (
      date.toISOString() !== initialTransactionState.date.toISOString() ||
      type !== initialTransactionState.type ||
      categoryId !== initialTransactionState.categoryId ||
      notes !== initialTransactionState.notes ||
      store !== initialTransactionState.store ||
      location !== initialTransactionState.location ||
      parseFloat(amount) !== parseFloat(initialTransactionState.amount) ||
      isSplit !== initialTransactionState.isSplit
    ) {
      return true;
    }

    if (splits.length !== initialTransactionState.splits.length) {
      return true;
    }
    for (let i = 0; i < splits.length; i++) {
      if (
        parseFloat(splits[i].amount) !==
          parseFloat(initialTransactionState.splits[i].amount) ||
        splits[i].categoryId !== initialTransactionState.splits[i].categoryId ||
        splits[i].notes !== initialTransactionState.splits[i].notes
      ) {
        return true;
      }
    }

    if (tags.length !== initialTransactionState.tags.length) {
      return true;
    }
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].name !== initialTransactionState.tags[i].name) {
        return true;
      }
    }

    return false;
  }, [
    date,
    type,
    categoryId,
    notes,
    store,
    location,
    amount,
    isSplit,
    splits,
    tags,
    initialTransactionState,
  ]);

  const isSaveDisabled =
    isLoading ||
    !hasFormChanged() ||
    (isSplit &&
      (splits.some(
        (split) => (parseFloat(split.amount) || 0) > 0 && !split.categoryId,
      ) ||
        calculateRemainingAmount() !== 0)) ||
    (!isSplit && !categoryId) ||
    !amount;

  // Keyboard shortcuts: Enter to submit, Escape closes dropdowns before the modal
   
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
        if (isNotesSuggestionsOpen || isStoreSuggestionsOpen || isLocationSuggestionsOpen || isSplitDropdownOpen) {
          return;
        }
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        if (isCategoryOpen || isNotesSuggestionsOpen || isStoreSuggestionsOpen || isLocationSuggestionsOpen || isTagInputActive || isSplitDropdownOpen) return;
        if (isSaveDisabled || isLoading) return;
        e.preventDefault();
        handleSubmitRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, isCategoryOpen, isNotesSuggestionsOpen, isStoreSuggestionsOpen, isLocationSuggestionsOpen, isTagInputActive, isSplitDropdownOpen, isSaveDisabled, isLoading, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={onClose}
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
        <Box h="3px" bgGradient="linear(to-r, brand.400, brand.600, teal.300)" />
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={Edit} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Box
                fontSize="lg"
                fontWeight="800"
                letterSpacing="-0.02em"
                color={modalTitleColor}
              >
                Edit Transaction
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
              >
                Update your {type === "expense" ? "expense" : "income"}
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
                  data-testid="edittransactionmodal-amount-input"
                />
              </Box>
            </Box>

            {/* Basic Info Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
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
                        borderRadius: "lg",
                        bg: inputBg,
                        fontSize: "lg",
                        _hover: { borderColor: "brand.300" },
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
                      data-testid="edittransactionmodal-date-picker"
                    />
                  </Box>
                </FormControl>
              </VStack>
            </Box>

            {/* Split Toggle Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
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
                  colorScheme="brand"
                  size="lg"
                  isChecked={isSplit}
                  onChange={(e) => handleSplitToggle(e.target.checked)}
                  isDisabled={!amount}
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
                buttonColorScheme="brand"
                ledgerId={ledgerId as string}
                onDropdownOpenChange={setIsSplitDropdownOpen}
              />
            ) : (
              /* Category Dropdown Card */
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="xl"
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
                          borderRadius="lg"
                          _hover={{ borderColor: "brand.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}
                          autoComplete="off"
                          data-testid="edittransactionmodal-category-dropdown"
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
                      borderRadius="lg"
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
                              bg={String(categoryId) === String(cat.category_id) || i === highlightedIndex ? highlightColor : "transparent"}
                              _hover={{ bg: highlightColor }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setCategoryId(cat.category_id);
                                setCategorySearch("");
                                setIsCategoryOpen(false);
                                setHighlightedIndex(-1);
                              }}
                            >
                              <Text fontSize="sm" fontWeight={String(categoryId) === String(cat.category_id) ? "semibold" : "normal"}>
                                {cat.name}
                              </Text>
                              {String(categoryId) === String(cat.category_id) && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                                bg={String(categoryId) === String(cat.category_id) || flatIndex === highlightedIndex ? highlightColor : "transparent"}
                                _hover={{ bg: highlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCategoryId(cat.category_id);
                                  setCategorySearch("");
                                  setIsCategoryOpen(false);
                                  setHighlightedIndex(-1);
                                }}
                              >
                                <Text fontSize="sm" fontWeight={String(categoryId) === String(cat.category_id) ? "semibold" : "normal"}>
                                  {cat.name}
                                </Text>
                                {String(categoryId) === String(cat.category_id) && <Icon as={Check} boxSize={4} color="teal.500" />}
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
              borderRadius="xl"
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
                  buttonColorScheme="brand"
                  onShouldBlockSubmit={setIsTagInputActive}
                />
              </VStack>
            </Box>
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="brand"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              isLoading={isLoading}
              loadingText="Saving..."
              isDisabled={isSaveDisabled}
              fontWeight="bold"
            >
              Save Changes
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="lg"
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
            colorScheme="brand"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="lg"
            isLoading={isLoading}
            loadingText="Saving..."
            isDisabled={isSaveDisabled}
            fontWeight="bold"
          >
            Save Changes
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={isLoading}
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

export default EditTransactionModal;
