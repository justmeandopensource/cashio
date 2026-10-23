import React from "react";
import { useColorModeValue } from "../../ui/color-mode";
import {
  Box,
  VStack,
  Text,
  InputGroup,
  Input,
  HStack,
  Button,
  Popover,
  Icon,
  Field,
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
      <VStack gap={4} align="stretch">
        <HStack gap={4} align="end">
          <Field.Root flex="1" required>
            <Field.Label fontSize="sm" fontWeight="semibold" mb={2}>
              Amount
            </Field.Label>
            <InputGroup
              startAddon={currencySymbol}
              startAddonProps={{
                bg: inputBorderColor,
                borderWidth: "2px",
                borderColor: inputBorderColor,
                color: addonColor,
                fontWeight: "semibold",
                fontSize: "sm",
              }}
            >
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
          </Field.Root>

          {canRemove && (
            <Button
              variant="outline"
              colorPalette="red"
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
              transition="all 0.2s"><Trash2 size={16} />Remove
                          </Button>
          )}
        </HStack>

        {/* Category searchable dropdown */}
        <Field.Root required>
          <Field.Label
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
            display="flex"
            alignItems="center"
            gap={1.5}
          >
            Category
            {split.categoryId && (
              <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
            )}
          </Field.Label>
          <Popover.Root
            open={isCategoryOpen}
            autoFocus={false}
            onOpenChange={e => {
              if (!(e.open)) { onCategoryClose(); }
            }}
            positioning={{
              sameWidth: true,
              placement: 'bottom-start'
            }}>
            <Popover.Trigger asChild>
              <InputGroup
                startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                endElement={
                  split.categoryId ? (
                    <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X onClick={onCategoryClear} /></Icon>
                  ) : (
                    <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown onClick={onCategoryToggle} /></Icon>
                  )
                }
                endElementProps={{ pr: 1 }}
              >
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
              </InputGroup>
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content w="full" p={0}
              bg={dropdownBgColor}
              border="1px solid"
              borderColor={dropdownBorderColor}
              borderRadius="md"
              boxShadow="lg"
              maxH="220px"
              overflowY="auto"
              _focus={{ outline: "none" }}>{filteredCategories.length === 0 ? (
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
                        <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>
                      )}
                    </Box>
                  ))}
                </>
              )}</Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
          <Field.HelperText mt={1} fontSize="xs">
            Choose the category for this split
          </Field.HelperText>
        </Field.Root>

        {/* Notes with autocomplete */}
        <Field.Root>
          <Field.Label fontSize="sm" fontWeight="semibold" mb={2}>
            Notes
          </Field.Label>
          <Popover.Root
            open={isNotesOpen}
            autoFocus={false}
            onOpenChange={e => {
              if (!(e.open)) { onNotesClose(); }
            }}
            positioning={{
              sameWidth: true,
              placement: 'bottom-start'
            }}>
            <Popover.Trigger asChild>
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
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content w="full" p={0}
              bg={dropdownBgColor}
              border="1px solid"
              borderColor={dropdownBorderColor}
              borderRadius="md"
              boxShadow="lg"
              maxH="200px"
              overflowY="auto"
              _focus={{ outline: "none" }}>{notesSuggestions.map((suggestion, i) => (
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
              ))}</Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
          <Field.HelperText mt={1} fontSize="xs">
            Add specific details about this split
          </Field.HelperText>
        </Field.Root>
      </VStack>
    </Box>
  );
};

export default SplitRow;
