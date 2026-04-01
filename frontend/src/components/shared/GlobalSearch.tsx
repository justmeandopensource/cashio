import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Input,
  Box,
  Text,
  HStack,
  VStack,
  Icon,
  Spinner,
  Badge,
  useColorModeValue,
  Kbd,
} from "@chakra-ui/react";
import {
  Search,
  X,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  Gem,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "@/lib/queryKeys";
import { globalSearch, type SearchResultItem } from "@/features/search/api";
import useLedgerStore from "@/components/shared/store";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG: Record<
  SearchResultItem["type"],
  { label: string; icon: React.ElementType }
> = {
  account: { label: "Accounts", icon: Wallet },
  transaction: { label: "Transactions", icon: ArrowLeftRight },
  mutual_fund: { label: "Mutual Funds", icon: TrendingUp },
  physical_asset: { label: "Physical Assets", icon: Gem },
};

const TYPE_ORDER: SearchResultItem["type"][] = [
  "account",
  "mutual_fund",
  "physical_asset",
  "transaction",
];

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const setLedger = useLedgerStore((s) => s.setLedger);

  const modalBg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const selectedBg = useColorModeValue("brand.50", "rgba(53, 169, 163, 0.15)");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionColor = useColorModeValue("gray.400", "gray.500");
  const emptyColor = useColorModeValue("gray.400", "gray.500");
  const badgeBg = useColorModeValue("gray.100", "gray.600");
  const badgeColor = useColorModeValue("gray.600", "gray.200");

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.search.global(debouncedQuery),
    queryFn: ({ signal }) => globalSearch(debouncedQuery, signal),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  const clearInput = useCallback(() => {
    setInputValue("");
    setDebouncedQuery("");
    setSelectedIndex(0);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      setDebouncedQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Group results by type, preserving order
  const groupedResults = TYPE_ORDER.reduce(
    (acc, type) => {
      const items = data?.results.filter((r) => r.type === type) ?? [];
      if (items.length > 0) acc.push({ type, items });
      return acc;
    },
    [] as { type: SearchResultItem["type"]; items: SearchResultItem[] }[]
  );

  // Flat list for keyboard navigation
  const flatResults = groupedResults.flatMap((g) => g.items);

  const switchToLedgerAndNavigate = useCallback(
    (item: SearchResultItem, path: string) => {
      if (item.ledger_id && item.ledger_name) {
        setLedger({
          ledgerId: String(item.ledger_id),
          ledgerName: item.ledger_name,
          currencySymbol: item.currency_symbol ?? undefined,
        });
      }
      onClose();
      navigate(path);
    },
    [navigate, onClose, setLedger]
  );

  const navigateToResult = useCallback(
    (item: SearchResultItem) => {
      switch (item.type) {
        case "account":
          switchToLedgerAndNavigate(item, `/account/${item.id}`);
          break;
        case "transaction": {
          const filterParam = item.matched_field || "search_text";
          const filterValue = encodeURIComponent(item.title);
          switchToLedgerAndNavigate(
            item,
            `/ledger?tab=transactions&${filterParam}=${filterValue}`
          );
          break;
        }
        case "mutual_fund":
          switchToLedgerAndNavigate(item, `/ledger?tab=mutual-funds&fundId=${item.id}`);
          break;
        case "physical_asset":
          switchToLedgerAndNavigate(item, `/ledger?tab=physical-assets&assetId=${item.id}`);
          break;
      }
    },
    [switchToLedgerAndNavigate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && flatResults[selectedIndex]) {
        e.preventDefault();
        navigateToResult(flatResults[selectedIndex]);
      }
    },
    [flatResults, selectedIndex, navigateToResult]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const showResults = debouncedQuery.length >= 2;
  const hasResults = flatResults.length > 0;

  let flatIndex = 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" motionPreset="none">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent
        bg={modalBg}
        borderRadius="xl"
        mx={4}
        mt={{ base: 4, md: "12vh" }}
        mb={0}
        overflow="hidden"
        maxH={{ base: "90vh", md: "70vh" }}
      >
        <ModalBody p={0}>
          {/* Search Input */}
          <Box borderBottom="1px solid" borderColor={borderColor} p={3}>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" h="full">
                {isFetching ? (
                  <Spinner size="sm" color="brand.500" />
                ) : (
                  <Icon as={Search} color="gray.400" boxSize={5} />
                )}
              </InputLeftElement>
              <Input
                placeholder="Search accounts, transactions, categories..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                variant="filled"
                bg={inputBg}
                border="none"
                borderRadius="lg"
                _focus={{ bg: inputBg, boxShadow: "none" }}
                _hover={{ bg: inputBg }}
                autoFocus
              />
              {inputValue && (
                <InputRightElement h="full">
                  <Box as="button" onClick={clearInput} p={1} cursor="pointer">
                    <Icon as={X} color="gray.400" boxSize={4} />
                  </Box>
                </InputRightElement>
              )}
            </InputGroup>
          </Box>

          {/* Results */}
          <Box
            ref={resultsRef}
            overflowY="auto"
            maxH={{ base: "calc(90vh - 80px)", md: "calc(70vh - 80px)" }}
          >
            {showResults && !isFetching && !hasResults && (
              <Box px={6} py={8} textAlign="center">
                <Text color={emptyColor} fontSize="sm">
                  No results found for &ldquo;{debouncedQuery}&rdquo;
                </Text>
              </Box>
            )}

            {!showResults && (
              <Box px={6} py={8} textAlign="center">
                <VStack spacing={2}>
                  <Text color={emptyColor} fontSize="sm">
                    Type at least 2 characters to search
                  </Text>
                  <HStack spacing={1}>
                    <Kbd>Esc</Kbd>
                    <Text fontSize="xs" color={emptyColor}>
                      to close
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            )}

            {groupedResults.map((group) => {
              const config = TYPE_CONFIG[group.type];
              return (
                <Box key={group.type} py={2}>
                  <HStack px={4} py={1.5} spacing={2}>
                    <Icon
                      as={config.icon}
                      boxSize={3.5}
                      color={sectionColor}
                    />
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                      color={sectionColor}
                    >
                      {config.label}
                    </Text>
                  </HStack>
                  {group.items.map((item) => {
                    const currentIndex = flatIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <Box
                        key={`${item.type}-${item.id}`}
                        data-index={currentIndex}
                        px={4}
                        py={2.5}
                        mx={2}
                        borderRadius="lg"
                        cursor="pointer"
                        bg={isSelected ? selectedBg : "transparent"}
                        _hover={{ bg: isSelected ? selectedBg : hoverBg }}
                        transition="background 0.1s ease"
                        onClick={() => navigateToResult(item)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <HStack justify="space-between" align="center">
                          <Box flex={1} minW={0}>
                            <Text
                              fontSize="sm"
                              fontWeight="500"
                              noOfLines={1}
                            >
                              {item.title}
                            </Text>
                            {item.subtitle && (
                              <Text
                                fontSize="xs"
                                color={subtitleColor}
                                noOfLines={1}
                                mt={0.5}
                              >
                                {item.subtitle}
                              </Text>
                            )}
                          </Box>
                          {item.ledger_name && (
                            <Badge
                              fontSize="2xs"
                              fontWeight="600"
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              bg={badgeBg}
                              color={badgeColor}
                              textTransform="none"
                              flexShrink={0}
                              ml={2}
                            >
                              {item.ledger_name}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GlobalSearch;
