import React, { useCallback, useEffect } from "react";
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
      <VStack spacing={{ base: 4, sm: 5 }} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <Text fontWeight="semibold" fontSize="lg" mb={1}>
              Split Details
            </Text>
            <Text fontSize="sm" color="gray.600">
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
                        color="gray.600"
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

        {/* Enhanced Summary Section */}
        <Box
          bg={cardBg}
          p={4}
          borderRadius="md"
          border="1px solid"
          borderColor={splitBorderColor}
        >
          <VStack spacing={3}>
            <HStack justifyContent="space-between" w="100%">
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Total Amount:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="gray.900">
                {currencySymbol}
                {roundToTwoDecimals(parseFloat(amount) || 0).toFixed(2)}
              </Text>
            </HStack>

            <HStack justifyContent="space-between" w="100%">
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Allocated:
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="green.600">
                {currencySymbol}
                {roundToTwoDecimals(
                  splits.reduce(
                    (sum, split) =>
                      sum + roundToTwoDecimals(parseFloat(split.amount) || 0),
                    0,
                  ),
                ).toFixed(2)}
              </Text>
            </HStack>

            {!isEffectivelyEqual(calculateRemainingAmount(), 0) && (
              <HStack justifyContent="space-between" w="100%">
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  {calculateRemainingAmount() < 0
                    ? "Over-allocated:"
                    : "Remaining:"}
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={
                    calculateRemainingAmount() < 0 ? "red.500" : "orange.500"
                  }
                >
                  {currencySymbol}
                  {Math.abs(
                    roundToTwoDecimals(calculateRemainingAmount()),
                  ).toFixed(2)}
                </Text>
              </HStack>
            )}

            {isEffectivelyEqual(calculateRemainingAmount(), 0) && (
              <HStack justifyContent="center" w="100%">
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="green.500"
                  bg="green.50"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  ✓ Perfectly Allocated
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default FormSplits;
