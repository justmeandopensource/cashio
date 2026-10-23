import { FC } from "react";
import { useColorModeValue } from "../../../../../components/ui/color-mode";
import {
  VStack,
  Input,
  Textarea,
  Alert,
  HStack,
  Text,
  Box,
  Stack,
  Spinner,
  Icon,
  Popover,
  Button,
  Field,
} from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/input-group";
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
    <VStack gap={{ base: 5, sm: 6 }} align="stretch">
      {/* Transaction Details Card */}
      <Box
        bg={cardBg}
        p={{ base: 4, sm: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack gap={5} align="stretch">
          <Stack direction={{ base: "column", md: "row" }} gap={4}>
            <Field.Root flex={1} invalid={!!errors.units}>
              <Field.Label fontWeight="semibold" mb={2}>
                <HStack gap={2}>
                  <Coins size={16} />
                  <Text>Units to {type}</Text>
                  {formData.units && parseFloat(formData.units) > 0 && (
                    <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                  )}
                </HStack>
              </Field.Label>
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
              <Field.ErrorText>{errors.units}</Field.ErrorText>
              <Field.HelperText>
                {type === "buy" ? "Current holdings" : "Available to sell"}:{" "}
                {selectedFund ? formatUnits(totalUnits) : "0"}
              </Field.HelperText>
            </Field.Root>

            <Field.Root flex={1} invalid={!!errors.amount_excluding_charges}>
              <Field.Label fontWeight="semibold" mb={2}>
                <HStack gap={2}>
                  <DollarSign size={16} />
                  <Text>Amount</Text>
                  {formData.amount_excluding_charges &&
                    parseFloat(formData.amount_excluding_charges) > 0 && (
                      <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                    )}
                </HStack>
              </Field.Label>
              <InputGroup
                startAddon={currencySymbol || "\u20B9"}
                startAddonProps={{
                  size: "lg",
                  bg: inputBorderColor,
                  borderWidth: "2px",
                  borderColor: inputBorderColor,
                  color: addonColor,
                  fontWeight: "semibold",
                }}
              >
                <Input
                  size="lg"
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
              <Field.ErrorText>
                {errors.amount_excluding_charges}
              </Field.ErrorText>
              <Field.HelperText>
                NAV per unit: {currencySymbol || "\u20B9"}
                {formatAmount(navPerUnit)}
              </Field.HelperText>
            </Field.Root>
          </Stack>

          <Stack direction={{ base: "column", md: "row" }} gap={4}>
            <Field.Root flex={1} invalid={!!errors.account_id}>
              <Field.Label fontWeight="semibold" mb={2}>
                <HStack gap={2}>
                  <Building2 size={16} />
                  <Text>
                    {type === "buy"
                      ? "Source Account"
                      : "Destination Account"}
                  </Text>
                  {formData.account_id && (
                    <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                  )}
                </HStack>
              </Field.Label>
              {accountsLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" color="teal.500" />
                  <Text fontSize="sm" color={helperTextColor}>
                    Loading accounts...
                  </Text>
                </HStack>
              ) : (
                <Popover.Root
                  open={isAccountOpen}
                  autoFocus={false}
                  onOpenChange={e => {
                    if (!(e.open)) { setIsAccountOpen(false);
                    setHighlightedAccountIndex(-1); }
                  }}
                  positioning={{
                    sameWidth: true,
                    placement: 'bottom-start'
                  }}>
                  <Popover.Trigger asChild>
                    <InputGroup
                      w="full"
                      startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                      endElement={
                        formData.account_id ? (
                          <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X
                              onClick={() => {
                                handleInputChange("account_id", "");
                                setAccountSearch("");
                                setIsAccountOpen(false);
                                setHighlightedAccountIndex(-1);
                              }} /></Icon>
                        ) : (
                          <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown onClick={() => setIsAccountOpen(!isAccountOpen)} /></Icon>
                        )
                      }
                      endElementProps={{ pr: 1 }}
                    >
                      <Input
                        size="lg"
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
                    _focus={{ outline: "none" }}>{filteredAssetAccounts.length > 0 && (
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
                              <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>
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
                                <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>
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
                    )}</Popover.Content>
                  </Popover.Positioner>
                </Popover.Root>
              )}
              <Field.ErrorText>{errors.account_id}</Field.ErrorText>
              <Field.HelperText>
                {type === "buy"
                  ? "Account to deduct funds from"
                  : "Account to receive funds"}
              </Field.HelperText>
            </Field.Root>

            <Field.Root flex={1} invalid={!!errors.transaction_date}>
              <Field.Label fontWeight="semibold" mb={2}>
                <HStack gap={2}>
                  <Calendar size={16} />
                  <Text>Date</Text>
                  <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                </HStack>
              </Field.Label>
              <Box
                css={{
                  '& .react-datepicker-wrapper': {
                    width: "100%",
                  },

                  '& .react-datepicker__input-container input': {
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
                  }
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
              <Field.ErrorText>{errors.transaction_date}</Field.ErrorText>
              <Field.HelperText>Transaction date</Field.HelperText>
            </Field.Root>
          </Stack>

          <Stack direction={{ base: "column", md: "row" }} gap={4}>
            <Field.Root flex={1} invalid={!!errors.other_charges}>
              <Field.Label fontWeight="semibold" mb={2}>
                <HStack gap={2}>
                  <DollarSign size={16} />
                  <Text>Other Charges</Text>
                </HStack>
              </Field.Label>
              <InputGroup
                startAddon={currencySymbol || "\u20B9"}
                startAddonProps={{
                  size: "lg",
                  bg: inputBorderColor,
                  borderWidth: "2px",
                  borderColor: inputBorderColor,
                  color: addonColor,
                  fontWeight: "semibold",
                }}
              >
                <Input
                  size="lg"
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
              <Field.ErrorText>{errors.other_charges}</Field.ErrorText>
              <Field.HelperText>
                Stamp duty, transaction fees, etc.
              </Field.HelperText>
            </Field.Root>

            <Field.Root flex={1} invalid={!!errors.expense_category_id}>
              <Field.Label fontWeight="semibold" mb={2}>
                <HStack gap={2}>
                  <FileText size={16} />
                  <Text>Expense Category</Text>
                </HStack>
              </Field.Label>
              {categoriesLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" color="teal.500" />
                  <Text fontSize="sm" color={helperTextColor}>
                    Loading categories...
                  </Text>
                </HStack>
              ) : (
                <Popover.Root
                  open={isCategoryOpen}
                  autoFocus={false}
                  onOpenChange={e => {
                    if (!(e.open)) { setIsCategoryOpen(false);
                    setHighlightedCategoryIndex(-1); }
                  }}
                  positioning={{
                    sameWidth: true,
                    placement: 'bottom-start'
                  }}>
                  <Popover.Trigger asChild>
                    <InputGroup
                      w="full"
                      startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                      endElement={
                        formData.expense_category_id ? (
                          <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X
                              onClick={() => {
                                handleInputChange("expense_category_id", "");
                                setCategorySearch("");
                                setIsCategoryOpen(false);
                                setHighlightedCategoryIndex(-1);
                              }} /></Icon>
                        ) : (
                          <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown
                              onClick={() =>
                                setIsCategoryOpen(!isCategoryOpen)
                              } /></Icon>
                        )
                      }
                      endElementProps={{ pr: 1 }}
                    >
                      <Input
                        size="lg"
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
                    _focus={{ outline: "none" }}>{filteredCategories.map((cat: any, i: number) => (
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
                          <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>
                        )}
                      </Box>
                    ))}
                    {!hasFilteredCategoryResults && (
                      <Box px={4} py={5} textAlign="center">
                        <Text fontSize="sm" color={helperTextColor}>
                          No categories found
                        </Text>
                      </Box>
                    )}</Popover.Content>
                  </Popover.Positioner>
                </Popover.Root>
              )}
              <Field.ErrorText>
                {errors.expense_category_id}
              </Field.ErrorText>
              <Field.HelperText>
                Required if other charges &gt; 0
              </Field.HelperText>
            </Field.Root>
          </Stack>

          <Field.Root>
            <Field.Label fontWeight="semibold" mb={2}>
              <HStack gap={2}>
                <FileText size={16} />
                <Text>Notes (Optional)</Text>
              </HStack>
            </Field.Label>
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
            <Field.HelperText>
              Additional details about this {type} transaction
            </Field.HelperText>
          </Field.Root>
        </VStack>
      </Box>

      {/* Error Display */}
      {errors.general && (
        <Alert.Root
          status="error"
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
        >
          <Alert.Indicator />
          <Box>
            <Alert.Title fontWeight="bold">Transaction Failed!</Alert.Title>
            <Alert.Description>{errors.general}</Alert.Description>
          </Box>
        </Alert.Root>
      )}

      {/* Mobile-only action buttons that stay at bottom */}
      <Box display={{ base: "block", sm: "none" }}>
        <Button
          onClick={() => handleSubmit()}
          colorPalette={type === "buy" ? "brand" : "red"}
          size="lg"
          width="100%"
          mb={3}
          borderRadius="lg"
          fontWeight="bold"
          loading={transactionMutation.isPending}
          loadingText={`Processing ${type === "buy" ? "Purchase" : "Sale"}...`}
          disabled={!isFormValid()}
        >
          {type === "buy" ? "Buy Units" : "Sell Units"}
        </Button>

        <Button
          variant="ghost"
          colorPalette="gray"
          onClick={handleClose}
          size="lg"
          width="100%"
          borderRadius="lg"
          disabled={transactionMutation.isPending}
        >
          Cancel
        </Button>
      </Box>
    </VStack>
  );
};

export default BuySellForm;
