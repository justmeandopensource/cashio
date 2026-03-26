import React from "react";
import {
  Box,
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
import { Trash2, Search, ChevronDown, Check, X } from "lucide-react";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";
import type { Split } from "@/types";
import type { Category } from "./types";

interface SplitRowProps {
  split: Split;
  index: number;
  canRemove: boolean;
  currencySymbol: string;
  categories: Category[];
  type: "income" | "expense";

  // Category dropdown
  isCategoryOpen: boolean;
  categorySearch: string;
  categoryHighlight: number;
  filteredCategories: Category[];
  onCategorySearchChange: (value: string) => void;
  onCategoryFocus: () => void;
  onCategoryKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCategoryClose: () => void;
  onCategorySelect: (categoryId: string) => void;
  onCategoryClear: () => void;
  onCategoryToggle: () => void;

  // Notes autocomplete
  isNotesOpen: boolean;
  notesSuggestions: string[];
  notesHighlight: number;
  onNotesChange: (value: string) => void;
  onNotesKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onNotesClose: () => void;
  onNotesSuggestionSelect: (value: string) => void;
  onNotesHighlightChange: (index: number) => void;

  // Actions
  onAmountChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onSplitCategoryIdChange: (index: number, categoryId: string) => void;
}

const SplitRow: React.FC<SplitRowProps> = ({
  split,
  index,
  canRemove,
  currencySymbol,
  categories,
  type,
  isCategoryOpen,
  categorySearch,
  categoryHighlight,
  filteredCategories,
  onCategorySearchChange,
  onCategoryFocus,
  onCategoryKeyDown,
  onCategoryClose,
  onCategorySelect,
  onCategoryClear,
  onCategoryToggle,
  isNotesOpen,
  notesSuggestions,
  notesHighlight,
  onNotesChange,
  onNotesKeyDown,
  onNotesClose,
  onNotesSuggestionSelect,
  onNotesHighlightChange,
  onAmountChange,
  onRemove,
  onSplitCategoryIdChange: _onSplitCategoryIdChange,
}) => {
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const splitCardBg = useColorModeValue("white", "gray.800");
  const splitBorderColor = useColorModeValue("gray.100", "gray.600");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const addonColor = useColorModeValue("gray.600", "gray.200");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const dropdownBgColor = useColorModeValue("white", "gray.800");
  const dropdownBorderColor = useColorModeValue("gray.100", "gray.700");
  const dropdownHighlightColor = useColorModeValue("teal.50", "teal.900");
  const dropdownTextColor = useColorModeValue("gray.700", "gray.200");

  const selectedCategory = categories.find(
    (c) => c.category_id === split.categoryId,
  );

  return (
    <Box
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
                  onAmountChange(index, e.target.value);
                }}
                onKeyDown={(e) =>
                  handleNumericInput(e, (split.amount || "").toString())
                }
                onPaste={(e) =>
                  handleNumericPaste(e, (value) => {
                    onAmountChange(index, value);
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

          {canRemove && (
            <Button
              leftIcon={<Trash2 size={16} />}
              variant="outline"
              colorScheme="red"
              size="md"
              height="40px"
              onClick={() => onRemove(index)}
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
            onClose={onCategoryClose}
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
                  onChange={(e) => onCategorySearchChange(e.target.value)}
                  onFocus={onCategoryFocus}
                  onKeyDown={onCategoryKeyDown}
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
                      onClick={onCategoryClear}
                    />
                  ) : (
                    <Icon
                      as={ChevronDown}
                      boxSize={4}
                      color={helperTextColor}
                      cursor="pointer"
                      onClick={onCategoryToggle}
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
                        onCategorySelect(cat.category_id);
                      }}
                      onMouseEnter={() =>
                        /* handled by parent via highlight */ undefined
                      }
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
            onClose={onNotesClose}
            matchWidth
            placement="bottom-start"
            autoFocus={false}
            returnFocusOnClose={false}
          >
            <PopoverTrigger>
              <Input
                type="text"
                value={split.notes || ""}
                onChange={(e) => onNotesChange(e.target.value)}
                onKeyDown={onNotesKeyDown}
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
              {notesSuggestions.map((suggestion, i) => (
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
                    onNotesSuggestionSelect(suggestion);
                  }}
                  onMouseEnter={() => onNotesHighlightChange(i)}
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
};

export default SplitRow;
