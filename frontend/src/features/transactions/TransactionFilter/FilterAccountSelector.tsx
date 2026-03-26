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
import type { Account } from "@/types";
import type { InternalFilters, FilterThemeColors } from "./types";

interface FilterAccountSelectorProps {
  filters: InternalFilters;
  handleInputChange: <K extends keyof InternalFilters>(field: K, value: InternalFilters[K]) => void;
  isAccountsLoading: boolean;
  selectedAccount: Account | undefined;
  accountSearch: string;
  setAccountSearch: (value: string) => void;
  isAccountOpen: boolean;
  setIsAccountOpen: (value: boolean) => void;
  highlightedAccountIndex: number;
  setHighlightedAccountIndex: (value: number) => void;
  filteredAssetAccounts: Account[];
  filteredLiabilityAccounts: Account[];
  hasFilteredAccountResults: boolean;
  handleAccountKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  colors: FilterThemeColors;
}

const FilterAccountSelector: React.FC<FilterAccountSelectorProps> = ({
  filters,
  handleInputChange,
  isAccountsLoading,
  selectedAccount,
  accountSearch,
  setAccountSearch,
  isAccountOpen,
  setIsAccountOpen,
  highlightedAccountIndex,
  setHighlightedAccountIndex,
  filteredAssetAccounts,
  filteredLiabilityAccounts,
  hasFilteredAccountResults,
  handleAccountKeyDown,
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
                      bg={filters.account_id === String(acc.account_id) || i === highlightedAccountIndex ? highlightColor : "transparent"}
                      _hover={{ bg: highlightColor }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleInputChange("account_id", String(acc.account_id));
                        setAccountSearch("");
                        setIsAccountOpen(false);
                        setHighlightedAccountIndex(-1);
                      }}
                    >
                      <Text fontSize="sm" fontWeight={filters.account_id === String(acc.account_id) ? "semibold" : "normal"}>
                        {acc.name}
                      </Text>
                      {filters.account_id === String(acc.account_id) && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                        bg={filters.account_id === String(acc.account_id) || flatIndex === highlightedAccountIndex ? highlightColor : "transparent"}
                        _hover={{ bg: highlightColor }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleInputChange("account_id", String(acc.account_id));
                          setAccountSearch("");
                          setIsAccountOpen(false);
                          setHighlightedAccountIndex(-1);
                        }}
                      >
                        <Text fontSize="sm" fontWeight={filters.account_id === String(acc.account_id) ? "semibold" : "normal"}>
                          {acc.name}
                        </Text>
                        {filters.account_id === String(acc.account_id) && <Icon as={Check} boxSize={4} color="teal.500" />}
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
  );
};

export default FilterAccountSelector;
