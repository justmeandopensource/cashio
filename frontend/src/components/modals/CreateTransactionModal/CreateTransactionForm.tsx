import React from "react";
import {
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Switch,
  Text,
  VStack,
  HStack,
  Box,
  useColorModeValue,
  Stack,
  FormHelperText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Check, X, Search, ChevronDown } from "lucide-react";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import FormSplits from "./FormSplits";
import FormNotes from "@/components/shared/FormNotes";
import FormStore from "@/components/shared/FormStore";
import FormLocation from "@/components/shared/FormLocation";
import FormTags from "@/components/shared/FormTags";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";
import type { CreateTransactionFormProps } from "./types";

const CreateTransactionForm: React.FC<CreateTransactionFormProps> = ({
  date,
  setDate,
  type,
  setType,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  selectedAccountId,
  setSelectedAccountId,
  notes,
  setNotes,
  store,
  setStore,
  location,
  setLocation,
  isSplit,
  splits,
  setSplits,
  tags,
  setTags,
  categorySearch,
  setCategorySearch,
  isCategoryOpen,
  setIsCategoryOpen,
  highlightedIndex,
  setHighlightedIndex,
  accountSearch,
  setAccountSearch,
  isAccountOpen,
  setIsAccountOpen,
  highlightedAccountIndex,
  setHighlightedAccountIndex,
  categories,
  accounts,
  selectedCategory,
  selectedAccount,
  filteredIncomeCategories,
  filteredExpenseCategories,
  hasFilteredResults,
  allFilteredCategories: _allFilteredCategories,
  filteredAssetAccounts,
  filteredLiabilityAccounts,
  hasFilteredAccountResults,
  allFilteredAccounts: _allFilteredAccounts,
  handleCategoryKeyDown,
  handleAccountKeyDown,
  handleSplitToggle,
  calculateRemainingAmount,
  handleSubmit,
  setIsNotesSuggestionsOpen,
  setIsStoreSuggestionsOpen,
  setIsLocationSuggestionsOpen,
  setIsTagInputActive,
  setIsSplitDropdownOpen,
  accountId,
  ledgerId,
  currencySymbol,
  isLoading,
  isSaveDisabled,
  onClose,
}) => {
  // Modern theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const buttonColor = useColorModeValue("gray.600", "gray.200");
  const heroExpenseBg = useColorModeValue("red.50", "red.900");
  const heroIncomeBg = useColorModeValue("teal.50", "teal.900");
  const heroExpenseBorder = useColorModeValue("red.200", "red.800");
  const heroIncomeBorder = useColorModeValue("teal.200", "teal.800");
  const heroExpenseColor = useColorModeValue("red.500", "red.300");
  const heroIncomeColor = useColorModeValue("teal.600", "teal.300");
  const heroExpensePlaceholder = useColorModeValue("red.300", "red.700");
  const heroIncomePlaceholder = useColorModeValue("teal.300", "teal.700");

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
        {/* Transaction Type Toggle */}
        <Box
          position="relative"
          display="flex"
          bg={cardBg}
          borderRadius="full"
          border="2px solid"
          borderColor={inputBorderColor}
          p="1"
          overflow="hidden"
        >
          <motion.div
            animate={{
              x: type === "income" ? "100%" : "0%",
              background: type === "expense" ? "#FC8181" : "#319795",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            style={{
              position: "absolute",
              top: "4px",
              left: "4px",
              width: "calc(50% - 4px)",
              height: "calc(100% - 8px)",
              borderRadius: "9999px",
              zIndex: 0,
            }}
          />
          <Button
            flex={1}
            variant="unstyled"
            position="relative"
            zIndex={1}
            onClick={() => setType("expense")}
            color={type === "expense" ? "white" : buttonColor}
            fontWeight="semibold"
            fontSize="sm"
            height="40px"
            borderRadius="full"
            transition="color 0.2s"
            _hover={{}}
            _active={{}}
          >
            Expense
          </Button>
          <Button
            flex={1}
            variant="unstyled"
            position="relative"
            zIndex={1}
            onClick={() => setType("income")}
            color={type === "income" ? "white" : buttonColor}
            fontWeight="semibold"
            fontSize="sm"
            height="40px"
            borderRadius="full"
            transition="color 0.2s"
            _hover={{}}
            _active={{}}
          >
            Income
          </Button>
        </Box>

        {/* Hero Amount Section */}
        <Box
          bg={type === "expense" ? heroExpenseBg : heroIncomeBg}
          borderRadius="xl"
          p={{ base: 5, sm: 7 }}
          border="2px solid"
          borderColor={type === "expense" ? heroExpenseBorder : heroIncomeBorder}
          textAlign="center"
          sx={{ transition: "background-color 0.2s, border-color 0.2s" }}
        >
          <HStack justify="center" spacing={1.5} mb={3}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              letterSpacing="wider"
              textTransform="uppercase"
              color={type === "expense" ? heroExpenseColor : heroIncomeColor}
              opacity={0.7}
              sx={{ transition: "color 0.2s" }}
            >
              {type === "expense" ? "Expense Amount" : "Income Amount"}
            </Text>
            {amount && parseFloat(amount) > 0 && (
              <Icon
                as={Check}
                boxSize={3.5}
                color={type === "expense" ? heroExpenseColor : heroIncomeColor}
                opacity={0.8}
                sx={{ transition: "color 0.2s" }}
              />
            )}
          </HStack>
          <Box position="relative" width="100%" display="flex" alignItems="center">
            <Text
              position="absolute"
              left={4}
              fontSize={{ base: "xl", sm: "2xl" }}
              fontWeight="bold"
              color={type === "expense" ? heroExpenseColor : heroIncomeColor}
              lineHeight="1"
              sx={{ transition: "color 0.2s" }}
              userSelect="none"
              pointerEvents="none"
            >
              {currencySymbol}
            </Text>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => handleNumericInput(e, amount)}
              onPaste={(e) => handleNumericPaste(e, setAmount)}
              placeholder="0.00"
              fontSize={{ base: "4xl", sm: "5xl" }}
              fontWeight="bold"
              color={type === "expense" ? heroExpenseColor : heroIncomeColor}
              _placeholder={{
                color: type === "expense"
                  ? heroExpensePlaceholder
                  : heroIncomePlaceholder,
              }}
              textAlign="center"
              variant="unstyled"
              autoFocus
              width="100%"
              sx={{ transition: "color 0.2s" }}
              data-testid="createtransactionmodal-amount-input"
            />
          </Box>
        </Box>

        {/* Basic Info Card */}
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
                  ".react-datepicker-wrapper": {
                    width: "100%",
                  },
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
                  selected={date}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setDate(date);
                    }
                  }}
                  shouldCloseOnSelect={true}
                  data-testid="createtransactionmodal-date-picker"
                />
              </Box>
            </FormControl>

            {/* Account Dropdown */}
            {!accountId && accounts.length > 0 && (
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Account
                  {selectedAccountId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                </FormLabel>
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
                          setSelectedAccountId("");
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
                        borderColor={selectedAccountId ? "teal.400" : inputBorderColor}
                        bg={inputBg}
                        borderRadius="lg"
                        _hover={{ borderColor: "brand.300" }}
                        _focus={{
                          borderColor: focusBorderColor,
                          boxShadow: `0 0 0 1px ${focusBorderColor}`,
                        }}
                        autoComplete="off"
                        data-testid="createtransactionmodal-account-dropdown"
                      />
                      <InputRightElement height="100%" pr={1}>
                        {selectedAccountId ? (
                          <Icon
                            as={X}
                            boxSize={4}
                            color={helperTextColor}
                            cursor="pointer"
                            onClick={() => {
                              setSelectedAccountId("");
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
                    borderRadius="lg"
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
                            bg={selectedAccountId === acc.account_id || i === highlightedAccountIndex ? highlightColor : "transparent"}
                            _hover={{ bg: highlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedAccountId(acc.account_id);
                              setAccountSearch("");
                              setIsAccountOpen(false);
                              setHighlightedAccountIndex(-1);
                            }}
                          >
                            <Text fontSize="sm" fontWeight={selectedAccountId === acc.account_id ? "semibold" : "normal"}>
                              {acc.name}
                            </Text>
                            {selectedAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                              bg={selectedAccountId === acc.account_id || flatIndex === highlightedAccountIndex ? highlightColor : "transparent"}
                              _hover={{ bg: highlightColor }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedAccountId(acc.account_id);
                                setAccountSearch("");
                                setIsAccountOpen(false);
                                setHighlightedAccountIndex(-1);
                              }}
                            >
                              <Text fontSize="sm" fontWeight={selectedAccountId === acc.account_id ? "semibold" : "normal"}>
                                {acc.name}
                              </Text>
                              {selectedAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                <FormHelperText mt={2} color={helperTextColor}>
                  Choose which account this transaction belongs to
                </FormHelperText>
              </FormControl>
            )}
          </VStack>
        </Box>

        {/* Split Toggle Card */}
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
                Split Transaction
              </Text>
              <Text fontSize="sm" color={secondaryTextColor}>
                Divide this transaction across multiple categories
              </Text>
            </Box>
            <Switch
              colorScheme="brand"
              size="lg"
              isChecked={isSplit}
              onChange={(e) => handleSplitToggle(e.target.checked)}
              isDisabled={!amount}
            />
          </HStack>
        </Box>

        {/* Category or Split Transaction Section */}
        {isSplit ? (
          <FormSplits
            splits={splits}
            calculateRemainingAmount={calculateRemainingAmount}
            currencySymbol={currencySymbol}
            amount={amount}
            type={type}
            categories={categories}
            setSplits={setSplits}
            borderColor={inputBorderColor}
            bgColor={inputBg}
            highlightColor={highlightColor}
            buttonColorScheme="brand"
            ledgerId={ledgerId}
            onDropdownOpenChange={setIsSplitDropdownOpen}
          />
        ) : (
          /* Category Dropdown Card */
          <Box
            bg={cardBg}
            p={{ base: 4, sm: 6 }}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
          >
            <FormControl isRequired>
              <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                Category
                {categoryId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
              </FormLabel>
              <Popover
                isOpen={isCategoryOpen}
                onClose={() => { setIsCategoryOpen(false); setHighlightedIndex(-1); }}
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
                        setCategoryId("");
                        setHighlightedIndex(-1);
                        setIsCategoryOpen(true);
                      }}
                      onFocus={() => {
                        setCategorySearch("");
                        setHighlightedIndex(-1);
                        setIsCategoryOpen(true);
                      }}
                      onKeyDown={handleCategoryKeyDown}
                      placeholder="Search categories..."
                      borderWidth="2px"
                      borderColor={categoryId ? "teal.400" : inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={{ borderColor: "brand.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      autoComplete="off"
                      data-testid="createtransactionmodal-category-dropdown"
                    />
                    <InputRightElement height="100%" pr={1}>
                      {categoryId ? (
                        <Icon
                          as={X}
                          boxSize={4}
                          color={helperTextColor}
                          cursor="pointer"
                          onClick={() => {
                            setCategoryId("");
                            setCategorySearch("");
                            setIsCategoryOpen(false);
                            setHighlightedIndex(-1);
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
                  borderRadius="lg"
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
                          bg={categoryId === cat.category_id || i === highlightedIndex ? highlightColor : "transparent"}
                          _hover={{ bg: highlightColor }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCategoryId(cat.category_id);
                            setCategorySearch("");
                            setIsCategoryOpen(false);
                            setHighlightedIndex(-1);
                          }}
                        >
                          <Text fontSize="sm" fontWeight={categoryId === cat.category_id ? "semibold" : "normal"}>
                            {cat.name}
                          </Text>
                          {categoryId === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
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
                            bg={categoryId === cat.category_id || flatIndex === highlightedIndex ? highlightColor : "transparent"}
                            _hover={{ bg: highlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCategoryId(cat.category_id);
                              setCategorySearch("");
                              setIsCategoryOpen(false);
                              setHighlightedIndex(-1);
                            }}
                          >
                            <Text fontSize="sm" fontWeight={categoryId === cat.category_id ? "semibold" : "normal"}>
                              {cat.name}
                            </Text>
                            {categoryId === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                          </Box>
                        );
                      })}
                    </>
                  )}
                  {!hasFilteredResults && (
                    <Box px={4} py={5} textAlign="center">
                      <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                    </Box>
                  )}
                </PopoverContent>
              </Popover>
              <FormHelperText mt={2} color={helperTextColor}>
                Choose the category for this {type}
              </FormHelperText>
            </FormControl>
          </Box>
        )}

        {/* Details */}
        <Box
          bg={cardBg}
          p={{ base: 4, sm: 6 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <VStack spacing={5} align="stretch">
            <FormNotes
              ledgerId={ledgerId}
              notes={notes}
              setNotes={setNotes}
              borderColor={inputBorderColor}
              onDropdownOpenChange={setIsNotesSuggestionsOpen}
            />
            {type === "expense" && (
              <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                <FormStore
                  ledgerId={ledgerId}
                  store={store}
                  setStore={setStore}
                  borderColor={inputBorderColor}
                  onDropdownOpenChange={setIsStoreSuggestionsOpen}
                />
                <FormLocation
                  ledgerId={ledgerId}
                  location={location}
                  setLocation={setLocation}
                  borderColor={inputBorderColor}
                  onDropdownOpenChange={setIsLocationSuggestionsOpen}
                />
              </Stack>
            )}
            <FormTags
              tags={tags}
              setTags={setTags}
              borderColor={inputBorderColor}
              buttonColorScheme="brand"
              onShouldBlockSubmit={setIsTagInputActive}
            />
          </VStack>
        </Box>
      </VStack>

      {/* Mobile-only action buttons */}
      <Box display={{ base: "block", sm: "none" }} mt={6}>
        <Button
          onClick={handleSubmit}
          colorScheme="brand"
          size="lg"
          width="100%"
          mb={3}
          borderRadius="lg"
          isLoading={isLoading}
          loadingText="Saving..."
          isDisabled={isSaveDisabled}
          fontWeight="bold"
        >
          Save Transaction
        </Button>
        <Button
          variant="ghost"
          colorScheme="gray"
          onClick={onClose}
          size="lg"
          width="100%"
          borderRadius="lg"
          isDisabled={isLoading}
        >
          Cancel
        </Button>
      </Box>
    </ModalBody>
  );
};

export default CreateTransactionForm;
