import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Divider,
  Flex,
  VStack,
  Text,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightElement,
  Input,
  HStack,
  Button,
  FormHelperText,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Icon,
} from "@chakra-ui/react";
import { Plus, Trash2, Search, ChevronDown, Check, X } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { notify } from "@/components/shared/notify";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";

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

interface FormSplitsProps {
  splits: Split[];
  calculateRemainingAmount: () => number;
  currencySymbol: string;
  amount: string;
  type: "income" | "expense";
  categories: Category[];
   
  setSplits: (splits: Split[]) => void;
  borderColor: string;
  bgColor: string;
  highlightColor: string;
  buttonColorScheme: string;
  ledgerId: string;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

interface ApiErrorResponse {
  detail?: string;
}

// Helper function to round to 2 decimal places for financial calculations
const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const FormSplits: React.FC<FormSplitsProps> = ({
  splits,
  calculateRemainingAmount,
  currencySymbol,
  amount,
  type,
  categories,
  setSplits,
  borderColor,
  highlightColor,
  buttonColorScheme,
  ledgerId,
  onDropdownOpenChange,
}) => {
  // Modern theme colors
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const splitCardBg = useColorModeValue("white", "gray.800");
  const splitBorderColor = useColorModeValue("gray.100", "gray.600");
  const progressTrackBg = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.600", "gray.300");
  const allocationLabelColor = useColorModeValue("gray.500", "gray.400");
  const addonColor = useColorModeValue("gray.600", "gray.200");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const dropdownBgColor = useColorModeValue("white", "gray.800");
  const dropdownBorderColor = useColorModeValue("gray.100", "gray.700");
  const dropdownHighlightColor = useColorModeValue("teal.50", "teal.900");
  const dropdownTextColor = useColorModeValue("gray.700", "gray.200");

  // Category dropdown state (tracks which split's dropdown is open)
  const [openCategoryIndex, setOpenCategoryIndex] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryHighlight, setCategoryHighlight] = useState(-1);

  // Notes autocomplete state
  const [openNotesIndex, setOpenNotesIndex] = useState<number | null>(null);
  const [notesSuggestions, setNotesSuggestions] = useState<Record<number, string[]>>({});
  const [notesHighlight, setNotesHighlight] = useState(-1);

  const onDropdownOpenChangeRef = useRef(onDropdownOpenChange);
  onDropdownOpenChangeRef.current = onDropdownOpenChange;

  const notifyDropdownChange = (isOpen: boolean) => {
    onDropdownOpenChangeRef.current?.(isOpen);
  };

  // Filtered categories for the current transaction type
  const filteredCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === type)
        .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase())),
    [categories, type, categorySearch]
  );

  // Update splits based on the current amount
  const updateSplitsBasedOnAmount = useCallback((): void => {
    const currentAmount = parseFloat(amount) || 0;
    const roundedAmount = roundToTwoDecimals(currentAmount);

    if (splits.length === 0) {
      setSplits([{ amount: roundedAmount.toString(), categoryId: "" }]);
      return;
    }
  }, [amount, splits, setSplits]);

  // Recalculate splits when amount changes
  useEffect(() => {
    const amountNum = parseFloat(amount);
    if (amountNum > 0) {
      updateSplitsBasedOnAmount();
    }
  }, [amount, updateSplitsBasedOnAmount]);

  // Handle split amount change
  const handleSplitAmountChange = (index: number, inputValue: string): void => {
    const newSplits: Split[] = [...splits];

    newSplits[index] = {
      ...newSplits[index],
      amount: inputValue,
    };

    const totalAllocated = roundToTwoDecimals(
      newSplits.reduce((sum, split, i) => {
        return roundToTwoDecimals(
          sum +
            (i !== newSplits.length - 1 || i === index
              ? roundToTwoDecimals(parseFloat(split.amount) || 0)
              : 0),
        );
      }, 0),
    );

    const totalAmount = roundToTwoDecimals(parseFloat(amount) || 0);
    const remaining = roundToTwoDecimals(totalAmount - totalAllocated);

    if (index < newSplits.length - 1) {
      if (newSplits.length > 1) {
        newSplits[newSplits.length - 1].amount = (
          remaining > 0 ? remaining : 0
        ).toString();
      }
    } else if (remaining > 0) {
      newSplits.push({ amount: remaining.toString(), categoryId: "" });
    }

    let i = newSplits.length - 1;
    while (
      i > 0 &&
      roundToTwoDecimals(parseFloat(newSplits[i].amount) || 0) === 0 &&
      i !== index
    ) {
      newSplits.pop();
      i--;
    }

    setSplits(newSplits);
  };

  // Add a new split
  const addSplit = (): void => {
    const remaining = roundToTwoDecimals(calculateRemainingAmount());
    if (remaining <= 0) {
      setSplits([...splits, { amount: "0", categoryId: "", notes: "" }]);
    } else {
      setSplits([
        ...splits,
        { amount: remaining.toString(), categoryId: "", notes: "" },
      ]);
    }
  };

  // Remove a split
  const removeSplit = (index: number): void => {
    if (splits.length <= 1) return;

    const newSplits = [...splits];
    const removedAmount = roundToTwoDecimals(
      parseFloat(newSplits[index].amount) || 0,
    );
    newSplits.splice(index, 1);

    if (newSplits.length > 0 && removedAmount > 0) {
      const lastIndex = newSplits.length - 1;
      const currentLastAmount = roundToTwoDecimals(
        parseFloat(newSplits[lastIndex].amount) || 0,
      );
      newSplits[lastIndex].amount = roundToTwoDecimals(
        currentLastAmount + removedAmount,
      ).toString();
    }

    // Close any open dropdowns for the removed/shifted indices
    if (openCategoryIndex !== null && openCategoryIndex >= index) {
      setOpenCategoryIndex(null);
      notifyDropdownChange(false);
    }
    if (openNotesIndex !== null && openNotesIndex >= index) {
      setOpenNotesIndex(null);
      notifyDropdownChange(false);
    }

    setSplits(newSplits);
  };

  // Category dropdown handlers
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const total = filteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (openCategoryIndex !== index) {
          setOpenCategoryIndex(index);
          notifyDropdownChange(true);
          setCategoryHighlight(0);
        } else {
          setCategoryHighlight((prev) => (total === 0 ? -1 : (prev + 1) % total));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (openCategoryIndex === index && total > 0) {
          setCategoryHighlight((prev) => (prev <= 0 ? total - 1 : prev - 1));
        }
        break;
      case "Enter":
        if (openCategoryIndex === index && categoryHighlight >= 0 && categoryHighlight < total) {
          e.preventDefault();
          const cat = filteredCategories[categoryHighlight];
          const newSplits = [...splits];
          newSplits[index].categoryId = cat.category_id;
          setSplits(newSplits);
          setCategorySearch("");
          setOpenCategoryIndex(null);
          notifyDropdownChange(false);
          setCategoryHighlight(-1);
        }
        break;
      case "Escape":
        setOpenCategoryIndex(null);
        notifyDropdownChange(false);
        setCategoryHighlight(-1);
        break;
      case "Tab":
        setOpenCategoryIndex(null);
        notifyDropdownChange(false);
        setCategoryHighlight(-1);
        break;
    }
  };

  const selectCategory = (index: number, categoryId: string) => {
    const newSplits = [...splits];
    newSplits[index].categoryId = categoryId;
    setSplits(newSplits);
    setCategorySearch("");
    setOpenCategoryIndex(null);
    notifyDropdownChange(false);
    setCategoryHighlight(-1);
  };

  // Notes autocomplete helpers
   
  const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: Parameters<F>) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const fetchNotesSuggestions = useCallback(
    async (index: number, searchText: string) => {
      if (searchText.length >= 3) {
        try {
          const response = await api.get(
            `/ledger/${ledgerId}/transaction/notes/suggestions`,
            { params: { search_text: searchText } }
          );
          const results = Array.from(new Set(response.data as string[]));
          if (results.length > 0) {
            setNotesSuggestions((prev) => ({ ...prev, [index]: results }));
            setOpenNotesIndex(index);
            notifyDropdownChange(true);
          } else {
            setNotesSuggestions((prev) => ({ ...prev, [index]: [] }));
          }
        } catch (error) {
          const apiError = error as AxiosError<ApiErrorResponse>;
          notify({
            description:
              apiError.response?.data?.detail || "Failed to fetch note suggestions.",
            status: "error",
          });
        }
      } else {
        setNotesSuggestions((prev) => ({ ...prev, [index]: [] }));
        setOpenNotesIndex((prev) => (prev === index ? null : prev));
      }
    },
    [ledgerId]
  );

  const debouncedFetchNotes = useMemo(
    () => debounce(fetchNotesSuggestions, 500),
    [fetchNotesSuggestions]
  );

  const selectNotesSuggestion = (index: number, value: string) => {
    const newSplits = [...splits];
    newSplits[index].notes = value;
    setSplits(newSplits);
    setNotesSuggestions((prev) => ({ ...prev, [index]: [] }));
    setOpenNotesIndex(null);
    notifyDropdownChange(false);
    setNotesHighlight(-1);
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const suggestions = notesSuggestions[index] || [];
    if (openNotesIndex !== index || suggestions.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setNotesHighlight((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setNotesHighlight((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        e.stopPropagation();
        if (notesHighlight >= 0 && notesHighlight < suggestions.length) {
          selectNotesSuggestion(index, suggestions[notesHighlight]);
        } else {
          setNotesSuggestions((prev) => ({ ...prev, [index]: [] }));
          setOpenNotesIndex(null);
          notifyDropdownChange(false);
          setNotesHighlight(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setNotesSuggestions((prev) => ({ ...prev, [index]: [] }));
        setOpenNotesIndex(null);
        notifyDropdownChange(false);
        setNotesHighlight(-1);
        break;
      case "Tab":
        if (notesHighlight >= 0 && notesHighlight < suggestions.length) {
          selectNotesSuggestion(index, suggestions[notesHighlight]);
        } else {
          setNotesSuggestions((prev) => ({ ...prev, [index]: [] }));
          setOpenNotesIndex(null);
          notifyDropdownChange(false);
        }
        break;
    }
  };

  const isEffectivelyEqual = (a: number, b: number): boolean => {
    return Math.abs(a - b) < 0.01;
  };

  const displayRemainingAmount = (): number => {
    const rawRemaining = calculateRemainingAmount();
    return isEffectivelyEqual(rawRemaining, 0)
      ? 0
      : roundToTwoDecimals(rawRemaining);
  };

  return (
    <Box
      bg={highlightColor}
      p={{ base: 4, sm: 6 }}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack
        spacing={{ base: 4, sm: 5 }}
        align="stretch"
        sx={{ "& .chakra-form__required-indicator": { display: "none" } }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <Text fontWeight="semibold" fontSize="lg" mb={1}>
              Split Details
            </Text>
            <Text fontSize="sm" color={subtitleColor}>
              Allocate amounts across multiple categories
            </Text>
          </Box>
        </Flex>

        <Divider borderColor={borderColor} />

        <VStack spacing={4} align="stretch">
          {splits.map((split, index) => {
            const selectedCategory = categories.find(
              (c) => c.category_id === split.categoryId
            );
            const isCategoryOpen = openCategoryIndex === index;
            const isNotesOpen =
              openNotesIndex === index &&
              (notesSuggestions[index]?.length ?? 0) > 0;
            const currentNotesSuggestions = notesSuggestions[index] || [];

            return (
              <Box
                key={index}
                bg={splitCardBg}
                p={{ base: 4, sm: 5 }}
                borderRadius="md"
                border="2px solid"
                borderColor={splitBorderColor}
                boxShadow="sm"
                _hover={{
                  borderColor: "teal.200",
                  boxShadow: "md",
                }}
                transition="all 0.2s"
              >
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4} align="end">
                    <FormControl flex="1" isRequired>
                      <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
                        Amount
                      </FormLabel>
                      <InputGroup>
                        <InputLeftAddon
                          bg={inputBorderColor}
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          color={addonColor}
                          fontWeight="semibold"
                          fontSize="sm"
                        >
                          {currencySymbol}
                        </InputLeftAddon>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={(split.amount || "").toString()}
                          onChange={(e) => {
                            handleSplitAmountChange(index, e.target.value);
                          }}
                          onKeyDown={(e) =>
                            handleNumericInput(e, (split.amount || "").toString())
                          }
                          onPaste={(e) =>
                            handleNumericPaste(e, (value) => {
                              handleSplitAmountChange(index, value);
                            })
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
                    </FormControl>

                    {splits.length > 1 && (
                      <Button
                        leftIcon={<Trash2 size={16} />}
                        variant="outline"
                        colorScheme="red"
                        size="md"
                        height="40px"
                        onClick={() => removeSplit(index)}
                        borderWidth="2px"
                        px={4}
                        _hover={{
                          bg: "red.50",
                          borderColor: "red.300",
                          transform: "translateY(-1px)",
                        }}
                        transition="all 0.2s"
                      >
                        Remove
                      </Button>
                    )}
                  </HStack>

                  {/* Category searchable dropdown */}
                  <FormControl isRequired>
                    <FormLabel
                      fontSize="sm"
                      fontWeight="semibold"
                      mb={2}
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                    >
                      Category
                      {split.categoryId && (
                        <Icon as={Check} boxSize={3.5} color="teal.500" />
                      )}
                    </FormLabel>
                    <Popover
                      isOpen={isCategoryOpen}
                      onClose={() => {
                        setOpenCategoryIndex(null);
                        notifyDropdownChange(false);
                        setCategoryHighlight(-1);
                      }}
                      matchWidth
                      placement="bottom-start"
                      autoFocus={false}
                      returnFocusOnClose={false}
                    >
                      <PopoverTrigger>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none" height="100%">
                            <Icon as={Search} boxSize={4} color={helperTextColor} />
                          </InputLeftElement>
                          <Input
                            value={
                              isCategoryOpen
                                ? categorySearch
                                : (selectedCategory?.name ?? "")
                            }
                            onChange={(e) => {
                              setCategorySearch(e.target.value);
                              const newSplits = [...splits];
                              newSplits[index].categoryId = "";
                              setSplits(newSplits);
                              setCategoryHighlight(-1);
                              setOpenCategoryIndex(index);
                              notifyDropdownChange(true);
                            }}
                            onFocus={() => {
                              setCategorySearch("");
                              setCategoryHighlight(-1);
                              setOpenCategoryIndex(index);
                              notifyDropdownChange(true);
                            }}
                            onKeyDown={(e) => handleCategoryKeyDown(e, index)}
                            placeholder="Search categories..."
                            borderWidth="2px"
                            borderColor={
                              split.categoryId ? "teal.400" : inputBorderColor
                            }
                            bg={inputBg}
                            borderRadius="md"
                            _hover={{ borderColor: "teal.300" }}
                            _focus={{
                              borderColor: focusBorderColor,
                              boxShadow: `0 0 0 1px ${focusBorderColor}`,
                            }}
                            autoComplete="off"
                            data-testid="formsplits-category-dropdown"
                          />
                          <InputRightElement height="100%" pr={1}>
                            {split.categoryId ? (
                              <Icon
                                as={X}
                                boxSize={4}
                                color={helperTextColor}
                                cursor="pointer"
                                onClick={() => {
                                  const newSplits = [...splits];
                                  newSplits[index].categoryId = "";
                                  setSplits(newSplits);
                                  setCategorySearch("");
                                  setOpenCategoryIndex(null);
                                  notifyDropdownChange(false);
                                  setCategoryHighlight(-1);
                                }}
                              />
                            ) : (
                              <Icon
                                as={ChevronDown}
                                boxSize={4}
                                color={helperTextColor}
                                cursor="pointer"
                                onClick={() => {
                                  if (isCategoryOpen) {
                                    setOpenCategoryIndex(null);
                                    notifyDropdownChange(false);
                                  } else {
                                    setCategorySearch("");
                                    setCategoryHighlight(-1);
                                    setOpenCategoryIndex(index);
                                    notifyDropdownChange(true);
                                  }
                                }}
                              />
                            )}
                          </InputRightElement>
                        </InputGroup>
                      </PopoverTrigger>
                      <PopoverContent
                        p={0}
                        bg={dropdownBgColor}
                        border="1px solid"
                        borderColor={dropdownBorderColor}
                        borderRadius="md"
                        boxShadow="lg"
                        maxH="220px"
                        overflowY="auto"
                        _focus={{ outline: "none" }}
                      >
                        {filteredCategories.length === 0 ? (
                          <Box px={4} py={3}>
                            <Text fontSize="sm" color={helperTextColor}>
                              No categories found
                            </Text>
                          </Box>
                        ) : (
                          <>
                            <Box
                              px={3}
                              py={2}
                              bg={cardBg}
                              borderBottom="1px solid"
                              borderColor={dropdownBorderColor}
                            >
                              <Text
                                fontSize="xs"
                                fontWeight="semibold"
                                color={helperTextColor}
                                textTransform="uppercase"
                                letterSpacing="wider"
                              >
                                {type === "income"
                                  ? "Income Categories"
                                  : "Expense Categories"}
                              </Text>
                            </Box>
                            {filteredCategories.map((cat, i) => (
                              <Box
                                key={cat.category_id}
                                px={4}
                                py={3}
                                cursor="pointer"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                bg={
                                  split.categoryId === cat.category_id ||
                                  i === categoryHighlight
                                    ? dropdownHighlightColor
                                    : "transparent"
                                }
                                _hover={{ bg: dropdownHighlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectCategory(index, cat.category_id);
                                }}
                                onMouseEnter={() => setCategoryHighlight(i)}
                              >
                                <Text
                                  fontSize="sm"
                                  color={dropdownTextColor}
                                  fontWeight={
                                    split.categoryId === cat.category_id
                                      ? "semibold"
                                      : "normal"
                                  }
                                >
                                  {cat.name}
                                </Text>
                                {split.categoryId === cat.category_id && (
                                  <Icon as={Check} boxSize={4} color="teal.500" />
                                )}
                              </Box>
                            ))}
                          </>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormHelperText mt={1} fontSize="xs">
                      Choose the category for this split
                    </FormHelperText>
                  </FormControl>

                  {/* Notes with autocomplete */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
                      Notes
                    </FormLabel>
                    <Popover
                      isOpen={isNotesOpen}
                      onClose={() => {
                        setNotesSuggestions((prev) => ({ ...prev, [index]: [] }));
                        setOpenNotesIndex(null);
                        notifyDropdownChange(false);
                        setNotesHighlight(-1);
                      }}
                      matchWidth
                      placement="bottom-start"
                      autoFocus={false}
                      returnFocusOnClose={false}
                    >
                      <PopoverTrigger>
                        <Input
                          type="text"
                          value={split.notes || ""}
                          onChange={(e) => {
                            const newSplits = [...splits];
                            newSplits[index].notes = e.target.value;
                            setSplits(newSplits);
                            debouncedFetchNotes(index, e.target.value);
                            setNotesHighlight(-1);
                            if (e.target.value.length < 3) {
                              setNotesSuggestions((prev) => ({
                                ...prev,
                                [index]: [],
                              }));
                              setOpenNotesIndex((prev) =>
                                prev === index ? null : prev
                              );
                            }
                          }}
                          onKeyDown={(e) => handleNotesKeyDown(e, index)}
                          placeholder="Optional notes for this split"
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          bg={inputBg}
                          borderRadius="md"
                          _hover={{ borderColor: "teal.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}
                          autoComplete="off"
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        p={0}
                        bg={dropdownBgColor}
                        border="1px solid"
                        borderColor={dropdownBorderColor}
                        borderRadius="md"
                        boxShadow="lg"
                        maxH="200px"
                        overflowY="auto"
                        _focus={{ outline: "none" }}
                      >
                        {currentNotesSuggestions.map((suggestion, i) => (
                          <Box
                            key={i}
                            px={4}
                            py={3}
                            cursor="pointer"
                            bg={
                              i === notesHighlight
                                ? dropdownHighlightColor
                                : "transparent"
                            }
                            _hover={{ bg: dropdownHighlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectNotesSuggestion(index, suggestion);
                            }}
                            onMouseEnter={() => setNotesHighlight(i)}
                          >
                            <Text fontSize="sm" color={dropdownTextColor}>
                              {suggestion}
                            </Text>
                          </Box>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <FormHelperText mt={1} fontSize="xs">
                      Add specific details about this split
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </Box>
            );
          })}
        </VStack>

        {/* Add Split Button */}
        <Button
          leftIcon={<Plus size={16} />}
          variant="outline"
          size="md"
          onClick={addSplit}
          alignSelf="flex-start"
          colorScheme={buttonColorScheme}
          borderWidth="2px"
          px={6}
          isDisabled={
            displayRemainingAmount() <= 0 &&
            splits.some(
              (split) => roundToTwoDecimals(parseFloat(split.amount)) === 0,
            )
          }
          _hover={{
            bg: `${buttonColorScheme}.50`,
            borderColor: `${buttonColorScheme}.300`,
            transform: "translateY(-1px)",
          }}
          transition="all 0.2s"
        >
          Add Split
        </Button>

        {/* Allocation Progress */}
        {(() => {
          const totalAmount = roundToTwoDecimals(parseFloat(amount) || 0);
          const allocatedAmount = roundToTwoDecimals(
            splits.reduce(
              (sum, s) => sum + roundToTwoDecimals(parseFloat(s.amount) || 0),
              0,
            ),
          );
          const remaining = displayRemainingAmount();
          const isComplete = isEffectivelyEqual(remaining, 0);
          const isOver = remaining < 0;
          const progressPct =
            totalAmount > 0
              ? Math.min((allocatedAmount / totalAmount) * 100, 100)
              : 0;
          const barColor = isOver ? "#FC8181" : isComplete ? "#319795" : "#38B2AC";
          const summaryBorder = isComplete
            ? "teal.200"
            : isOver
              ? "red.200"
              : splitBorderColor;

          return (
            <Box
              bg={cardBg}
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor={summaryBorder}
              sx={{ transition: "border-color 0.3s" }}
            >
              <VStack spacing={2} align="stretch">
                <HStack justifyContent="space-between">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color={allocationLabelColor}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Allocation
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={
                      isComplete ? "teal.500" : isOver ? "red.500" : "gray.500"
                    }
                  >
                    {currencySymbol}
                    {allocatedAmount.toFixed(2)} / {currencySymbol}
                    {totalAmount.toFixed(2)}
                  </Text>
                </HStack>

                <Box
                  w="100%"
                  h="10px"
                  bg={progressTrackBg}
                  borderRadius="full"
                  overflow="hidden"
                >
                  <motion.div
                    animate={{
                      width: `${progressPct}%`,
                      backgroundColor: barColor,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ height: "100%", borderRadius: "9999px" }}
                  />
                </Box>

                {isComplete && (
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="teal.500"
                    textAlign="center"
                  >
                    ✓ Perfectly Allocated
                  </Text>
                )}
                {!isComplete && !isOver && (
                  <Text fontSize="xs" color="orange.500" textAlign="right">
                    {currencySymbol}
                    {remaining.toFixed(2)} remaining
                  </Text>
                )}
                {isOver && (
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="red.500"
                    textAlign="right"
                  >
                    {currencySymbol}
                    {Math.abs(remaining).toFixed(2)} over-allocated
                  </Text>
                )}
              </VStack>
            </Box>
          );
        })()}
      </VStack>
    </Box>
  );
};

export default FormSplits;
