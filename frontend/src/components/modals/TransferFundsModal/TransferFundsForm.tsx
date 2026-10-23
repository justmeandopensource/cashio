import React from "react";
import { useColorModeValue } from "../../ui/color-mode";
import {
  Input,
  NativeSelect,
  Text,
  VStack,
  HStack,
  Box,
  InputGroup,
  Icon,
  Popover,
  Button,
  Field,
  Dialog,
} from "@chakra-ui/react";
import { Switch } from "@/components/ui/switch";
import { Check, X, Search, ChevronDown, AlertTriangle } from "lucide-react";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import FormNotes from "../../shared/FormNotes";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";
import type { useTransferFundsForm } from "./useTransferFundsForm";

interface TransferFundsFormProps {
  form: ReturnType<typeof useTransferFundsForm>;
  accountId?: string;
  onClose: () => void;
}

const TransferFundsForm: React.FC<TransferFundsFormProps> = ({ form, accountId, onClose }) => {
  // Modern theme colors -- matching CreateTransactionModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const addonColor = useColorModeValue("gray.600", "gray.200");
  const tealTextColor = useColorModeValue("teal.700", "teal.300");

  // Hero section colors (teal for transfers)
  const heroTransferBg = useColorModeValue("teal.50", "teal.900");
  const heroTransferBorder = useColorModeValue("teal.200", "teal.800");
  const heroTransferColor = useColorModeValue("teal.600", "teal.300");
  const heroTransferPlaceholder = useColorModeValue("teal.300", "teal.700");

  // Hero warning colors (when amount exceeds available balance)
  const heroWarningBg = useColorModeValue("red.50", "red.900");
  const heroWarningBorder = useColorModeValue("red.200", "red.800");
  const heroWarningColor = useColorModeValue("red.500", "red.300");
  const heroWarningPlaceholder = useColorModeValue("red.300", "red.700");

  const heroBg = form.isOverBalance ? heroWarningBg : heroTransferBg;
  const heroBorderColor = form.isOverBalance ? heroWarningBorder : heroTransferBorder;
  const heroColor = form.isOverBalance ? heroWarningColor : heroTransferColor;
  const heroPlaceholder = form.isOverBalance ? heroWarningPlaceholder : heroTransferPlaceholder;

  return (
    <Dialog.Body
      px={{ base: 4, sm: 8 }}
      py={{ base: 4, sm: 6 }}
      flex="1"
      display="flex"
      flexDirection="column"
      overflowY="auto"
      overflowX="hidden"
      justifyContent={{ base: "space-between", sm: "flex-start" }}
    >
      <VStack
        gap={{ base: 5, sm: 6 }}
        align="stretch"
        w="100%"
      >
        {/* Hero Amount Section */}
        <Box
          bg={heroBg}
          borderRadius="xl"
          p={{ base: 5, sm: 7 }}
          border="2px solid"
          borderColor={heroBorderColor}
          textAlign="center"
          css={{
            transition: "background-color 0.2s, border-color 0.2s"
          }}
        >
          <HStack justify="center" gap={1.5} mb={3}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              letterSpacing="wider"
              textTransform="uppercase"
              color={heroColor}
              opacity={0.7}
              css={{
                transition: "color 0.2s"
              }}
            >
              Transfer Amount
            </Text>
            {form.amount && parseFloat(form.amount) > 0 && !form.isOverBalance && (
              <Icon boxSize={3.5} color={heroColor} opacity={0.8} asChild><Check /></Icon>
            )}
            {form.isOverBalance && (
              <Icon boxSize={3.5} color={heroColor} opacity={0.9} asChild><AlertTriangle /></Icon>
            )}
          </HStack>
          <Box position="relative" width="100%" display="flex" alignItems="center">
            <Text
              position="absolute"
              left={4}
              fontSize={{ base: "xl", sm: "2xl" }}
              fontWeight="bold"
              color={heroColor}
              lineHeight="1"
              userSelect="none"
              pointerEvents="none"
              css={{
                transition: "color 0.2s"
              }}
            >
              {form.currencySymbol}
            </Text>
            <Input
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => form.setAmount(e.target.value)}
              onKeyDown={(e) => handleNumericInput(e, form.amount)}
              onPaste={(e) => handleNumericPaste(e, form.setAmount)}
              placeholder="0.00"
              fontSize={{ base: "4xl", sm: "5xl" }}
              fontWeight="bold"
              color={heroColor}
              _placeholder={{ color: heroPlaceholder }}
              textAlign="center"
              unstyled
              autoFocus
              width="100%"
              css={{
                transition: "color 0.2s"
              }}
              data-testid="transferfundsmodal-amount-input"
            />
          </Box>
          {form.fromAccountId && (
            <HStack justify="center" gap={1} mt={2}>
              {form.isOverBalance && (
                <Icon boxSize={3} color={heroColor} opacity={0.8} asChild><AlertTriangle /></Icon>
              )}
              <Text
                fontSize="xs"
                color={heroColor}
                opacity={form.isOverBalance ? 0.9 : 0.6}
                fontWeight={form.isOverBalance ? "semibold" : "normal"}
                css={{
                  transition: "color 0.2s, opacity 0.2s"
                }}
              >
                {form.isOverBalance
                  ? `Exceeds available balance of ${form.formatCurrency(form.selectedAccountBalance)}`
                  : `Available: ${form.formatCurrency(form.selectedAccountBalance)}`}
              </Text>
            </HStack>
          )}
        </Box>

        {/* Basic Info Card: Date + From Account */}
        <Box
          bg={cardBg}
          p={{ base: 4, sm: 6 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <VStack gap={5} align="stretch">
            {/* Date Picker */}
            <Field.Root required>
              <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                Transaction date
                <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
              </Field.Label>
              <Box
                css={{
                  '& .react-datepicker-wrapper': { width: "100%" },

                  '& .react-datepicker__input-container input': {
                    width: "100%",
                    height: "48px",
                    borderWidth: "2px",
                    borderColor: inputBorderColor,
                    borderRadius: "lg",
                    bg: inputBg,
                    fontSize: "lg",
                    _hover: { borderColor: "brand.300" },
                    _focus: {
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    },
                  }
                }}
              >
                <ChakraDatePicker
                  selected={form.date}
                  onChange={(d: Date | null) => { if (d) form.setDate(d); }}
                  shouldCloseOnSelect={true}
                  data-testid="transferfundsmodal-date-picker"
                />
              </Box>
            </Field.Root>

            {/* From Account (only shown if no accountId -- at ledger level) */}
            {!accountId && form.accounts.length > 0 && (
              <Field.Root required>
                <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  From Account
                  {form.fromAccountId && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
                </Field.Label>
                <Popover.Root
                  open={form.isFromAccountOpen}
                  autoFocus={false}
                  onOpenChange={e => {
                    if (!(e.open)) { form.setIsFromAccountOpen(false); form.setHighlightedFromIndex(-1); }
                  }}
                  positioning={{
                    sameWidth: true,
                    placement: 'bottom-start'
                  }}>
                  <Popover.Trigger asChild>
                    <InputGroup
                      startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                      endElement={
                        form.fromAccountId ? (
                          <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X
                              onClick={() => {
                                form.setFromAccountId("");
                                form.setFromAccountSearch("");
                                form.setIsFromAccountOpen(false);
                                form.setHighlightedFromIndex(-1);
                              }} /></Icon>
                        ) : (
                          <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown onClick={() => form.setIsFromAccountOpen(!form.isFromAccountOpen)} /></Icon>
                        )
                      }
                      endElementProps={{ pr: 1 }}
                    >
                      <Input
                        size="lg"
                        value={form.isFromAccountOpen ? form.fromAccountSearch : (form.selectedFromAccount?.name ?? "")}
                        onChange={(e) => {
                          form.setFromAccountSearch(e.target.value);
                          form.setFromAccountId("");
                          form.setHighlightedFromIndex(-1);
                          form.setIsFromAccountOpen(true);
                        }}
                        onFocus={() => {
                          form.setFromAccountSearch("");
                          form.setHighlightedFromIndex(-1);
                          form.setIsFromAccountOpen(true);
                        }}
                        onKeyDown={form.handleFromAccountKeyDown}
                        placeholder="Search accounts..."
                        borderWidth="2px"
                        borderColor={form.fromAccountId ? "teal.400" : inputBorderColor}
                        bg={inputBg}
                        borderRadius="lg"
                        _hover={{ borderColor: "brand.300" }}
                        _focus={{
                          borderColor: focusBorderColor,
                          boxShadow: `0 0 0 1px ${focusBorderColor}`,
                        }}
                        autoComplete="off"
                        data-testid="transferfundsmodal-from-account-dropdown"
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
                    _focus={{ outline: "none" }}>{form.filteredFromAssetAccounts.length > 0 && (
                      <>
                        <Box px={3} py={2} bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
                          <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                            Asset
                          </Text>
                        </Box>
                        {form.filteredFromAssetAccounts.map((acc, i) => (
                          <Box
                            key={acc.account_id}
                            px={4} py={3}
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            bg={form.fromAccountId === acc.account_id || i === form.highlightedFromIndex ? highlightColor : "transparent"}
                            _hover={{ bg: highlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              form.setFromAccountId(acc.account_id);
                              form.setFromAccountSearch("");
                              form.setIsFromAccountOpen(false);
                              form.setHighlightedFromIndex(-1);
                            }}
                          >
                            <Text fontSize="sm" fontWeight={form.fromAccountId === acc.account_id ? "semibold" : "normal"}>
                              {acc.name}
                            </Text>
                            {form.fromAccountId === acc.account_id && <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>}
                          </Box>
                        ))}
                      </>
                    )}
                    {form.filteredFromLiabilityAccounts.length > 0 && (
                      <>
                        <Box
                          px={3} py={2} bg={cardBg}
                          borderBottom="1px solid" borderColor={borderColor}
                          borderTop={form.filteredFromAssetAccounts.length > 0 ? "1px solid" : undefined}
                          borderTopColor={borderColor}
                        >
                          <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                            Liability
                          </Text>
                        </Box>
                        {form.filteredFromLiabilityAccounts.map((acc, i) => {
                          const flatIndex = form.filteredFromAssetAccounts.length + i;
                          return (
                            <Box
                              key={acc.account_id}
                              px={4} py={3}
                              cursor="pointer"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              bg={form.fromAccountId === acc.account_id || flatIndex === form.highlightedFromIndex ? highlightColor : "transparent"}
                              _hover={{ bg: highlightColor }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                form.setFromAccountId(acc.account_id);
                                form.setFromAccountSearch("");
                                form.setIsFromAccountOpen(false);
                                form.setHighlightedFromIndex(-1);
                              }}
                            >
                              <Text fontSize="sm" fontWeight={form.fromAccountId === acc.account_id ? "semibold" : "normal"}>
                                {acc.name}
                              </Text>
                              {form.fromAccountId === acc.account_id && <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>}
                            </Box>
                          );
                        })}
                      </>
                    )}
                    {!form.hasFilteredFromResults && (
                      <Box px={4} py={5} textAlign="center">
                        <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                      </Box>
                    )}</Popover.Content>
                  </Popover.Positioner>
                </Popover.Root>
                <Field.HelperText mt={2} color={helperTextColor}>
                  Select the account to transfer funds from
                </Field.HelperText>
              </Field.Root>
            )}
          </VStack>
        </Box>

        {/* Different Ledger Toggle Card */}
        <Box
          bg={cardBg}
          p={{ base: 4, sm: 6 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <HStack justifyContent="space-between" align="center">
            <Box>
              <Text fontWeight="semibold" mb={1}>
                Transfer to Different Ledger
              </Text>
              <Text fontSize="sm" color={secondaryTextColor}>
                Send funds across ledger books
              </Text>
            </Box>
            <Switch
              colorPalette="brand"
              size="lg"
              checked={form.isDifferentLedger}
              onCheckedChange={(e) => {
                form.setIsDifferentLedger(e.checked);
                form.setToAccountId("");
                form.setToAccountSearch("");
                form.setIsToAccountOpen(false);
                form.setHighlightedToIndex(-1);
                if (!e.checked) {
                  form.setDestinationLedgerId("");
                  form.setDestinationAmount("");
                }
              }}
            />
          </HStack>
        </Box>

        {/* Destination Card */}
        <Box
          bg={highlightColor}
          p={{ base: 4, sm: 6 }}
          borderRadius="xl"
          border="2px solid"
          borderColor="teal.200"
        >
          <VStack gap={5} align="stretch">
            <Text fontWeight="bold" color={tealTextColor}>
              Destination
            </Text>

            {/* Destination Ledger (if different ledger) */}
            {form.isDifferentLedger && (
              <Field.Root required>
                <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Destination Ledger
                  {form.destinationLedgerId && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
                </Field.Label>
                <NativeSelect.Root size="lg">
                  <NativeSelect.Field
                    value={form.destinationLedgerId}
                    onChange={(e) => {
                      const selectedLedger = form.ledgers.find(
                        ledger => ledger.ledger_id == e.target.value,
                      );
                      form.setDestinationLedgerId(e.target.value);
                      if (selectedLedger) {
                        // destinationCurrencySymbol is set via the effect in the hook
                      }
                      form.setToAccountId("");
                      form.setToAccountSearch("");
                    }}
                    placeholder="Select destination ledger"
                    borderWidth="2px"
                    borderColor={form.destinationLedgerId ? "teal.400" : inputBorderColor}
                    bg={inputBg}
                    borderRadius="lg"
                    _hover={{ borderColor: "brand.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    data-testid="transferfundsmodal-to-ledger-dropdown">
                    {form.getFilteredLedgers(form.ledgers).map((ledger) => (
                      <option key={ledger.ledger_id} value={ledger.ledger_id}>
                        {ledger.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Field.HelperText mt={2} color={helperTextColor}>
                  Choose the destination ledger
                </Field.HelperText>
              </Field.Root>
            )}

            {/* To Account -- searchable Popover */}
            <Field.Root required>
              <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                To Account
                {form.toAccountId && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
              </Field.Label>
              <Popover.Root
                open={form.isToAccountOpen}
                autoFocus={false}
                onOpenChange={e => {
                  if (!(e.open)) { form.setIsToAccountOpen(false); form.setHighlightedToIndex(-1); }
                }}
                positioning={{
                  sameWidth: true,
                  placement: 'bottom-start'
                }}>
                <Popover.Trigger asChild>
                  <InputGroup
                    startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                    endElement={
                      form.toAccountId ? (
                        <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X
                            onClick={() => {
                              form.setToAccountId("");
                              form.setToAccountSearch("");
                              form.setIsToAccountOpen(false);
                              form.setHighlightedToIndex(-1);
                            }} /></Icon>
                      ) : (
                        <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown onClick={() => form.setIsToAccountOpen(!form.isToAccountOpen)} /></Icon>
                      )
                    }
                    endElementProps={{ pr: 1 }}
                  >
                    <Input
                      size="lg"
                      value={form.isToAccountOpen ? form.toAccountSearch : (form.selectedToAccount?.name ?? "")}
                      onChange={(e) => {
                        form.setToAccountSearch(e.target.value);
                        form.setToAccountId("");
                        form.setHighlightedToIndex(-1);
                        form.setIsToAccountOpen(true);
                      }}
                      onFocus={() => {
                        form.setToAccountSearch("");
                        form.setHighlightedToIndex(-1);
                        form.setIsToAccountOpen(true);
                      }}
                      onKeyDown={form.handleToAccountKeyDown}
                      placeholder="Search accounts..."
                      borderWidth="2px"
                      borderColor={form.toAccountId ? "teal.400" : inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={{ borderColor: "brand.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      autoComplete="off"
                      data-testid="transferfundsmodal-to-account-dropdown"
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
                  _focus={{ outline: "none" }}>{form.filteredToAssetAccounts.length > 0 && (
                    <>
                      <Box px={3} py={2} bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                          Asset
                        </Text>
                      </Box>
                      {form.filteredToAssetAccounts.map((acc, i) => (
                        <Box
                          key={acc.account_id}
                          px={4} py={3}
                          cursor="pointer"
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          bg={form.toAccountId === acc.account_id || i === form.highlightedToIndex ? highlightColor : "transparent"}
                          _hover={{ bg: highlightColor }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            form.setToAccountId(acc.account_id);
                            form.setToAccountSearch("");
                            form.setIsToAccountOpen(false);
                            form.setHighlightedToIndex(-1);
                          }}
                        >
                          <Text fontSize="sm" fontWeight={form.toAccountId === acc.account_id ? "semibold" : "normal"}>
                            {acc.name}
                          </Text>
                          {form.toAccountId === acc.account_id && <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>}
                        </Box>
                      ))}
                    </>
                  )}
                  {form.filteredToLiabilityAccounts.length > 0 && (
                    <>
                      <Box
                        px={3} py={2} bg={cardBg}
                        borderBottom="1px solid" borderColor={borderColor}
                        borderTop={form.filteredToAssetAccounts.length > 0 ? "1px solid" : undefined}
                        borderTopColor={borderColor}
                      >
                        <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                          Liability
                        </Text>
                      </Box>
                      {form.filteredToLiabilityAccounts.map((acc, i) => {
                        const flatIndex = form.filteredToAssetAccounts.length + i;
                        return (
                          <Box
                            key={acc.account_id}
                            px={4} py={3}
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            bg={form.toAccountId === acc.account_id || flatIndex === form.highlightedToIndex ? highlightColor : "transparent"}
                            _hover={{ bg: highlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              form.setToAccountId(acc.account_id);
                              form.setToAccountSearch("");
                              form.setIsToAccountOpen(false);
                              form.setHighlightedToIndex(-1);
                            }}
                          >
                            <Text fontSize="sm" fontWeight={form.toAccountId === acc.account_id ? "semibold" : "normal"}>
                              {acc.name}
                            </Text>
                            {form.toAccountId === acc.account_id && <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>}
                          </Box>
                        );
                      })}
                    </>
                  )}
                  {!form.hasFilteredToResults && (
                    <Box px={4} py={5} textAlign="center">
                      <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                    </Box>
                  )}</Popover.Content>
                </Popover.Positioner>
              </Popover.Root>
              <Field.HelperText mt={2} color={helperTextColor}>
                Select the account to transfer funds to
              </Field.HelperText>
            </Field.Root>

            {/* Destination Amount (if different ledger) */}
            {form.isDifferentLedger && (
              <Field.Root required>
                <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Destination Amount
                  {form.destinationAmount && parseFloat(form.destinationAmount) > 0 && (
                    <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                  )}
                </Field.Label>
                <InputGroup
                  startAddon={form.destinationCurrencySymbol || form.currencySymbol}
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
                    type="text"
                    inputMode="decimal"
                    size="lg"
                    value={form.destinationAmount}
                    onChange={(e) => form.setDestinationAmount(e.target.value)}
                    onKeyDown={(e) => handleNumericInput(e, form.destinationAmount)}
                    onPaste={(e) => handleNumericPaste(e, form.setDestinationAmount)}
                    placeholder="0.00"
                    borderWidth="2px"
                    borderColor={form.destinationAmount && parseFloat(form.destinationAmount) > 0 ? "teal.400" : inputBorderColor}
                    bg={inputBg}
                    borderRadius="lg"
                    _hover={{ borderColor: "brand.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                  />
                </InputGroup>
                <Field.HelperText mt={2} color={helperTextColor}>
                  Enter the amount in the destination ledger&apos;s currency
                </Field.HelperText>
              </Field.Root>
            )}
          </VStack>
        </Box>

        {/* Transfer Fee Card */}
        <Box
          bg={cardBg}
          p={{ base: 4, sm: 6 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <VStack gap={5} align="stretch">
            <Text fontWeight="semibold" color={secondaryTextColor} fontSize="sm">
              Transfer Fee <Text as="span" fontWeight="normal">(optional)</Text>
            </Text>

            {/* Fee Amount */}
            <Field.Root>
              <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                Fee Amount
                {form.feeAmount && parseFloat(form.feeAmount) > 0 && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
              </Field.Label>
              <InputGroup
                startAddon={form.currencySymbol}
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
                  type="text"
                  inputMode="decimal"
                  size="lg"
                  value={form.feeAmount}
                  onChange={(e) => form.setFeeAmount(e.target.value)}
                  onKeyDown={(e) => handleNumericInput(e, form.feeAmount)}
                  onPaste={(e) => handleNumericPaste(e, form.setFeeAmount)}
                  placeholder="0.00"
                  borderWidth="2px"
                  borderColor={form.feeAmount && parseFloat(form.feeAmount) > 0 ? "teal.400" : inputBorderColor}
                  bg={inputBg}
                  borderRadius="lg"
                  _hover={{ borderColor: "brand.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                />
              </InputGroup>
              <Field.HelperText mt={2} color={helperTextColor}>
                Fee charged by the transfer service (e.g. Wise, Remitly)
              </Field.HelperText>
            </Field.Root>

            {/* Fee Category */}
            <Field.Root>
              <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                Fee Category
                {form.feeCategoryId && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
              </Field.Label>
              <Popover.Root
                open={form.isFeeCategoryOpen}
                autoFocus={false}
                onOpenChange={e => {
                  if (!(e.open)) { form.setIsFeeCategoryOpen(false); form.setHighlightedFeeCategoryIndex(-1); }
                }}
                positioning={{
                  sameWidth: true,
                  placement: 'bottom-start'
                }}>
                <Popover.Trigger asChild>
                  <InputGroup
                    startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                    endElement={
                      form.feeCategoryId ? (
                        <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X
                            onClick={() => {
                              form.setFeeCategoryId("");
                              form.setFeeCategorySearch("");
                              form.setIsFeeCategoryOpen(false);
                              form.setHighlightedFeeCategoryIndex(-1);
                            }} /></Icon>
                      ) : (
                        <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown onClick={() => form.setIsFeeCategoryOpen(!form.isFeeCategoryOpen)} /></Icon>
                      )
                    }
                    endElementProps={{ pr: 1 }}
                  >
                    <Input
                      size="lg"
                      value={form.isFeeCategoryOpen ? form.feeCategorySearch : (form.selectedFeeCategory?.name ?? "")}
                      onChange={(e) => {
                        form.setFeeCategorySearch(e.target.value);
                        form.setFeeCategoryId("");
                        form.setHighlightedFeeCategoryIndex(-1);
                        form.setIsFeeCategoryOpen(true);
                      }}
                      onFocus={() => {
                        form.setFeeCategorySearch("");
                        form.setHighlightedFeeCategoryIndex(-1);
                        form.setIsFeeCategoryOpen(true);
                      }}
                      onKeyDown={form.handleFeeCategoryKeyDown}
                      placeholder="Search expense categories..."
                      borderWidth="2px"
                      borderColor={form.feeCategoryId ? "teal.400" : inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={{ borderColor: "brand.300" }}
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
                  _focus={{ outline: "none" }}>{form.filteredFeeCategories.length > 0 ? (
                    form.filteredFeeCategories.map((cat, i) => (
                      <Box
                        key={cat.category_id}
                        px={4} py={3}
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        bg={form.feeCategoryId === cat.category_id || i === form.highlightedFeeCategoryIndex ? highlightColor : "transparent"}
                        _hover={{ bg: highlightColor }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          form.setFeeCategoryId(cat.category_id);
                          form.setFeeCategorySearch("");
                          form.setIsFeeCategoryOpen(false);
                          form.setHighlightedFeeCategoryIndex(-1);
                        }}
                      >
                        <Text fontSize="sm" fontWeight={form.feeCategoryId === cat.category_id ? "semibold" : "normal"}>
                          {cat.name}
                        </Text>
                        {form.feeCategoryId === cat.category_id && <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>}
                      </Box>
                    ))
                  ) : (
                    <Box px={4} py={5} textAlign="center">
                      <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                    </Box>
                  )}</Popover.Content>
                </Popover.Positioner>
              </Popover.Root>
              <Field.HelperText mt={2} color={helperTextColor}>
                Expense category for tracking the fee (e.g. Bank Charges)
              </Field.HelperText>
            </Field.Root>
          </VStack>
        </Box>

        {/* Notes Card */}
        <Box
          bg={cardBg}
          p={{ base: 4, sm: 6 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <FormNotes
            ledgerId={form.ledgerId as string}
            notes={form.notes}
            setNotes={form.setNotes}
            borderColor={inputBorderColor}
            onDropdownOpenChange={form.setIsNotesSuggestionsOpen}
          />
        </Box>
      </VStack>

      {/* Mobile-only action buttons that stay at bottom */}
      <Box display={{ base: "block", sm: "none" }} mt={6}>
        <Button
          onClick={form.handleSubmit}
          colorPalette="brand"
          size="lg"
          width="100%"
          mb={3}
          borderRadius="lg"
          fontWeight="bold"
          loading={form.isLoading}
          loadingText={form.isEditMode ? "Updating..." : "Transferring..."}
          disabled={form.isSaveDisabled}
        >
          {form.isEditMode ? "Save Changes" : "Complete Transfer"}
        </Button>
        <Button
          variant="ghost"
          colorPalette="gray"
          onClick={onClose}
          size="lg"
          width="100%"
          borderRadius="lg"
          disabled={form.isLoading}
        >
          Cancel
        </Button>
      </Box>
    </Dialog.Body>
  );
};

export default TransferFundsForm;
