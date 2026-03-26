import React, { useState, useCallback, useMemo } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Badge,
  Grid,
  GridItem,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@chakra-ui/react";
import { Filter, X, RotateCcw, Search, Check } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { notify } from "@/components/shared/notify";
import type { TransactionFilterProps, FilterThemeColors } from "./types";
import { TRANSACTION_TYPE_OPTIONS } from "./types";
import { useTransactionFilters } from "./useTransactionFilters";
import FilterAccountSelector from "./FilterAccountSelector";
import FilterCategorySelector from "./FilterCategorySelector";
import FilterDateRange from "./FilterDateRange";
import FilterTagsSection from "./FilterTagsSection";

// Store/Location Filter Component
interface StoreLocationFilterProps {
  label: string;
  filterValue: string;
  onChange: (value: string) => void;
  ledgerId: string;
  field: "store" | "location";
  inputBorderColor: string;
  inputBg: string;
  focusBorderColor: string;
}

const StoreLocationFilter: React.FC<StoreLocationFilterProps> = ({
  label,
  filterValue,
  onChange,
  ledgerId,
  field,
  inputBorderColor,
  inputBg,
  focusBorderColor,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  // Dark-mode aware colors
  const suggestionBg = useColorModeValue("white", "gray.800");
  const suggestionBorderColor = useColorModeValue("gray.200", "gray.600");
  const suggestionHighlightBg = useColorModeValue("teal.50", "teal.900");
  const suggestionHoverBg = useColorModeValue("gray.50", "gray.700");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");

  // Debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return (...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { func(...args); }, delay);
    };
  };

  const fetchSuggestions = useCallback(
    async (searchText: string) => {
      if (searchText.length >= 3) {
        try {
          const endpoint = field === "store" ? "store/suggestions" : "location/suggestions";
          const response = await api.get(
            `/ledger/${ledgerId}/transaction/${endpoint}`,
            { params: { search_text: searchText } },
          );
          setSuggestions(Array.from(new Set(response.data)));
          setShowSuggestions(true);
        } catch (error) {
          const apiError = error as AxiosError<{ detail?: string }>;
          notify({
            description: apiError.response?.data?.detail || `Failed to fetch ${field} suggestions.`,
            status: "error",
          });
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    },
    [ledgerId, field],
  );

  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestions, 500),
    [fetchSuggestions],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (suggestions.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setSuggestions([]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    debouncedFetchSuggestions(newValue);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  return (
    <FormControl>
      <FormLabel fontWeight="semibold" mb={2}>
        {label}
      </FormLabel>
      <Popover
        isOpen={showSuggestions && suggestions.length > 0}
        onClose={() => { setShowSuggestions(false); setHighlightedIndex(-1); }}
        placement="bottom-start"
        matchWidth
        closeOnBlur={false}
        returnFocusOnClose={false}
      >
        <PopoverTrigger>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" height="100%">
              <Icon as={Search} boxSize={4} color={helperTextColor} />
            </InputLeftElement>
            <Input
              placeholder={`Filter by ${label.toLowerCase()}`}
              value={filterValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              borderWidth="2px"
              borderColor={filterValue ? "teal.400" : inputBorderColor}
              bg={inputBg}
              borderRadius="md"
              _hover={{ borderColor: "teal.300" }}
              _focus={{
                borderColor: focusBorderColor,
                boxShadow: `0 0 0 1px ${focusBorderColor}`,
              }}
            />
            {filterValue && (
              <InputRightElement height="100%" pr={1}>
                <Icon
                  as={X}
                  boxSize={4}
                  color={helperTextColor}
                  cursor="pointer"
                  onClick={() => handleSuggestionClick("")}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </PopoverTrigger>
        <PopoverContent
          bg={suggestionBg}
          borderColor={suggestionBorderColor}
          borderWidth="1px"
          boxShadow="lg"
          borderRadius="md"
          maxH="200px"
          overflowY="auto"
          _focus={{ boxShadow: "none" }}
          autoFocus={false}
          width="100%"
          onKeyDown={(e) => { handleKeyDown(e); e.stopPropagation(); }}
        >
          <PopoverBody p={1}>
            {suggestions.map((suggestion, index) => (
              <Box
                key={index}
                px={3}
                py={2.5}
                cursor="pointer"
                borderRadius="md"
                fontSize="sm"
                bg={index === highlightedIndex ? suggestionHighlightBg : "transparent"}
                _hover={{ bg: index === highlightedIndex ? suggestionHighlightBg : suggestionHoverBg }}
                onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion}
              </Box>
            ))}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </FormControl>
  );
};

const TransactionFilter: React.FC<TransactionFilterProps> = ({
  ledgerId,
  accountId,
  initialFilters = {},
  onApplyFilters,
  currentFilters = {},
  onResetFilters,
}) => {
  const hook = useTransactionFilters({
    ledgerId,
    initialFilters,
    currentFilters,
    onApplyFilters,
    onResetFilters,
  });

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
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

  const colors: FilterThemeColors = {
    bgColor,
    borderColor,
    cardBg,
    footerBg,
    inputBg,
    inputBorderColor,
    focusBorderColor,
    highlightColor,
    helperTextColor,
    secondaryTextColor,
  };

  const activeFilterCount = hook.getActiveFilterCount();

  return (
    <>
      <IconButton
        aria-label="Filter transactions"
        icon={
          <Box>
            <Icon as={Filter} />
            {activeFilterCount > 0 && (
              <Badge
                colorScheme="teal"
                borderRadius="full"
                position="absolute"
                top="-1"
                right="-1"
                fontSize="xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Box>
        }
        onClick={hook.onOpen}
        variant="outline"
        size="sm"
        position="relative"
        colorScheme="teal"
      />

      <Modal
        isOpen={hook.isOpen}
        returnFocusOnClose={false}
        onClose={hook.onClose}
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
            <HStack spacing={3} align="center" justify="space-between">
              <HStack spacing={3} align="flex-start">
                <Icon as={Filter} boxSize={5} mt="3px" color={modalIconColor} />
                <Box>
                  <Box fontSize="lg" fontWeight="bold" color={modalTitleColor}>
                    Filter Transactions
                  </Box>
                  <Box fontSize="sm" color={modalSubtitleColor}>
                    Refine your transaction search
                  </Box>
                </Box>
              </HStack>

              <Button
                size="sm"
                onClick={hook.handleResetFilters}
                leftIcon={<RotateCcw size={14} />}
                variant="ghost"
                colorScheme="teal"
                borderRadius="md"
              >
                Reset
              </Button>
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
            <VStack
              spacing={{ base: 5, sm: 6 }}
              align="stretch"
              w="100%"
              sx={{ "& .chakra-form__required-indicator": { display: "none" } }}
            >
              {/* Account Selection Card */}
              {!accountId && (
                <FilterAccountSelector
                  filters={hook.filters}
                  handleInputChange={hook.handleInputChange}
                  isAccountsLoading={hook.isAccountsLoading}
                  selectedAccount={hook.selectedAccount}
                  accountSearch={hook.accountSearch}
                  setAccountSearch={hook.setAccountSearch}
                  isAccountOpen={hook.isAccountOpen}
                  setIsAccountOpen={hook.setIsAccountOpen}
                  highlightedAccountIndex={hook.highlightedAccountIndex}
                  setHighlightedAccountIndex={hook.setHighlightedAccountIndex}
                  filteredAssetAccounts={hook.filteredAssetAccounts}
                  filteredLiabilityAccounts={hook.filteredLiabilityAccounts}
                  hasFilteredAccountResults={hook.hasFilteredAccountResults}
                  handleAccountKeyDown={hook.handleAccountKeyDown}
                  colors={colors}
                />
              )}

              {/* Category Selection Card */}
              <FilterCategorySelector
                filters={hook.filters}
                handleInputChange={hook.handleInputChange}
                isCategoriesLoading={hook.isCategoriesLoading}
                selectedCategory={hook.selectedCategory}
                categorySearch={hook.categorySearch}
                setCategorySearch={hook.setCategorySearch}
                isCategoryOpen={hook.isCategoryOpen}
                setIsCategoryOpen={hook.setIsCategoryOpen}
                highlightedCategoryIndex={hook.highlightedCategoryIndex}
                setHighlightedCategoryIndex={hook.setHighlightedCategoryIndex}
                filteredIncomeCategories={hook.filteredIncomeCategories}
                filteredExpenseCategories={hook.filteredExpenseCategories}
                hasFilteredCategoryResults={hook.hasFilteredCategoryResults}
                handleCategoryKeyDown={hook.handleCategoryKeyDown}
                colors={colors}
              />

              {/* Tags Card */}
              <FilterTagsSection
                filters={hook.filters}
                handleInputChange={hook.handleInputChange}
                colors={colors}
              />

              {/* Search Notes Card */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                    Search Notes
                    {hook.filters.search_text && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" height="100%">
                      <Icon as={Search} boxSize={4} color={helperTextColor} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search in transaction notes"
                      value={hook.filters.search_text}
                      onChange={(e) => hook.handleInputChange("search_text", e.target.value)}
                      borderWidth="2px"
                      borderColor={hook.filters.search_text ? "teal.400" : inputBorderColor}
                      bg={inputBg}
                      borderRadius="md"
                      _hover={{ borderColor: "teal.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                    />
                    {hook.filters.search_text && (
                      <InputRightElement height="100%" pr={1}>
                        <Icon
                          as={X}
                          boxSize={4}
                          color={helperTextColor}
                          cursor="pointer"
                          onClick={() => hook.handleInputChange("search_text", "")}
                        />
                      </InputRightElement>
                    )}
                  </InputGroup>
                </FormControl>
              </Box>

              {/* Store and Location Filter Card */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                  <GridItem>
                    <StoreLocationFilter
                      label="Store"
                      filterValue={hook.filters.store}
                      onChange={(value) => hook.handleInputChange("store", value)}
                      ledgerId={ledgerId}
                      field="store"
                      inputBorderColor={inputBorderColor}
                      inputBg={inputBg}
                      focusBorderColor={focusBorderColor}
                    />
                  </GridItem>
                  <GridItem>
                    <StoreLocationFilter
                      label="Location"
                      filterValue={hook.filters.location}
                      onChange={(value) => hook.handleInputChange("location", value)}
                      ledgerId={ledgerId}
                      field="location"
                      inputBorderColor={inputBorderColor}
                      inputBg={inputBg}
                      focusBorderColor={focusBorderColor}
                    />
                  </GridItem>
                </Grid>
              </Box>

              {/* Transaction Type Card */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <FormLabel fontWeight="semibold" mb={3}>
                  Transaction Type
                </FormLabel>
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  {TRANSACTION_TYPE_OPTIONS.map(({ value, label, scheme }) => {
                    const isSelected = hook.filters.transaction_type === value;
                    return (
                      <Button
                        key={label}
                        variant={isSelected ? "solid" : "outline"}
                        colorScheme={isSelected ? scheme : "gray"}
                        onClick={() => hook.handleInputChange("transaction_type", value)}
                        size="md"
                        borderWidth="2px"
                        borderRadius="md"
                        fontWeight={isSelected ? "semibold" : "normal"}
                        transition="all 0.15s"
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Grid>
              </Box>

              {/* Date Range Card */}
              <FilterDateRange
                filters={hook.filters}
                handleInputChange={hook.handleInputChange}
                colors={colors}
              />
            </VStack>

            {/* Mobile-only action buttons that stay at bottom */}
            <Box display={{ base: "block", sm: "none" }} mt={6}>
              <Button
                onClick={hook.handleApplyFilters}
                colorScheme="teal"
                size="lg"
                width="100%"
                mb={3}
                borderRadius="md"
                isDisabled={!hook.hasChanged}
              >
                Apply Filters
              </Button>
              <Button
                variant="ghost"
                colorScheme="gray"
                onClick={hook.onClose}
                size="lg"
                width="100%"
                borderRadius="md"
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
              onClick={hook.handleApplyFilters}
              px={8}
              py={3}
              borderRadius="md"
              isDisabled={!hook.hasChanged}
            >
              Apply Filters
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={hook.onClose}
              px={6}
              py={3}
              borderRadius="md"
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TransactionFilter;
