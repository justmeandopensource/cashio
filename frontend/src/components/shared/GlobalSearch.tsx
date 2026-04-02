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
  CornerDownLeft,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "@/lib/queryKeys";
import { globalSearch, type SearchResultItem } from "@/features/search/api";
import useLedgerStore from "@/components/shared/store";
import {
  useCommandPalette,
  filterCommands,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  type PaletteCommand,
  type CommandCategory,
} from "@/components/shared/useCommandPalette";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_TYPE_CONFIG: Record<
  SearchResultItem["type"],
  { label: string; icon: React.ElementType }
> = {
  account: { label: "Accounts", icon: Wallet },
  transaction: { label: "Transactions", icon: ArrowLeftRight },
  mutual_fund: { label: "Mutual Funds", icon: TrendingUp },
  physical_asset: { label: "Physical Assets", icon: Gem },
};

const SEARCH_TYPE_ORDER: SearchResultItem["type"][] = [
  "account",
  "mutual_fund",
  "physical_asset",
  "transaction",
];

// Unified item type for keyboard navigation
type PaletteItem =
  | { kind: "command"; command: PaletteCommand }
  | { kind: "search"; item: SearchResultItem };

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const setLedger = useLedgerStore((s) => s.setLedger);

  // Command palette
  const commands = useCommandPalette(onClose);
  const filteredCommands = filterCommands(commands, inputValue);

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
  const cmdIconColor = useColorModeValue("gray.400", "gray.500");
  const footerBg = useColorModeValue("gray.50", "gray.750");

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

  // Group search results by type
  const showSearchResults = debouncedQuery.length >= 2;
  const groupedSearchResults = showSearchResults
    ? SEARCH_TYPE_ORDER.reduce(
        (acc, type) => {
          const items = data?.results.filter((r) => r.type === type) ?? [];
          if (items.length > 0) acc.push({ type, items });
          return acc;
        },
        [] as { type: SearchResultItem["type"]; items: SearchResultItem[] }[]
      )
    : [];

  // Group commands by category
  const groupedCommands = CATEGORY_ORDER.reduce(
    (acc, category) => {
      const items = filteredCommands.filter((c) => c.category === category);
      if (items.length > 0) acc.push({ category, items });
      return acc;
    },
    [] as { category: CommandCategory; items: PaletteCommand[] }[]
  );

  // Build unified flat list for keyboard navigation
  const flatItems: PaletteItem[] = [
    ...groupedCommands.flatMap((g) =>
      g.items.map((cmd): PaletteItem => ({ kind: "command", command: cmd }))
    ),
    ...groupedSearchResults.flatMap((g) =>
      g.items.map((item): PaletteItem => ({ kind: "search", item }))
    ),
  ];

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

  const navigateToSearchResult = useCallback(
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

  const executeItem = useCallback(
    (paletteItem: PaletteItem) => {
      if (paletteItem.kind === "command") {
        paletteItem.command.execute();
      } else {
        navigateToSearchResult(paletteItem.item);
      }
    },
    [navigateToSearchResult]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && flatItems[selectedIndex]) {
        e.preventDefault();
        executeItem(flatItems[selectedIndex]);
      }
    },
    [flatItems, selectedIndex, executeItem]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const hasCommands = groupedCommands.length > 0;
  const hasSearchResults = groupedSearchResults.length > 0;
  const hasAnyResults = flatItems.length > 0;

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
                placeholder="Search or jump to..."
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
            maxH={{ base: "calc(90vh - 120px)", md: "calc(70vh - 120px)" }}
          >
            {/* Command sections */}
            {groupedCommands.map((group) => (
              <Box key={group.category} py={2}>
                <HStack px={4} py={1.5} spacing={2}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                    color={sectionColor}
                  >
                    {CATEGORY_LABELS[group.category]}
                  </Text>
                </HStack>
                {group.items.map((cmd) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <Box
                      key={cmd.id}
                      data-index={currentIndex}
                      px={4}
                      py={2.5}
                      mx={2}
                      borderRadius="lg"
                      cursor="pointer"
                      bg={isSelected ? selectedBg : "transparent"}
                      _hover={{ bg: isSelected ? selectedBg : hoverBg }}
                      transition="background 0.1s ease"
                      onClick={() => cmd.execute()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <HStack justify="space-between" align="center">
                        <HStack flex={1} minW={0} spacing={3}>
                          <Icon
                            as={cmd.icon}
                            boxSize={4}
                            color={cmdIconColor}
                            flexShrink={0}
                          />
                          <Box flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="500" noOfLines={1}>
                              {cmd.title}
                            </Text>
                            {cmd.subtitle && (
                              <Text
                                fontSize="xs"
                                color={subtitleColor}
                                noOfLines={1}
                                mt={0.5}
                              >
                                {cmd.subtitle}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                        {isSelected && (
                          <Icon
                            as={CornerDownLeft}
                            boxSize={3.5}
                            color={sectionColor}
                            flexShrink={0}
                            ml={2}
                          />
                        )}
                      </HStack>
                    </Box>
                  );
                })}
              </Box>
            ))}

            {/* Search result sections */}
            {groupedSearchResults.map((group) => {
              const config = SEARCH_TYPE_CONFIG[group.type];
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
                        onClick={() => navigateToSearchResult(item)}
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

            {/* Empty state: no results at all when searching */}
            {showSearchResults && !isFetching && !hasAnyResults && (
              <Box px={6} py={8} textAlign="center">
                <Text color={emptyColor} fontSize="sm">
                  No results found for &ldquo;{debouncedQuery}&rdquo;
                </Text>
              </Box>
            )}

            {/* Empty state: commands filtered to zero, but search hasn't run yet */}
            {!showSearchResults && !hasCommands && inputValue.length > 0 && (
              <Box px={6} py={8} textAlign="center">
                <Text color={emptyColor} fontSize="sm">
                  No matching commands. Type more to search...
                </Text>
              </Box>
            )}
          </Box>

          {/* Footer with keyboard hints */}
          <Box
            borderTop="1px solid"
            borderColor={borderColor}
            px={4}
            py={2}
            bg={footerBg}
          >
            <HStack spacing={4} justify="center">
              <HStack spacing={1}>
                <Kbd size="sm" fontSize="2xs">&#8593;&#8595;</Kbd>
                <Text fontSize="2xs" color={sectionColor}>
                  navigate
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd size="sm" fontSize="2xs">&#9166;</Kbd>
                <Text fontSize="2xs" color={sectionColor}>
                  select
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd size="sm" fontSize="2xs">esc</Kbd>
                <Text fontSize="2xs" color={sectionColor}>
                  close
                </Text>
              </HStack>
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GlobalSearch;
