import { FC } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightElement,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  HStack,
  Text,
  Box,
  Stack,
  Spinner,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@chakra-ui/react";
import {
  DollarSign,
  Calendar,
  FileText,
  Building2,
  Coins,
  Search,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import { formatUnits, formatAmount } from "../../../utils";
import type { useBuySellForm } from "./useBuySellForm";

interface BuySellFormProps {
  type: "buy" | "sell";
  form: ReturnType<typeof useBuySellForm>;
}

const BuySellForm: FC<BuySellFormProps> = ({ type, form }) => {
  const {
    formData,
    errors,
    currencySymbol,
    accountsLoading,
    categoriesLoading,
    transactionMutation,
    selectedAccount,
    filteredAssetAccounts,
    filteredLiabilityAccounts,
    hasFilteredAccountResults,
    selectedCategory,
    filteredCategories,
    hasFilteredCategoryResults,
    selectedFund,
    totalUnits,
    navPerUnit,
    accountSearch,
    setAccountSearch,
    isAccountOpen,
    setIsAccountOpen,
    highlightedAccountIndex,
    setHighlightedAccountIndex,
    categorySearch,
    setCategorySearch,
    isCategoryOpen,
    setIsCategoryOpen,
    highlightedCategoryIndex,
    setHighlightedCategoryIndex,
    handleInputChange,
    handleAccountKeyDown,
    handleCategoryKeyDown,
    handleClose,
    handleSubmit,
    isFormValid,
  } = form;

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const addonColor = useColorModeValue("gray.600", "gray.200");

  return (
    <VStack spacing={{ base: 5, sm: 6 }} align="stretch">
      {/* Transaction Details Card */}
      <Box
        bg={cardBg}
        p={{ base: 4, sm: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack spacing={5} align="stretch">
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.units}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Coins size={16} />
                  <Text>Units to {type}</Text>
                  {formData.units && parseFloat(formData.units) > 0 && (
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
                  )}
                </HStack>
              </FormLabel>
              <Input
                type="number"
                step="0.001"
                value={formData.units}
                onChange={(e) => handleInputChange("units", e.target.value)}
                placeholder="0.000"
                min={0}
                max={type === "sell" ? totalUnits : undefined}
                size="lg"
                bg={inputBg}
                borderColor={inputBorderColor}
                borderWidth="2px"
                borderRadius="md"
                autoFocus
                _hover={{ borderColor: "teal.300" }}
                _focus={{
                  borderColor: focusBorderColor,
                  boxShadow: `0 0 0 1px ${focusBorderColor}`,
                }}
              />
              <FormErrorMessage>{errors.units}</FormErrorMessage>
              <FormHelperText>
                {type === "buy" ? "Current holdings" : "Available to sell"}:{" "}
                {selectedFund ? formatUnits(totalUnits) : "0"}
              </FormHelperText>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.amount_excluding_charges}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <DollarSign size={16} />
                  <Text>Amount</Text>
                  {formData.amount_excluding_charges &&
                    parseFloat(formData.amount_excluding_charges) > 0 && (
                      <Icon as={Check} boxSize={3.5} color="teal.500" />
                    )}
                </HStack>
              </FormLabel>
              <InputGroup size="lg">
                <InputLeftAddon
                  bg={inputBorderColor}
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  color={addonColor}
                  fontWeight="semibold"
                >
                  {currencySymbol || "\u20B9"}
                </InputLeftAddon>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount_excluding_charges}
                  onChange={(e) =>
                    handleInputChange(
                      "amount_excluding_charges",
                      e.target.value,
                    )
                  }
                  placeholder="0.00"
                  min={0}
                  bg={inputBg}
                  borderColor={inputBorderColor}
                  borderWidth="2px"
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                />
              </InputGroup>
              <FormErrorMessage>
                {errors.amount_excluding_charges}
              </FormErrorMessage>
              <FormHelperText>
                NAV per unit: {currencySymbol || "\u20B9"}
                {formatAmount(navPerUnit)}
              </FormHelperText>
            </FormControl>
          </Stack>

          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.account_id}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Building2 size={16} />
                  <Text>
                    {type === "buy"
                      ? "Source Account"
                      : "Destination Account"}
                  </Text>
                  {formData.account_id && (
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
                  )}
                </HStack>
              </FormLabel>
              {accountsLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" color="teal.500" />
                  <Text fontSize="sm" color={helperTextColor}>
                    Loading accounts...
                  </Text>
                </HStack>
              ) : (
                <Popover
                  isOpen={isAccountOpen}
                  onClose={() => {
                    setIsAccountOpen(false);
                    setHighlightedAccountIndex(-1);
                  }}
                  matchWidth
                  placement="bottom-start"
                  autoFocus={false}
                  returnFocusOnClose={false}
                >
                  <PopoverTrigger>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none" height="100%">
                        <Icon
                          as={Search}
                          boxSize={4}
                          color={helperTextColor}
                        />
                      </InputLeftElement>
                      <Input
                        value={
                          isAccountOpen
                            ? accountSearch
                            : (selectedAccount?.name ?? "")
                        }
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
                        placeholder="Search accounts..."
                        borderWidth="2px"
                        borderColor={
                          formData.account_id
                            ? "teal.400"
                            : inputBorderColor
                        }
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
                        {formData.account_id ? (
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
                        <Box
                          px={3}
                          py={2}
                          bg={cardBg}
                          borderBottom="1px solid"
                          borderColor={borderColor}
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color={helperTextColor}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Asset
                          </Text>
                        </Box>
                        {filteredAssetAccounts.map((acc, i) => (
                          <Box
                            key={acc.account_id}
                            px={4}
                            py={3}
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            bg={
                              formData.account_id ===
                                acc.account_id.toString() ||
                              i === highlightedAccountIndex
                                ? highlightColor
                                : "transparent"
                            }
                            _hover={{ bg: highlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleInputChange(
                                "account_id",
                                acc.account_id.toString(),
                              );
                              setAccountSearch("");
                              setIsAccountOpen(false);
                              setHighlightedAccountIndex(-1);
                            }}
                          >
                            <Text
                              fontSize="sm"
                              fontWeight={
                                formData.account_id ===
                                acc.account_id.toString()
                                  ? "semibold"
                                  : "normal"
                              }
                            >
                              {acc.name}
                            </Text>
                            {formData.account_id ===
                              acc.account_id.toString() && (
                              <Icon
                                as={Check}
                                boxSize={4}
                                color="teal.500"
                              />
                            )}
                          </Box>
                        ))}
                      </>
                    )}
                    {filteredLiabilityAccounts.length > 0 && (
                      <>
                        <Box
                          px={3}
                          py={2}
                          bg={cardBg}
                          borderBottom="1px solid"
                          borderColor={borderColor}
                          borderTop={
                            filteredAssetAccounts.length > 0
                              ? "1px solid"
                              : undefined
                          }
                          borderTopColor={borderColor}
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color={helperTextColor}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Liability
                          </Text>
                        </Box>
                        {filteredLiabilityAccounts.map((acc, i) => {
                          const flatIndex = filteredAssetAccounts.length + i;
                          return (
                            <Box
                              key={acc.account_id}
                              px={4}
                              py={3}
                              cursor="pointer"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              bg={
                                formData.account_id ===
                                  acc.account_id.toString() ||
                                flatIndex === highlightedAccountIndex
                                  ? highlightColor
                                  : "transparent"
                              }
                              _hover={{ bg: highlightColor }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange(
                                  "account_id",
                                  acc.account_id.toString(),
                                );
                                setAccountSearch("");
                                setIsAccountOpen(false);
                                setHighlightedAccountIndex(-1);
                              }}
                            >
                              <Text
                                fontSize="sm"
                                fontWeight={
                                  formData.account_id ===
                                  acc.account_id.toString()
                                    ? "semibold"
                                    : "normal"
                                }
                              >
                                {acc.name}
                              </Text>
                              {formData.account_id ===
                                acc.account_id.toString() && (
                                <Icon
                                  as={Check}
                                  boxSize={4}
                                  color="teal.500"
                                />
                              )}
                            </Box>
                          );
                        })}
                      </>
                    )}
                    {!hasFilteredAccountResults && (
                      <Box px={4} py={5} textAlign="center">
                        <Text fontSize="sm" color={helperTextColor}>
                          No accounts found
                        </Text>
                      </Box>
                    )}
                  </PopoverContent>
                </Popover>
              )}
              <FormErrorMessage>{errors.account_id}</FormErrorMessage>
              <FormHelperText>
                {type === "buy"
                  ? "Account to deduct funds from"
                  : "Account to receive funds"}
              </FormHelperText>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.transaction_date}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Calendar size={16} />
                  <Text>Date</Text>
                  <Icon as={Check} boxSize={3.5} color="teal.500" />
                </HStack>
              </FormLabel>
              <Box
                sx={{
                  ".react-datepicker-wrapper": {
                    width: "100%",
                  },
                  ".react-datepicker__input-container input": {
                    width: "100%",
                    height: "48px",
                    borderWidth: "2px",
                    borderColor: inputBorderColor,
                    borderRadius: "md",
                    bg: inputBg,
                    fontSize: "lg",
                    _hover: { borderColor: "teal.300" },
                    _focus: {
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    },
                  },
                }}
              >
                <ChakraDatePicker
                  selected={formData.transaction_date}
                  onChange={(date: Date | null) => {
                    if (date) {
                      handleInputChange("transaction_date", date);
                    }
                  }}
                  shouldCloseOnSelect={true}
                />
              </Box>
              <FormErrorMessage>{errors.transaction_date}</FormErrorMessage>
              <FormHelperText>Transaction date</FormHelperText>
            </FormControl>
          </Stack>

          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.other_charges}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <DollarSign size={16} />
                  <Text>Other Charges</Text>
                </HStack>
              </FormLabel>
              <InputGroup size="lg">
                <InputLeftAddon
                  bg={inputBorderColor}
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  color={addonColor}
                  fontWeight="semibold"
                >
                  {currencySymbol || "\u20B9"}
                </InputLeftAddon>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.other_charges}
                  onChange={(e) =>
                    handleInputChange("other_charges", e.target.value)
                  }
                  placeholder="0.00"
                  min={0}
                  bg={inputBg}
                  borderColor={inputBorderColor}
                  borderWidth="2px"
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                />
              </InputGroup>
              <FormErrorMessage>{errors.other_charges}</FormErrorMessage>
              <FormHelperText>
                Stamp duty, transaction fees, etc.
              </FormHelperText>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.expense_category_id}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <FileText size={16} />
                  <Text>Expense Category</Text>
                </HStack>
              </FormLabel>
              {categoriesLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" color="teal.500" />
                  <Text fontSize="sm" color={helperTextColor}>
                    Loading categories...
                  </Text>
                </HStack>
              ) : (
                <Popover
                  isOpen={isCategoryOpen}
                  onClose={() => {
                    setIsCategoryOpen(false);
                    setHighlightedCategoryIndex(-1);
                  }}
                  matchWidth
                  placement="bottom-start"
                  autoFocus={false}
                  returnFocusOnClose={false}
                >
                  <PopoverTrigger>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none" height="100%">
                        <Icon
                          as={Search}
                          boxSize={4}
                          color={helperTextColor}
                        />
                      </InputLeftElement>
                      <Input
                        value={
                          isCategoryOpen
                            ? categorySearch
                            : (selectedCategory?.name ?? "")
                        }
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          handleInputChange("expense_category_id", "");
                          setHighlightedCategoryIndex(-1);
                          setIsCategoryOpen(true);
                        }}
                        onFocus={() => {
                          setCategorySearch("");
                          setHighlightedCategoryIndex(-1);
                          setIsCategoryOpen(true);
                        }}
                        onKeyDown={handleCategoryKeyDown}
                        placeholder="Search categories (optional)"
                        borderWidth="2px"
                        borderColor={
                          formData.expense_category_id
                            ? "teal.400"
                            : inputBorderColor
                        }
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
                        {formData.expense_category_id ? (
                          <Icon
                            as={X}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => {
                              handleInputChange("expense_category_id", "");
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
                            onClick={() =>
                              setIsCategoryOpen(!isCategoryOpen)
                            }
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
                    {filteredCategories.map((cat: any, i: number) => (
                      <Box
                        key={cat.category_id}
                        px={4}
                        py={3}
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        bg={
                          formData.expense_category_id ===
                            cat.category_id.toString() ||
                          i === highlightedCategoryIndex
                            ? highlightColor
                            : "transparent"
                        }
                        _hover={{ bg: highlightColor }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleInputChange(
                            "expense_category_id",
                            cat.category_id.toString(),
                          );
                          setCategorySearch("");
                          setIsCategoryOpen(false);
                          setHighlightedCategoryIndex(-1);
                        }}
                      >
                        <Text
                          fontSize="sm"
                          fontWeight={
                            formData.expense_category_id ===
                            cat.category_id.toString()
                              ? "semibold"
                              : "normal"
                          }
                        >
                          {cat.name}
                        </Text>
                        {formData.expense_category_id ===
                          cat.category_id.toString() && (
                          <Icon as={Check} boxSize={4} color="teal.500" />
                        )}
                      </Box>
                    ))}
                    {!hasFilteredCategoryResults && (
                      <Box px={4} py={5} textAlign="center">
                        <Text fontSize="sm" color={helperTextColor}>
                          No categories found
                        </Text>
                      </Box>
                    )}
                  </PopoverContent>
                </Popover>
              )}
              <FormErrorMessage>
                {errors.expense_category_id}
              </FormErrorMessage>
              <FormHelperText>
                Required if other charges &gt; 0
              </FormHelperText>
            </FormControl>
          </Stack>

          <FormControl>
            <FormLabel fontWeight="semibold" mb={2}>
              <HStack spacing={2}>
                <FileText size={16} />
                <Text>Notes (Optional)</Text>
              </HStack>
            </FormLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any notes about this transaction..."
              rows={3}
              size="lg"
              bg={inputBg}
              borderColor={inputBorderColor}
              borderWidth="2px"
              borderRadius="md"
              _hover={{ borderColor: "teal.300" }}
              _focus={{
                borderColor: focusBorderColor,
                boxShadow: `0 0 0 1px ${focusBorderColor}`,
              }}
              resize="vertical"
            />
            <FormHelperText>
              Additional details about this {type} transaction
            </FormHelperText>
          </FormControl>
        </VStack>
      </Box>

      {/* Error Display */}
      {errors.general && (
        <Alert
          status="error"
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
        >
          <AlertIcon />
          <Box>
            <AlertTitle fontWeight="bold">Transaction Failed!</AlertTitle>
            <AlertDescription>{errors.general}</AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Mobile-only action buttons that stay at bottom */}
      <Box display={{ base: "block", sm: "none" }}>
        <Button
          onClick={() => handleSubmit()}
          colorScheme={type === "buy" ? "brand" : "red"}
          size="lg"
          width="100%"
          mb={3}
          borderRadius="lg"
          fontWeight="bold"
          isLoading={transactionMutation.isPending}
          loadingText={`Processing ${type === "buy" ? "Purchase" : "Sale"}...`}
          isDisabled={!isFormValid()}
        >
          {type === "buy" ? "Buy Units" : "Sell Units"}
        </Button>

        <Button
          variant="ghost"
          colorScheme="gray"
          onClick={handleClose}
          size="lg"
          width="100%"
          borderRadius="lg"
          isDisabled={transactionMutation.isPending}
        >
          Cancel
        </Button>
      </Box>
    </VStack>
  );
};

export default BuySellForm;
