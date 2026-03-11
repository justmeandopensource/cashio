import React, { useState, useEffect, useCallback } from "react";
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
  Tabs,
  TabList,
  Tab,
  useColorModeValue,
  InputGroup,
  InputLeftAddon,
  Stack,
  FormHelperText,
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
import { Edit, Check, X } from "lucide-react";
import { toastDefaults } from "@/components/shared/utils";
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
  const toast = useToast();

  const { ledgerId, currencySymbol } = useLedgerStore();

  // Modern theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const highlightColor = useColorModeValue("teal.50", "teal.900");

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
          toast({
            description:
              axiosError.response?.data?.detail || "Failed to fetch splits.",
            status: "error",
            ...toastDefaults,
          });
        }
        return [];
      }
    },
    [ledgerId, toast],
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
        toast({
          description:
            axiosError.response?.data?.detail || "Failed to fetch categories.",
          status: "error",
          ...toastDefaults,
        });
      }
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

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

      toast({
        description: "Transaction updated successfully.",
        status: "success",
        ...toastDefaults,
      });

      onClose();
      onTransactionUpdated();
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

  const hasFormChanged = useCallback(() => {
    if (!initialTransactionState) return false; // Initially disable save button

    // Compare primitive values
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

    // Deep compare splits array
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

    // Deep compare tags array
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
              <Edit size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Box
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Edit Transaction
              </Box>
              <Box
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
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
          overflow="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Transaction Type Tabs */}
            <Box>
              <Tabs
                isFitted
                variant="enclosed"
                colorScheme="teal"
                mb={4}
                index={type === "expense" ? 0 : 1}
              >
                <TabList
                  borderRadius="md"
                  bg={cardBg}
                  border="2px solid"
                  borderColor={inputBorderColor}
                >
                   <Tab
                     _selected={{
                       bg: "red.400",
                       color: "white",
                       borderColor: "red.400",
                       fontWeight: "semibold",
                     }}
                     _hover={{
                       bg: "red.50",
                       _selected: { bg: "red.300" }
                     }}
                     borderRadius="sm"
                     onClick={() => setType("expense")}
                   >
                     Expense
                   </Tab>
                   <Tab
                     _selected={{
                       bg: "teal.500",
                       color: "white",
                       borderColor: "teal.500",
                       fontWeight: "semibold",
                     }}
                     _hover={{
                       bg: "teal.50",
                       _selected: { bg: "teal.400" }
                     }}
                     borderRadius="sm"
                     onClick={() => setType("income")}
                   >
                     Income
                   </Tab>
                </TabList>
              </Tabs>
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
                        data-testid="edittransactionmodal-date-picker"
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
                        color="gray.600"
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
                        autoFocus
                      />
                    </InputGroup>
                    <FormHelperText mt={2}>
                      Update the transaction amount
                    </FormHelperText>
                  </FormControl>
                </Stack>
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
                  <Text fontSize="sm" color="gray.600">
                    Divide this transaction across multiple categories
                  </Text>
                </Box>
                <Switch
                  colorScheme="teal"
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
                 buttonColorScheme="teal"
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
                  <FormLabel fontWeight="semibold" mb={2}>
                    Category
                  </FormLabel>
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value || "")}
                    placeholder="Select a category"
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
                    data-testid="edittransactionmodal-category-dropdown"
                  >
                    {/* Group for Income Categories */}
                    <optgroup label="Income Categories">
                      {categories
                        .filter((category) => category.type === "income")
                        .map((category) => (
                          <option
                            key={category.category_id}
                            value={category.category_id}
                          >
                            {category.name}
                          </option>
                        ))}
                    </optgroup>
                    {/* Group for Expense Categories */}
                    <optgroup label="Expense Categories">
                      {categories
                        .filter((category) => category.type === "expense")
                        .map((category) => (
                          <option
                            key={category.category_id}
                            value={category.category_id}
                          >
                            {category.name}
                          </option>
                        ))}
                    </optgroup>
                  </Select>
                  <FormHelperText mt={2}>
                    Choose the category for this {type}
                  </FormHelperText>
                </FormControl>
              </Box>
            )}

            {/* Notes, Store, Location and Tags Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                {/* Notes */}
                <FormNotes
                  ledgerId={ledgerId as string}
                  notes={notes}
                  setNotes={setNotes}
                  borderColor={inputBorderColor}
                />

                {/* Store and Location - only for expense transactions */}
                {type === "expense" && (
                  <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                    <FormStore
                      ledgerId={ledgerId as string}
                      store={store}
                      setStore={setStore}
                      borderColor={inputBorderColor}
                    />
                    <FormLocation
                      ledgerId={ledgerId as string}
                      location={location}
                      setLocation={setLocation}
                      borderColor={inputBorderColor}
                    />
                  </Stack>
                )}

                {/* Tags Input */}
                <FormTags
                  tags={tags}
                  setTags={setTags}
                  borderColor={inputBorderColor}
                  buttonColorScheme="teal"
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
              leftIcon={<Check />}
              _hover={{
                transform: isLoading ? "none" : "translateY(-2px)",
                boxShadow: isLoading ? "none" : "lg",
              }}
              transition="all 0.2s"
            >
              Save Changes
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
              _hover={{ bg: cardBg }}
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
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={isLoading}
            loadingText="Saving..."
            isDisabled={isSaveDisabled}
            leftIcon={<Check />}
            _hover={{
              transform: isLoading ? "none" : "translateY(-2px)",
              boxShadow: isLoading ? "none" : "lg",
            }}
            transition="all 0.2s"
          >
            Save Changes
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
            _hover={{ bg: inputBg }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditTransactionModal;

