import React from "react";
import {
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Text,
  VStack,
  HStack,
  Box,
  useColorModeValue,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightElement,
  FormHelperText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@chakra-ui/react";
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
    <ModalBody
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
        spacing={{ base: 5, sm: 6 }}
        align="stretch"
        w="100%"
        sx={{ "& .chakra-form__required-indicator": { display: "none" } }}
      >
        {/* Hero Amount Section */}
        <Box
          bg={heroBg}
          borderRadius="xl"
          p={{ base: 5, sm: 7 }}
          border="2px solid"
          borderColor={heroBorderColor}
          textAlign="center"
          sx={{ transition: "background-color 0.2s, border-color 0.2s" }}
        >
          <HStack justify="center" spacing={1.5} mb={3}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              letterSpacing="wider"
              textTransform="uppercase"
              color={heroColor}
              opacity={0.7}
              sx={{ transition: "color 0.2s" }}
            >
              Transfer Amount
            </Text>
            {form.amount && parseFloat(form.amount) > 0 && !form.isOverBalance && (
              <Icon as={Check} boxSize={3.5} color={heroColor} opacity={0.8} />
            )}
            {form.isOverBalance && (
              <Icon as={AlertTriangle} boxSize={3.5} color={heroColor} opacity={0.9} />
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
              sx={{ transition: "color 0.2s" }}
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
              variant="unstyled"
              autoFocus
              width="100%"
              sx={{ transition: "color 0.2s" }}
              data-testid="transferfundsmodal-amount-input"
            />
          </Box>
          {form.fromAccountId && (
            <HStack justify="center" spacing={1} mt={2}>
              {form.isOverBalance && (
                <Icon as={AlertTriangle} boxSize={3} color={heroColor} opacity={0.8} />
              )}
              <Text
                fontSize="xs"
                color={heroColor}
                opacity={form.isOverBalance ? 0.9 : 0.6}
                fontWeight={form.isOverBalance ? "semibold" : "normal"}
                sx={{ transition: "color 0.2s, opacity 0.2s" }}
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
          <VStack spacing={5} align="stretch">
            {/* Date Picker */}
            <FormControl isRequired>
              <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                Transaction date
                <Icon as={Check} boxSize={3.5} color="teal.500" />
              </FormLabel>
              <Box
                sx={{
                  ".react-datepicker-wrapper": { width: "100%" },
                  ".react-datepicker__input-container input": {
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
                  },
                }}
              >
                <ChakraDatePicker
                  selected={form.date}
                  onChange={(d: Date | null) => { if (d) form.setDate(d); }}
                  shouldCloseOnSelect={true}
                  data-testid="transferfundsmodal-date-picker"
                />
              </Box>
            </FormControl>

            {/* From Account (only shown if no accountId -- at ledger level) */}
            {!accountId && form.accounts.length > 0 && (
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  From Account
                  {form.fromAccountId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                </FormLabel>
                <Popover
                  isOpen={form.isFromAccountOpen}
                  onClose={() => { form.setIsFromAccountOpen(false); form.setHighlightedFromIndex(-1); }}
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
                      <InputRightElement height="100%" pr={1}>
                        {form.fromAccountId ? (
                          <Icon
                            as={X}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => {
                              form.setFromAccountId("");
                              form.setFromAccountSearch("");
                              form.setIsFromAccountOpen(false);
                              form.setHighlightedFromIndex(-1);
                            }}
                          />
                        ) : (
                          <Icon
                            as={ChevronDown}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => form.setIsFromAccountOpen(!form.isFromAccountOpen)}
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
                    {form.filteredFromAssetAccounts.length > 0 && (
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
                            {form.fromAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                              {form.fromAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                            </Box>
                          );
                        })}
                      </>
                    )}
                    {!form.hasFilteredFromResults && (
                      <Box px={4} py={5} textAlign="center">
                        <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                      </Box>
                    )}
                  </PopoverContent>
                </Popover>
                <FormHelperText mt={2} color={helperTextColor}>
                  Select the account to transfer funds from
                </FormHelperText>
              </FormControl>
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
              colorScheme="brand"
              size="lg"
              isChecked={form.isDifferentLedger}
              onChange={(e) => {
                form.setIsDifferentLedger(e.target.checked);
                form.setToAccountId("");
                form.setToAccountSearch("");
                form.setIsToAccountOpen(false);
                form.setHighlightedToIndex(-1);
                if (!e.target.checked) {
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
          <VStack spacing={5} align="stretch">
            <Text fontWeight="bold" color={tealTextColor}>
              Destination
            </Text>

            {/* Destination Ledger (if different ledger) */}
            {form.isDifferentLedger && (
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Destination Ledger
                  {form.destinationLedgerId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                </FormLabel>
                <Select
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
                  size="lg"
                  borderRadius="lg"
                  _hover={{ borderColor: "brand.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                  data-testid="transferfundsmodal-to-ledger-dropdown"
                >
                  {form.getFilteredLedgers(form.ledgers).map((ledger) => (
                    <option key={ledger.ledger_id} value={ledger.ledger_id}>
                      {ledger.name}
                    </option>
                  ))}
                </Select>
                <FormHelperText mt={2} color={helperTextColor}>
                  Choose the destination ledger
                </FormHelperText>
              </FormControl>
            )}

            {/* To Account -- searchable Popover */}
            <FormControl isRequired>
              <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                To Account
                {form.toAccountId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
              </FormLabel>
              <Popover
                isOpen={form.isToAccountOpen}
                onClose={() => { form.setIsToAccountOpen(false); form.setHighlightedToIndex(-1); }}
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
                    <InputRightElement height="100%" pr={1}>
                      {form.toAccountId ? (
                        <Icon
                          as={X}
                          boxSize={4}
                          color={helperTextColor}
                          cursor="pointer"
                          onClick={() => {
                            form.setToAccountId("");
                            form.setToAccountSearch("");
                            form.setIsToAccountOpen(false);
                            form.setHighlightedToIndex(-1);
                          }}
                        />
                      ) : (
                        <Icon
                          as={ChevronDown}
                          boxSize={4}
                          color={helperTextColor}
                          cursor="pointer"
                          onClick={() => form.setIsToAccountOpen(!form.isToAccountOpen)}
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
                  {form.filteredToAssetAccounts.length > 0 && (
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
                          {form.toAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                            {form.toAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                          </Box>
                        );
                      })}
                    </>
                  )}
                  {!form.hasFilteredToResults && (
                    <Box px={4} py={5} textAlign="center">
                      <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                    </Box>
                  )}
                </PopoverContent>
              </Popover>
              <FormHelperText mt={2} color={helperTextColor}>
                Select the account to transfer funds to
              </FormHelperText>
            </FormControl>

            {/* Destination Amount (if different ledger) */}
            {form.isDifferentLedger && (
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Destination Amount
                  {form.destinationAmount && parseFloat(form.destinationAmount) > 0 && (
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
                  )}
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftAddon
                    bg={inputBorderColor}
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    color={addonColor}
                    fontWeight="semibold"
                  >
                    {form.destinationCurrencySymbol || form.currencySymbol}
                  </InputLeftAddon>
                  <Input
                    type="text"
                    inputMode="decimal"
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
                <FormHelperText mt={2} color={helperTextColor}>
                  Enter the amount in the destination ledger&apos;s currency
                </FormHelperText>
              </FormControl>
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
          <VStack spacing={5} align="stretch">
            <Text fontWeight="semibold" color={secondaryTextColor} fontSize="sm">
              Transfer Fee <Text as="span" fontWeight="normal">(optional)</Text>
            </Text>

            {/* Fee Amount */}
            <FormControl>
              <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                Fee Amount
                {form.feeAmount && parseFloat(form.feeAmount) > 0 && <Icon as={Check} boxSize={3.5} color="teal.500" />}
              </FormLabel>
              <InputGroup size="lg">
                <InputLeftAddon
                  bg={inputBorderColor}
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  color={addonColor}
                  fontWeight="semibold"
                >
                  {form.currencySymbol}
                </InputLeftAddon>
                <Input
                  type="text"
                  inputMode="decimal"
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
              <FormHelperText mt={2} color={helperTextColor}>
                Fee charged by the transfer service (e.g. Wise, Remitly)
              </FormHelperText>
            </FormControl>

            {/* Fee Category */}
            <FormControl>
              <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                Fee Category
                {form.feeCategoryId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
              </FormLabel>
              <Popover
                isOpen={form.isFeeCategoryOpen}
                onClose={() => { form.setIsFeeCategoryOpen(false); form.setHighlightedFeeCategoryIndex(-1); }}
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
                    <InputRightElement height="100%" pr={1}>
                      {form.feeCategoryId ? (
                        <Icon
                          as={X}
                          boxSize={4}
                          color={helperTextColor}
                          cursor="pointer"
                          onClick={() => {
                            form.setFeeCategoryId("");
                            form.setFeeCategorySearch("");
                            form.setIsFeeCategoryOpen(false);
                            form.setHighlightedFeeCategoryIndex(-1);
                          }}
                        />
                      ) : (
                        <Icon
                          as={ChevronDown}
                          boxSize={4}
                          color={helperTextColor}
                          cursor="pointer"
                          onClick={() => form.setIsFeeCategoryOpen(!form.isFeeCategoryOpen)}
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
                  {form.filteredFeeCategories.length > 0 ? (
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
                        {form.feeCategoryId === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                      </Box>
                    ))
                  ) : (
                    <Box px={4} py={5} textAlign="center">
                      <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                    </Box>
                  )}
                </PopoverContent>
              </Popover>
              <FormHelperText mt={2} color={helperTextColor}>
                Expense category for tracking the fee (e.g. Bank Charges)
              </FormHelperText>
            </FormControl>
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
          colorScheme="brand"
          size="lg"
          width="100%"
          mb={3}
          borderRadius="lg"
          fontWeight="bold"
          isLoading={form.isLoading}
          loadingText={form.isEditMode ? "Updating..." : "Transferring..."}
          isDisabled={form.isSaveDisabled}
        >
          {form.isEditMode ? "Save Changes" : "Complete Transfer"}
        </Button>
        <Button
          variant="ghost"
          colorScheme="gray"
          onClick={onClose}
          size="lg"
          width="100%"
          borderRadius="lg"
          isDisabled={form.isLoading}
        >
          Cancel
        </Button>
      </Box>
    </ModalBody>
  );
};

export default TransferFundsForm;
