import { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  VStack,
  Text,
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  HStack,
  Badge,
  Stack,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  InputGroup,
  InputLeftAddon,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Building2,
  Coins,
} from "lucide-react";
import api from "@/lib/api";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import { BuySellAssetModalProps, AssetTransactionCreate } from "../types";
import { useBuyAsset, useSellAsset } from "../api";
import useLedgerStore from "@/components/shared/store";
import { formatCurrencyWithSymbol } from "../utils";

interface Account {
  account_id: number;
  name: string;
  type: "asset" | "liability";
  is_group: boolean;
}

interface TransactionFormData {
  quantity: string;
  price_per_unit: string;
  account_id: string;
  transaction_date: Date;
  notes: string;
}

const BuySellAssetModal: FC<BuySellAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  onTransactionCompleted,
}) => {
  const { ledgerId, currencySymbol } = useLedgerStore();
  const [tabIndex, setTabIndex] = useState(0);
  const [formData, setFormData] = useState<TransactionFormData>({
    quantity: "",
    price_per_unit: "",
    account_id: "",
    transaction_date: new Date(),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modern theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColor = useColorModeValue("gray.500", "gray.400");
  const textColorSecondary = useColorModeValue("gray.600", "gray.200");
  const buttonBorderColor = useColorModeValue("gray.300", "gray.600");
  const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
  const buttonHoverBorderColor = useColorModeValue("gray.400", "gray.500");
  const tabBuyHoverBg = useColorModeValue("teal.50", "teal.700");
  const tabSellHoverBg = useColorModeValue("red.50", "red.700");

  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["accounts", ledgerId],
    queryFn: async () => {
      const response = await api.get(`/ledger/${Number(ledgerId)}/accounts`);
      return response.data;
    },
    enabled: !!ledgerId && isOpen,
  });

  const getFilteredAccounts = () => {
    if (!accounts) return [];
    return accounts.filter((account) => !account.is_group);
  };

  const buyAssetMutation = useBuyAsset();
  const sellAssetMutation = useSellAsset();

  useEffect(() => {
    if (isOpen && asset) {
      setTabIndex(0);
      setFormData({
        quantity: "",
        price_per_unit: "",
        account_id: "",
        transaction_date: new Date(),
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen, asset]);

  const totalAmount =
    (parseFloat(formData.quantity) || 0) *
    (parseFloat(formData.price_per_unit) || 0);

  const validateForm = (transactionType: "buy" | "sell"): boolean => {
    const newErrors: Record<string, string> = {};
    const quantity = parseFloat(formData.quantity) || 0;
    const pricePerUnit = parseFloat(formData.price_per_unit) || 0;

    if (quantity <= 0) newErrors.quantity = "Quantity must be greater than 0.";
    if (pricePerUnit <= 0)
      newErrors.price_per_unit = "Price must be greater than 0.";
    if (!formData.account_id)
      newErrors.account_id = "Please select an account.";
    if (!formData.transaction_date || isNaN(formData.transaction_date.getTime()))
      newErrors.transaction_date = "Transaction date is required.";

    if (
      transactionType === "sell" &&
      asset &&
      quantity > asset.total_quantity
    ) {
      newErrors.quantity = `Cannot sell more than available quantity (${asset.total_quantity} ${asset.asset_type?.unit_symbol}).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransaction = async (transactionType: "buy" | "sell") => {
    if (!asset || !ledgerId || !validateForm(transactionType)) return;

    const transactionData: AssetTransactionCreate = {
      physical_asset_id: asset.physical_asset_id,
      transaction_type: transactionType,
      quantity: parseFloat(formData.quantity) || 0,
      price_per_unit: parseFloat(formData.price_per_unit) || 0,
      account_id: Number(formData.account_id) as number,
       transaction_date: formData.transaction_date.toISOString(),
      notes: formData.notes as string,
    };

    try {
      if (transactionType === "buy") {
        await buyAssetMutation.mutateAsync({
          ledgerId: Number(ledgerId),
          data: transactionData,
        });
      } else {
        await sellAssetMutation.mutateAsync({
          ledgerId: Number(ledgerId),
          data: transactionData,
        });
      }
      onTransactionCompleted();
      onClose();
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const handleInputChange = (
    field: keyof TransactionFormData,
    value: string | Date,
  ) => {
    let processedValue: string | Date = value;

    // For transaction_date field, value is Date
    if (field === "transaction_date") {
      processedValue = value as Date;
    } else {
      // For quantity field, limit to 4 decimal places
      if (field === "quantity") {
        const stringValue = value as string;
        // Allow empty string, numbers, and decimal point
        if (stringValue === "" || /^\d*\.?\d*$/.test(stringValue)) {
          // Check if there are more than 4 decimal places
          const decimalPart = stringValue.split(".")[1];
          if (decimalPart && decimalPart.length > 4) {
            // Truncate to 4 decimal places
            const integerPart = stringValue.split(".")[0];
            processedValue = `${integerPart}.${decimalPart.substring(0, 4)}`;
          }
        } else {
          // If invalid characters, don't update
          return;
        }
      }

      // For price_per_unit field, limit to 2 decimal places
      if (field === "price_per_unit") {
        const stringValue = value as string;
        // Allow empty string, numbers, and decimal point
        if (stringValue === "" || /^\d*\.?\d*$/.test(stringValue)) {
          // Check if there are more than 2 decimal places
          const decimalPart = stringValue.split(".")[1];
          if (decimalPart && decimalPart.length > 2) {
            // Truncate to 2 decimal places
            const integerPart = stringValue.split(".")[0];
            processedValue = `${integerPart}.${decimalPart.substring(0, 2)}`;
          }
        } else {
          // If invalid characters, don't update
          return;
        }
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    buyAssetMutation.reset();
    sellAssetMutation.reset();
    onClose();
  };

  if (!asset) return null;

  const filteredAccounts = getFilteredAccounts();
  const isLoading = buyAssetMutation.isPending || sellAssetMutation.isPending;

  const renderForm = (type: "buy" | "sell") => (
    <VStack spacing={{ base: 5, sm: 6 }} align="stretch">
      {/* Transaction Details Card */}
      <Box
        bg={cardBg}
        p={{ base: 4, sm: 6 }}
        borderRadius="md"
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack spacing={5} align="stretch">
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.quantity}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <TrendingUp size={16} />
                  <Text>
                    Quantity to {type}{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                </HStack>
              </FormLabel>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  placeholder="0.0000"
                  min={0}
                  max={type === "sell" ? asset.total_quantity : undefined}
                  step={0.0001}
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
              <FormErrorMessage>{errors.quantity}</FormErrorMessage>
               <FormHelperText color={textColor}>
                 {type === "buy" ? "Current Holdings" : "Available to Sell"}:{" "}
                 {asset.total_quantity} {asset.asset_type?.unit_symbol}
               </FormHelperText>
            </FormControl>

            <FormControl flex={1} isInvalid={!!errors.price_per_unit}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <DollarSign size={16} />
                  <Text>
                    Price per Unit{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                </HStack>
              </FormLabel>
              <InputGroup size="lg">
                                 <InputLeftAddon
                                   bg={inputBorderColor}
                                   borderWidth="2px"
                                   borderColor={inputBorderColor}
                                    color={textColorSecondary}
                                   fontWeight="semibold"
                                  >                   {currencySymbol || "$"}
                 </InputLeftAddon>
                <Input
                  type="number"
                  value={formData.price_per_unit}
                  onChange={(e) =>
                    handleInputChange("price_per_unit", e.target.value)
                  }
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  width="100%"
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
                />
              </InputGroup>
              <FormErrorMessage>{errors.price_per_unit}</FormErrorMessage>
                 <FormHelperText color={textColor}>
                   Total: {formatCurrencyWithSymbol(totalAmount, currencySymbol || "$")}
                 </FormHelperText>
            </FormControl>
          </Stack>

          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <FormControl flex={1} isInvalid={!!errors.account_id}>
              <FormLabel fontWeight="semibold" mb={2}>
                <HStack spacing={2}>
                  <Building2 size={16} />
                  <Text>
                    {type === "buy" ? "Source Account" : "Destination Account"}{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                </HStack>
              </FormLabel>
              {accountsLoading ? (
                <HStack justify="center" p={4}>
                  <Spinner size="sm" />
                   <Text fontSize="sm" color={textColor}>
                     Loading accounts...
                   </Text>
                </HStack>
              ) : (
                <Select
                  value={formData.account_id}
                  onChange={(e) =>
                    handleInputChange("account_id", e.target.value)
                  }
                  placeholder="Select account"
                  bg={inputBg}
                  borderColor={inputBorderColor}
                  borderWidth="2px"
                  size="lg"
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                >
                  <optgroup label="Asset Accounts">
                    {filteredAccounts
                      .filter((account) => account.type === "asset")
                      .map((account) => (
                        <option
                          key={account.account_id}
                          value={account.account_id.toString()}
                        >
                          {account.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Liability Accounts">
                    {filteredAccounts
                      .filter((account) => account.type === "liability")
                      .map((account) => (
                        <option
                          key={account.account_id}
                          value={account.account_id.toString()}
                        >
                          {account.name}
                        </option>
                      ))}
                  </optgroup>
                </Select>
              )}
              <FormErrorMessage>{errors.account_id}</FormErrorMessage>
               <FormHelperText color={textColor}>
                 {type === "buy"
                   ? "Account to deduct funds from"
                   : "Account to receive funds"}
               </FormHelperText>
            </FormControl>

             <FormControl flex={1} isInvalid={!!errors.transaction_date}>
               <FormLabel fontWeight="semibold" mb={2}>
                 <HStack spacing={2}>
                   <Calendar size={16} />
                   <Text>
                     Date{" "}
                     <Text as="span" color="red.500">
                       *
                     </Text>
                   </Text>
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
                <FormHelperText color={textColor}>Transaction date</FormHelperText>
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
             <FormHelperText color={textColor}>
               Additional details about this {type} transaction
             </FormHelperText>
          </FormControl>
        </VStack>
      </Box>

      {/* Error Display */}
      {(buyAssetMutation.isError || sellAssetMutation.isError) && (
        <Alert
          status="error"
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
        >
          <AlertIcon />
          <Box>
            <AlertTitle fontWeight="bold">Transaction Failed!</AlertTitle>
            <AlertDescription>
              {(buyAssetMutation.error as any)?.response?.data?.detail ||
                (sellAssetMutation.error as any)?.response?.data?.detail ||
                "An error occurred while processing the transaction."}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={3} width="full">
          <Button
            onClick={() => handleTransaction(type)}
            bg={type === "buy" ? "teal.500" : "red.400"}
            color="white"
            _hover={{
              bg: type === "buy" ? "teal.600" : "red.500",
              transform: isLoading ? "none" : "translateY(-2px)",
              boxShadow: isLoading ? "none" : "lg",
            }}
            size="lg"
            flex={1}
            borderRadius="md"
            isLoading={isLoading}
            loadingText={`Processing ${type === "buy" ? "Purchase" : "Sale"}...`}
            isDisabled={
              !formData.account_id ||
              (parseFloat(formData.quantity) || 0) <= 0 ||
              (parseFloat(formData.price_per_unit) || 0) <= 0 ||
              (type === "sell" && asset.total_quantity === 0) ||
              Object.keys(errors).length > 0
            }
            leftIcon={type === "buy" ? <TrendingUp /> : <TrendingDown />}
            transition="all 0.2s"
          >
           {type === "buy" ? "Buy Asset" : "Sell Asset"}
         </Button>

        <Button
          variant="outline"
          onClick={handleClose}
          size="lg"
          flex={1}
          borderRadius="md"
          borderWidth="2px"
           borderColor={buttonBorderColor}
           color={textColorSecondary}
           _hover={{
             bg: buttonHoverBg,
             borderColor: buttonHoverBorderColor,
            transform: "translateY(-2px)",
          }}
          isDisabled={isLoading}
          transition="all 0.2s"
        >
          Cancel
        </Button>
      </Stack>
    </VStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
        maxHeight={{ base: "100%", md: "95vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Modern gradient header */}
        <Box
          bgGradient="linear(135deg, teal.400, teal.600)"
          color="white"
          px={{ base: 4, sm: 8 }}
          py={{ base: 6, sm: 6 }}
          pt={{ base: 12, sm: 6 }}
          position="relative"
        >
          <HStack spacing={{ base: 3, sm: 4 }} align="center">
            <Box
              p={{ base: 2, sm: 3 }}
              bg="whiteAlpha.200"
              borderRadius="md"
              backdropFilter="blur(10px)"
            >
              <Coins size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <HStack spacing={3} mb={2}>
                <Text
                  fontSize={{ base: "xl", sm: "2xl" }}
                  fontWeight="bold"
                  lineHeight="1.2"
                >
                  {asset.name}
                </Text>
                <Badge
                  bg="whiteAlpha.200"
                  color="white"
                  fontSize="sm"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {asset.asset_type?.name}
                </Badge>
              </HStack>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
              >
                {tabIndex === 0 ? "Buy asset" : "Sell asset"}
              </Text>
            </Box>
          </HStack>
        </Box>

         <ModalBody
           px={{ base: 4, sm: 8 }}
           py={{ base: 4, sm: 6 }}
           flex="1"
           overflow="auto"
          >
             <Box
               onKeyDown={(e) => {
                 if (e.key === "Enter" && !isLoading) {
                   e.preventDefault();
                   handleTransaction(tabIndex === 0 ? "buy" : "sell");
                 }
               }}
             >
              <Tabs
               isFitted
               variant="enclosed"
               index={tabIndex}
               onChange={setTabIndex}
               colorScheme="teal"
             >
            <TabList
              borderRadius="md"
              bg={cardBg}
              border="2px solid"
              borderColor={inputBorderColor}
              mb={6}
            >
              <Tab
                _selected={{
                  bg: "teal.500",
                  color: "white",
                  borderColor: "teal.500",
                  fontWeight: "bold",
                }}
                 _hover={{
                   bg: tabBuyHoverBg,
                   _selected: { bg: "teal.400" },
                 }}
                borderRadius="sm"
                fontSize="md"
                py={3}
                transition="all 0.2s"
              >
                <HStack spacing={2}>
                  <TrendingUp size={18} />
                  <Text>Buy</Text>
                </HStack>
              </Tab>
              <Tab
                _selected={{
                  bg: "red.400",
                  color: "white",
                  borderColor: "red.400",
                  fontWeight: "bold",
                }}
                 _hover={{
                   bg: tabSellHoverBg,
                   _selected: { bg: "red.300" },
                 }}
                borderRadius="sm"
                fontSize="md"
                py={3}
                transition="all 0.2s"
              >
                <HStack spacing={2}>
                  <TrendingDown size={18} />
                  <Text>Sell</Text>
                </HStack>
              </Tab>
            </TabList>

             <TabPanels>
               <TabPanel p={0}>{renderForm("buy")}</TabPanel>
               <TabPanel p={0}>{renderForm("sell")}</TabPanel>
             </TabPanels>
           </Tabs>
            </Box>
         </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BuySellAssetModal;
