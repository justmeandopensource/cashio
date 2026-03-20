/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Stack,
  Flex,
  Radio,
  RadioGroup,
  Badge,
  useDisclosure,
  Grid,
  GridItem,
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@chakra-ui/react";
import { Filter, X, RotateCcw, Search, ChevronDown, Check } from "lucide-react";
import FormTags from "@/components/shared/FormTags";
import config from "@/config";
import ChakraDatePicker from "@/components/shared/ChakraDatePicker";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { notify } from "@/components/shared/notify";

interface Tag {
  name: string;
}

interface Account {
  account_id: string;
  name: string;
  type: string;
}

interface Category {
  category_id: string;
  name: string;
  type: string;
}

interface Filters {
  account_id: string;
  category_id: string;
  tags: Tag[];
  tags_match: "any" | "all";
  search_text: string;
  store: string;
  location: string;
  transaction_type: "" | "income" | "expense" | "transfer";
  from_date: Date | null;
  to_date: Date | null;
}

interface TransactionFilterProps {
  ledgerId: string;
  accountId?: string;
  initialFilters?: Partial<Filters>;
  onApplyFilters: (filters: Partial<Filters>) => void;
  currentFilters?: Partial<Filters>;
  onResetFilters?: () => void;
}

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

const TRANSACTION_TYPE_OPTIONS = [
  { value: "" as const,         label: "All Types", scheme: "gray" },
  { value: "income" as const,   label: "Income",    scheme: "teal" },
  { value: "expense" as const,  label: "Expense",   scheme: "red"  },
  { value: "transfer" as const, label: "Transfer",  scheme: "blue" },
];

const TransactionFilter: React.FC<TransactionFilterProps> = ({
  ledgerId,
  accountId,
  initialFilters = {},
  onApplyFilters,
  currentFilters = {},
  onResetFilters,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  // State for filter form values
  const [filters, setFilters] = useState<Filters>({
    account_id: "",
    category_id: "",
    tags: [],
    tags_match: "any",
    search_text: "",
    store: "",
    location: "",
    transaction_type: "",
    from_date: null,
    to_date: null,
    ...initialFilters,
  });

  // Searchable dropdown state — Account
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [highlightedAccountIndex, setHighlightedAccountIndex] = useState<number>(-1);

  // Searchable dropdown state — Category
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1);

  // Track if filters have changed from current applied filters
  const [hasChanged, setHasChanged] = useState(false);

  // Initialize filters when modal opens with current filters
  useEffect(() => {
    if (isOpen) {
      let normalizedTags: Tag[] = [];
      if (currentFilters.tags) {
        normalizedTags = Array.isArray(currentFilters.tags)
          ? (currentFilters.tags
              .map((tag) => {
                if (typeof tag === "string") return { name: tag };
                else if (tag && typeof tag === "object" && tag.name) return { ...tag };
                return null;
              })
              .filter(Boolean) as Tag[])
          : [];
      }

      const normalizedFilters: Filters = {
        account_id: currentFilters.account_id || "",
        category_id: currentFilters.category_id || "",
        tags: normalizedTags,
        tags_match: currentFilters.tags_match || "any",
        search_text: currentFilters.search_text || "",
        store: currentFilters.store || "",
        location: currentFilters.location || "",
        transaction_type: currentFilters.transaction_type || "",
        from_date: currentFilters.from_date ? new Date(currentFilters.from_date) : null,
        to_date: currentFilters.to_date ? new Date(currentFilters.to_date) : null,
      };

      setFilters(normalizedFilters);

      // Reset dropdown search state
      setAccountSearch("");
      setIsAccountOpen(false);
      setHighlightedAccountIndex(-1);
      setCategorySearch("");
      setIsCategoryOpen(false);
      setHighlightedCategoryIndex(-1);
    }
  }, [isOpen, currentFilters]);

  // Fetch accounts for the current ledger
  const { data: accounts = [], isLoading: isAccountsLoading } = useQuery<Account[]>({
    queryKey: ["accounts", ledgerId, "transaction-filter"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/accounts?ignore_group=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Failed to fetch accounts");
      return response.json();
    },
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/category/list?ignore_group=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Computed filtered accounts
  const selectedAccount = accounts.find(a => a.account_id === filters.account_id);
  const filteredAssetAccounts = accounts.filter(
    a => a.type === "asset" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const filteredLiabilityAccounts = accounts.filter(
    a => a.type === "liability" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const allFilteredAccounts = [...filteredAssetAccounts, ...filteredLiabilityAccounts];
  const hasFilteredAccountResults = allFilteredAccounts.length > 0;

  // Computed filtered categories
  const selectedCategory = categories.find(c => c.category_id === filters.category_id);
  const filteredIncomeCategories = categories.filter(
    c => c.type === "income" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredExpenseCategories = categories.filter(
    c => c.type === "expense" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const allFilteredCategories = [...filteredIncomeCategories, ...filteredExpenseCategories];
  const hasFilteredCategoryResults = allFilteredCategories.length > 0;

  const handleAccountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isAccountOpen) { setIsAccountOpen(true); setHighlightedAccountIndex(0); }
        else { setHighlightedAccountIndex(prev => total === 0 ? -1 : (prev + 1) % total); }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isAccountOpen && total > 0) setHighlightedAccountIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        break;
      case "Enter":
        if (isAccountOpen && highlightedAccountIndex >= 0 && highlightedAccountIndex < total) {
          e.preventDefault();
          const acc = allFilteredAccounts[highlightedAccountIndex];
          handleInputChange("account_id", acc.account_id);
          setAccountSearch("");
          setIsAccountOpen(false);
          setHighlightedAccountIndex(-1);
        }
        break;
      case "Escape":
        setIsAccountOpen(false);
        setHighlightedAccountIndex(-1);
        break;
      case "Tab":
        setIsAccountOpen(false);
        setHighlightedAccountIndex(-1);
        break;
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isCategoryOpen) { setIsCategoryOpen(true); setHighlightedCategoryIndex(0); }
        else { setHighlightedCategoryIndex(prev => total === 0 ? -1 : (prev + 1) % total); }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isCategoryOpen && total > 0) setHighlightedCategoryIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        break;
      case "Enter":
        if (isCategoryOpen && highlightedCategoryIndex >= 0 && highlightedCategoryIndex < total) {
          e.preventDefault();
          const cat = allFilteredCategories[highlightedCategoryIndex];
          handleInputChange("category_id", cat.category_id);
          setCategorySearch("");
          setIsCategoryOpen(false);
          setHighlightedCategoryIndex(-1);
        }
        break;
      case "Escape":
        setIsCategoryOpen(false);
        setHighlightedCategoryIndex(-1);
        break;
      case "Tab":
        setIsCategoryOpen(false);
        setHighlightedCategoryIndex(-1);
        break;
    }
  };

  // Check if filters have changed when the form is opened or filters change
  useEffect(() => {
    const checkIfChanged = () => {
      if (filters.account_id !== (currentFilters.account_id || "")) return true;
      if (filters.category_id !== (currentFilters.category_id || "")) return true;
      if (filters.search_text !== (currentFilters.search_text || "")) return true;
      if (filters.store !== (currentFilters.store || "")) return true;
      if (filters.location !== (currentFilters.location || "")) return true;
      if (filters.transaction_type !== (currentFilters.transaction_type || "")) return true;
      if (filters.tags_match !== (currentFilters.tags_match || "any")) return true;

      const currentTags = currentFilters.tags || [];
      if (filters.tags.length !== currentTags.length) return true;
      const tagNames = [...filters.tags].map(t => t.name).sort();
      const currentTagNames = [...currentTags].map(t => t.name).sort();
      for (let i = 0; i < tagNames.length; i++) {
        if (tagNames[i] !== currentTagNames[i]) return true;
      }

      if ((filters.from_date && !currentFilters.from_date) || (!filters.from_date && currentFilters.from_date)) return true;
      if ((filters.to_date && !currentFilters.to_date) || (!filters.to_date && currentFilters.to_date)) return true;

      if (filters.from_date && currentFilters.from_date) {
        if (new Date(filters.from_date).toDateString() !== new Date(currentFilters.from_date).toDateString()) return true;
      }
      if (filters.to_date && currentFilters.to_date) {
        if (new Date(filters.to_date).toDateString() !== new Date(currentFilters.to_date).toDateString()) return true;
      }

      return false;
    };
    setHasChanged(checkIfChanged());
  }, [filters, currentFilters]);

  const handleResetFilters = () => {
    setFilters({
      account_id: "",
      category_id: "",
      tags: [],
      tags_match: "any",
      search_text: "",
      store: "",
      location: "",
      transaction_type: "",
      from_date: null,
      to_date: null,
    });
    setAccountSearch("");
    setIsAccountOpen(false);
    setHighlightedAccountIndex(-1);
    setCategorySearch("");
    setIsCategoryOpen(false);
    setHighlightedCategoryIndex(-1);
    if (onResetFilters) onResetFilters();
  };

  const handleApplyFilters = () => {
    const cleanedFilters: Partial<Filters> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value === "" || value === null) return;
      if (Array.isArray(value) && value.length === 0) return;

      if (key === "from_date" || key === "to_date") {
        if (value) {
          const dateValue = value instanceof Date ? value : new Date(value);
          const isSameDay = filters.from_date && filters.to_date &&
            (filters.from_date instanceof Date ? filters.from_date : new Date(filters.from_date)).toDateString() ===
            (filters.to_date instanceof Date ? filters.to_date : new Date(filters.to_date)).toDateString();

          if (isSameDay) {
            if (key === "to_date") dateValue.setHours(23, 59, 59, 999);
            else if (key === "from_date") dateValue.setHours(0, 0, 0, 0);
          }
          (cleanedFilters as any)[key] = dateValue.toISOString();
        }
        return;
      }
      if (key === "tags" && value.length > 0) {
        cleanedFilters[key] = [...value].map((tag) => tag.name);
        return;
      }
      cleanedFilters[key as keyof Filters] = value;
    });
    onApplyFilters(cleanedFilters);
    onClose();
  };

  const handleInputChange = <K extends keyof Filters>(field: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (currentFilters.account_id) count++;
    if (currentFilters.category_id) count++;
    if (currentFilters.tags && currentFilters.tags.length > 0) count++;
    if (currentFilters.search_text) count++;
    if (currentFilters.store) count++;
    if (currentFilters.location) count++;
    if (currentFilters.transaction_type) count++;
    if (currentFilters.from_date) count++;
    if (currentFilters.to_date) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

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
        onClick={onOpen}
        variant="outline"
        size="sm"
        position="relative"
        colorScheme="teal"
      />

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
                onClick={handleResetFilters}
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
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <FormControl>
                    <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                      Account
                      {filters.account_id && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                    </FormLabel>
                    {isAccountsLoading ? (
                      <Flex justify="center" align="center" py={4}>
                        <Spinner size="md" color="teal.500" thickness="3px" />
                      </Flex>
                    ) : (
                      <Popover
                        isOpen={isAccountOpen}
                        onClose={() => { setIsAccountOpen(false); setHighlightedAccountIndex(-1); }}
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
                              value={isAccountOpen ? accountSearch : (selectedAccount?.name ?? "")}
                              onChange={(e) => {
                                setAccountSearch(e.target.value);
                                handleInputChange("account_id", "");
                                setHighlightedAccountIndex(-1);
                                setIsAccountOpen(true);
                              }}
                              onFocus={() => {
                                setAccountSearch("");
                                setHighlightedAccountIndex(-1);
                                setIsAccountOpen(true);
                              }}
                              onKeyDown={handleAccountKeyDown}
                              placeholder="All accounts"
                              borderWidth="2px"
                              borderColor={filters.account_id ? "teal.400" : inputBorderColor}
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
                              {filters.account_id ? (
                                <Icon
                                  as={X}
                                  boxSize={4}
                                  color={helperTextColor}
                                  cursor="pointer"
                                  onClick={() => {
                                    handleInputChange("account_id", "");
                                    setAccountSearch("");
                                    setIsAccountOpen(false);
                                    setHighlightedAccountIndex(-1);
                                  }}
                                />
                              ) : (
                                <Icon
                                  as={ChevronDown}
                                  boxSize={4}
                                  color={helperTextColor}
                                  cursor="pointer"
                                  onClick={() => setIsAccountOpen(!isAccountOpen)}
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
                          {filteredAssetAccounts.length > 0 && (
                            <>
                              <Box px={3} py={2} bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
                                <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                                  Asset
                                </Text>
                              </Box>
                              {filteredAssetAccounts.map((acc, i) => (
                                <Box
                                  key={acc.account_id}
                                  px={4} py={3}
                                  cursor="pointer"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  bg={filters.account_id === acc.account_id || i === highlightedAccountIndex ? highlightColor : "transparent"}
                                  _hover={{ bg: highlightColor }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInputChange("account_id", acc.account_id);
                                    setAccountSearch("");
                                    setIsAccountOpen(false);
                                    setHighlightedAccountIndex(-1);
                                  }}
                                >
                                  <Text fontSize="sm" fontWeight={filters.account_id === acc.account_id ? "semibold" : "normal"}>
                                    {acc.name}
                                  </Text>
                                  {filters.account_id === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                                </Box>
                              ))}
                            </>
                          )}
                          {filteredLiabilityAccounts.length > 0 && (
                            <>
                              <Box
                                px={3} py={2} bg={cardBg}
                                borderBottom="1px solid" borderColor={borderColor}
                                borderTop={filteredAssetAccounts.length > 0 ? "1px solid" : undefined}
                                borderTopColor={borderColor}
                              >
                                <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                                  Liability
                                </Text>
                              </Box>
                              {filteredLiabilityAccounts.map((acc, i) => {
                                const flatIndex = filteredAssetAccounts.length + i;
                                return (
                                  <Box
                                    key={acc.account_id}
                                    px={4} py={3}
                                    cursor="pointer"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    bg={filters.account_id === acc.account_id || flatIndex === highlightedAccountIndex ? highlightColor : "transparent"}
                                    _hover={{ bg: highlightColor }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleInputChange("account_id", acc.account_id);
                                      setAccountSearch("");
                                      setIsAccountOpen(false);
                                      setHighlightedAccountIndex(-1);
                                    }}
                                  >
                                    <Text fontSize="sm" fontWeight={filters.account_id === acc.account_id ? "semibold" : "normal"}>
                                      {acc.name}
                                    </Text>
                                    {filters.account_id === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                                  </Box>
                                );
                              })}
                            </>
                          )}
                          {!hasFilteredAccountResults && (
                            <Box px={4} py={5} textAlign="center">
                              <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                            </Box>
                          )}
                        </PopoverContent>
                      </Popover>
                    )}
                  </FormControl>
                </Box>
              )}

              {/* Category Selection Card */}
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
                                bg={filters.category_id === cat.category_id || i === highlightedCategoryIndex ? highlightColor : "transparent"}
                                _hover={{ bg: highlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleInputChange("category_id", cat.category_id);
                                  setCategorySearch("");
                                  setIsCategoryOpen(false);
                                  setHighlightedCategoryIndex(-1);
                                }}
                              >
                                <Text fontSize="sm" fontWeight={filters.category_id === cat.category_id ? "semibold" : "normal"}>
                                  {cat.name}
                                </Text>
                                {filters.category_id === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                                  bg={filters.category_id === cat.category_id || flatIndex === highlightedCategoryIndex ? highlightColor : "transparent"}
                                  _hover={{ bg: highlightColor }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInputChange("category_id", cat.category_id);
                                    setCategorySearch("");
                                    setIsCategoryOpen(false);
                                    setHighlightedCategoryIndex(-1);
                                  }}
                                >
                                  <Text fontSize="sm" fontWeight={filters.category_id === cat.category_id ? "semibold" : "normal"}>
                                    {cat.name}
                                  </Text>
                                  {filters.category_id === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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

              {/* Tags Card */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack spacing={5} align="stretch">
                  <FormTags
                    tags={filters.tags}
                    setTags={(tags) => handleInputChange("tags", tags)}
                    borderColor={inputBorderColor}
                    buttonColorScheme="teal"
                  />
                  <FormControl>
                    <RadioGroup
                      value={filters.tags_match}
                      onChange={(value) => handleInputChange("tags_match", value as "any" | "all")}
                    >
                      <Stack direction="row" spacing={6}>
                        <Radio value="any" colorScheme="teal" size="lg">
                          Match Any Tag
                        </Radio>
                        <Radio value="all" colorScheme="teal" size="lg">
                          Match All Tags
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                </VStack>
              </Box>

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
                    {filters.search_text && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" height="100%">
                      <Icon as={Search} boxSize={4} color={helperTextColor} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search in transaction notes"
                      value={filters.search_text}
                      onChange={(e) => handleInputChange("search_text", e.target.value)}
                      borderWidth="2px"
                      borderColor={filters.search_text ? "teal.400" : inputBorderColor}
                      bg={inputBg}
                      borderRadius="md"
                      _hover={{ borderColor: "teal.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                    />
                    {filters.search_text && (
                      <InputRightElement height="100%" pr={1}>
                        <Icon
                          as={X}
                          boxSize={4}
                          color={helperTextColor}
                          cursor="pointer"
                          onClick={() => handleInputChange("search_text", "")}
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
                      filterValue={filters.store}
                      onChange={(value) => handleInputChange("store", value)}
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
                      filterValue={filters.location}
                      onChange={(value) => handleInputChange("location", value)}
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
                    const isSelected = filters.transaction_type === value;
                    return (
                      <Button
                        key={label}
                        variant={isSelected ? "solid" : "outline"}
                        colorScheme={isSelected ? scheme : "gray"}
                        onClick={() => handleInputChange("transaction_type", value)}
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
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <FormLabel fontWeight="semibold" mb={3} display="flex" alignItems="center" gap={1.5}>
                  Date Range
                  {(filters.from_date || filters.to_date) && (
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
                  )}
                </FormLabel>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="sm" color={secondaryTextColor} mb={1}>
                        From Date
                      </FormLabel>
                      <ChakraDatePicker
                        selected={filters.from_date}
                        onChange={(date) => handleInputChange("from_date", date)}
                        shouldCloseOnSelect={true}
                        placeholderText="From"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel fontSize="sm" color={secondaryTextColor} mb={1}>
                        To Date
                      </FormLabel>
                      <ChakraDatePicker
                        selected={filters.to_date}
                        onChange={(date) => handleInputChange("to_date", date)}
                        shouldCloseOnSelect={true}
                        placeholderText="To"
                        minDate={filters.from_date}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </Box>
            </VStack>

            {/* Mobile-only action buttons that stay at bottom */}
            <Box display={{ base: "block", sm: "none" }} mt={6}>
              <Button
                onClick={handleApplyFilters}
                colorScheme="teal"
                size="lg"
                width="100%"
                mb={3}
                borderRadius="md"
                isDisabled={!hasChanged}
              >
                Apply Filters
              </Button>
              <Button
                variant="ghost"
                colorScheme="gray"
                onClick={onClose}
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
              onClick={handleApplyFilters}
              px={8}
              py={3}
              borderRadius="md"
              isDisabled={!hasChanged}
            >
              Apply Filters
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
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
