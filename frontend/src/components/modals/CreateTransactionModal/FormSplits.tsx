import React, { useCallback, useEffect } from "react";
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
  Input,
  HStack,
  Select,
  Button,
  FormHelperText,
  useColorModeValue,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";

// Define the interfaces for our props and data structures
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
  // eslint-disable-next-line no-unused-vars
  setSplits: (splits: Split[]) => void;
  borderColor: string;
  bgColor: string;
  highlightColor: string;
  buttonColorScheme: string;
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

  // Update splits based on the current amount
  const updateSplitsBasedOnAmount = useCallback((): void => {
    const currentAmount = parseFloat(amount) || 0;

    // Round to ensure we have a clean 2-decimal value
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

    // Calculate remaining amount with proper rounding
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
      // If no remaining amount, add a zero split
      setSplits([...splits, { amount: "0", categoryId: "", notes: "" }]);
    } else {
      // Otherwise, add a split with the remaining amount
      setSplits([
        ...splits,
        { amount: remaining.toString(), categoryId: "", notes: "" },
      ]);
    }
  };

  // Remove a split
  const removeSplit = (index: number): void => {
    if (splits.length <= 1) {
      return; // Keep at least one split
    }

    const newSplits = [...splits];
    const removedAmount = roundToTwoDecimals(
      parseFloat(newSplits[index].amount) || 0,
    );
    newSplits.splice(index, 1);

    // Distribute the removed amount to the last split
    if (newSplits.length > 0 && removedAmount > 0) {
      const lastIndex = newSplits.length - 1;
      const currentLastAmount = roundToTwoDecimals(
        parseFloat(newSplits[lastIndex].amount) || 0,
      );
      newSplits[lastIndex].amount = roundToTwoDecimals(
        currentLastAmount + removedAmount,
      ).toString();
    }

    setSplits(newSplits);
  };

  // Function to check if we're within a very small tolerance for display purposes
  const isEffectivelyEqual = (a: number, b: number): boolean => {
    return Math.abs(a - b) < 0.01;
  };

  // Modified calculation function for UI display
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
          {splits.map((split, index) => (
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

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
                    Category
                  </FormLabel>
                  <Select
                    value={split.categoryId}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[index].categoryId = e.target.value;
                      setSplits(newSplits);
                    }}
                    placeholder="Select category"
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    data-testid="formsplits-category-dropdown"
                  >
                    {/* Filter categories based on transaction type */}
                    <optgroup
                      label={
                        type === "income"
                          ? "Income Categories"
                          : "Expense Categories"
                      }
                    >
                      {categories
                        .filter((category) => category.type === type)
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
                  <FormHelperText mt={1} fontSize="xs">
                    Choose the category for this split
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
                    Notes
                  </FormLabel>
                  <Input
                    type="text"
                    value={split.notes || ""}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[index].notes = e.target.value;
                      setSplits(newSplits);
                    }}
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
                  />
                  <FormHelperText mt={1} fontSize="xs">
                    Add specific details about this split
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>
          ))}
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
            splits.reduce((sum, s) => sum + roundToTwoDecimals(parseFloat(s.amount) || 0), 0),
          );
          const remaining = displayRemainingAmount();
          const isComplete = isEffectivelyEqual(remaining, 0);
          const isOver = remaining < 0;
          const progressPct = totalAmount > 0
            ? Math.min((allocatedAmount / totalAmount) * 100, 100)
            : 0;
          const barColor = isOver ? "#FC8181" : isComplete ? "#319795" : "#38B2AC";
          const summaryBorder = isComplete ? "teal.200" : isOver ? "red.200" : splitBorderColor;

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
                {/* Labels */}
                <HStack justifyContent="space-between">
                  <Text fontSize="xs" fontWeight="semibold" color={allocationLabelColor} textTransform="uppercase" letterSpacing="wider">
                    Allocation
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color={isComplete ? "teal.500" : isOver ? "red.500" : "gray.500"}>
                    {currencySymbol}{allocatedAmount.toFixed(2)} / {currencySymbol}{totalAmount.toFixed(2)}
                  </Text>
                </HStack>

                {/* Progress bar */}
                <Box w="100%" h="10px" bg={progressTrackBg} borderRadius="full" overflow="hidden">
                  <motion.div
                    animate={{ width: `${progressPct}%`, backgroundColor: barColor }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ height: "100%", borderRadius: "9999px" }}
                  />
                </Box>

                {/* Status */}
                {isComplete && (
                  <Text fontSize="xs" fontWeight="bold" color="teal.500" textAlign="center">
                    ✓ Perfectly Allocated
                  </Text>
                )}
                {!isComplete && !isOver && (
                  <Text fontSize="xs" color="orange.500" textAlign="right">
                    {currencySymbol}{remaining.toFixed(2)} remaining
                  </Text>
                )}
                {isOver && (
                  <Text fontSize="xs" fontWeight="bold" color="red.500" textAlign="right">
                    {currencySymbol}{Math.abs(remaining).toFixed(2)} over-allocated
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
