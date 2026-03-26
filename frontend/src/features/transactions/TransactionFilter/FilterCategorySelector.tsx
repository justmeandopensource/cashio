import React from "react";
import {
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Flex,
  Box,
  Text,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
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
      <FormControl>
        <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
          Category
          {filters.category_id && <Icon as={Check} boxSize={3.5} color="teal.500" />}
        </FormLabel>
        {isCategoriesLoading ? (
          <Flex justify="center" align="center" py={4}>
            <Spinner size="md" color="teal.500" thickness="3px" />
          </Flex>
        ) : (
          <Popover
            isOpen={isCategoryOpen}
            onClose={() => { setIsCategoryOpen(false); setHighlightedCategoryIndex(-1); }}
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
                <InputRightElement height="100%" pr={1}>
                  {filters.category_id ? (
                    <Icon
                      as={X}
                      boxSize={4}
                      color={helperTextColor}
                      cursor="pointer"
                      onClick={() => {
                        handleInputChange("category_id", "");
                        setCategorySearch("");
                        setIsCategoryOpen(false);
                        setHighlightedCategoryIndex(-1);
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
                      {filters.category_id === String(cat.category_id) && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                        {filters.category_id === String(cat.category_id) && <Icon as={Check} boxSize={4} color="teal.500" />}
                      </Box>
                    );
                  })}
                </>
              )}
              {!hasFilteredCategoryResults && (
                <Box px={4} py={5} textAlign="center">
                  <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                </Box>
              )}
            </PopoverContent>
          </Popover>
        )}
      </FormControl>
    </Box>
  );
};

export default FilterCategorySelector;
