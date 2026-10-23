import React from "react";
import {
  Icon,
  Input,
  Flex,
  Box,
  Text,
  Spinner,
  Popover,
  Field,
} from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/input-group";
import { Search, X, ChevronDown, Check } from "lucide-react";
import type { Category } from "@/types";
import type { InternalFilters, FilterThemeColors } from "./types";

interface FilterCategorySelectorProps {
  filters: InternalFilters;
  handleInputChange: <K extends keyof InternalFilters>(field: K, value: InternalFilters[K]) => void;
  isCategoriesLoading: boolean;
  selectedCategory: Category | undefined;
  categorySearch: string;
  setCategorySearch: (value: string) => void;
  isCategoryOpen: boolean;
  setIsCategoryOpen: (value: boolean) => void;
  highlightedCategoryIndex: number;
  setHighlightedCategoryIndex: (value: number) => void;
  filteredIncomeCategories: Category[];
  filteredExpenseCategories: Category[];
  hasFilteredCategoryResults: boolean;
  handleCategoryKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  colors: FilterThemeColors;
}

const FilterCategorySelector: React.FC<FilterCategorySelectorProps> = ({
  filters,
  handleInputChange,
  isCategoriesLoading,
  selectedCategory,
  categorySearch,
  setCategorySearch,
  isCategoryOpen,
  setIsCategoryOpen,
  highlightedCategoryIndex,
  setHighlightedCategoryIndex,
  filteredIncomeCategories,
  filteredExpenseCategories,
  hasFilteredCategoryResults,
  handleCategoryKeyDown,
  colors,
}) => {
  const {
    bgColor,
    borderColor,
    cardBg,
    inputBg,
    inputBorderColor,
    focusBorderColor,
    highlightColor,
    helperTextColor,
  } = colors;

  return (
    <Box
      bg={cardBg}
      p={{ base: 4, sm: 6 }}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
    >
      <Field.Root>
        <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
          Category
          {filters.category_id && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
        </Field.Label>
        {isCategoriesLoading ? (
          <Flex justify="center" align="center" py={4}>
            <Spinner size="md" color="teal.500" borderWidth="3px" />
          </Flex>
        ) : (
          <Popover.Root
            open={isCategoryOpen}
            autoFocus={false}
            onOpenChange={e => {
              if (!(e.open)) { setIsCategoryOpen(false); setHighlightedCategoryIndex(-1); }
            }}
            positioning={{
              sameWidth: true,
              placement: 'bottom-start'
            }}>
            <Popover.Trigger asChild>
              <InputGroup
                startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                startElementProps={{ pointerEvents: "none", height: "100%" }}
                endElementProps={{ height: "100%", pr: 1, pointerEvents: "auto" }}
                endElement={
                  filters.category_id ? (
                    <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X
                        onClick={() => {
                          handleInputChange("category_id", "");
                          setCategorySearch("");
                          setIsCategoryOpen(false);
                          setHighlightedCategoryIndex(-1);
                        }} /></Icon>
                  ) : (
                    <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown onClick={() => setIsCategoryOpen(!isCategoryOpen)} /></Icon>
                  )
                }>
                <Input
                  size="lg"
                  value={isCategoryOpen ? categorySearch : (selectedCategory?.name ?? "")}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    handleInputChange("category_id", "");
                    setHighlightedCategoryIndex(-1);
                    setIsCategoryOpen(true);
                  }}
                  onFocus={() => {
                    setCategorySearch("");
                    setHighlightedCategoryIndex(-1);
                    setIsCategoryOpen(true);
                  }}
                  onKeyDown={handleCategoryKeyDown}
                  placeholder="All categories"
                  borderWidth="2px"
                  borderColor={filters.category_id ? "teal.400" : inputBorderColor}
                  bg={inputBg}
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                  autoComplete="off"
                />
              </InputGroup>
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content w="full" p={0}
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              boxShadow="lg"
              maxH="220px"
              overflowY="auto"
              _focus={{ outline: "none" }}>{filteredIncomeCategories.length > 0 && (
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
                      bg={filters.category_id === String(cat.category_id) || i === highlightedCategoryIndex ? highlightColor : "transparent"}
                      _hover={{ bg: highlightColor }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleInputChange("category_id", String(cat.category_id));
                        setCategorySearch("");
                        setIsCategoryOpen(false);
                        setHighlightedCategoryIndex(-1);
                      }}
                    >
                      <Text fontSize="sm" fontWeight={filters.category_id === String(cat.category_id) ? "semibold" : "normal"}>
                        {cat.name}
                      </Text>
                      {filters.category_id === String(cat.category_id) && <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>}
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
                        bg={filters.category_id === String(cat.category_id) || flatIndex === highlightedCategoryIndex ? highlightColor : "transparent"}
                        _hover={{ bg: highlightColor }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleInputChange("category_id", String(cat.category_id));
                          setCategorySearch("");
                          setIsCategoryOpen(false);
                          setHighlightedCategoryIndex(-1);
                        }}
                      >
                        <Text fontSize="sm" fontWeight={filters.category_id === String(cat.category_id) ? "semibold" : "normal"}>
                          {cat.name}
                        </Text>
                        {filters.category_id === String(cat.category_id) && <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>}
                      </Box>
                    );
                  })}
                </>
              )}
              {!hasFilteredCategoryResults && (
                <Box px={4} py={5} textAlign="center">
                  <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                </Box>
              )}</Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
        )}
      </Field.Root>
    </Box>
  );
};

export default FilterCategorySelector;
