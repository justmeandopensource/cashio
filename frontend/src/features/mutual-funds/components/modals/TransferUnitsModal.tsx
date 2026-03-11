import { FC, useState, useEffect } from "react";
import React from "react";
 import {
   Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  InputGroup,
  InputLeftAddon,
  HStack,
  Text,
  Box,
  Stack,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  ArrowRightLeft,
  Calendar,
  FileText,
  TrendingUp,
  Coins,
  DollarSign,
} from "lucide-react";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import { switchMutualFundUnits } from "../../api";
import { MutualFund, MfSwitchCreate } from "../../types";
import { formatAmount, formatUnits } from "../../utils";
import useLedgerStore from "@/components/shared/store";

interface TransferUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromFundId: number;
  mutualFunds: MutualFund[];
  onSuccess: () => void;
}

interface FormData {
  from_fund_id: string;
  to_fund_id: string;
  source_units: string;
  source_amount: string;
  target_units: string;
  target_amount: string;
  transaction_date: Date;
  notes: string;
}

const TransferUnitsModal: FC<TransferUnitsModalProps> = ({
  isOpen,
  onClose,
  fromFundId,
  mutualFunds,
  onSuccess,
}) => {
  const { ledgerId, currencySymbol } = useLedgerStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    from_fund_id: "",
    to_fund_id: "",
    source_units: "",
    source_amount: "",
    target_units: "",
    target_amount: "",
    transaction_date: new Date(),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [targetAmountModified, setTargetAmountModified] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");

   const sourceFund = mutualFunds.find(fund => fund.mutual_fund_id === fromFundId);
   const toFund = mutualFunds.find(fund => fund.mutual_fund_id.toString() === formData.to_fund_id);

  const transferMutation = useMutation({
    mutationFn: (switchData: MfSwitchCreate) =>
      switchMutualFundUnits(Number(ledgerId), switchData),
    onSuccess: (_, variables) => {
      // Invalidate queries for both source and target funds to refresh lowest/highest costs
      queryClient.invalidateQueries({ queryKey: ["fund-transactions", ledgerId, variables.source_mutual_fund_id] });
      queryClient.invalidateQueries({ queryKey: ["fund-transactions", ledgerId, variables.target_mutual_fund_id] });
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["accounts", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", ledgerId] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({ general: "Failed to switch units. Please try again." });
      }
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        from_fund_id: fromFundId.toString(),
        to_fund_id: "",
        source_units: "",
        source_amount: "",
        target_units: "",
        target_amount: "",
        transaction_date: new Date(),
        notes: "",
      });
      setErrors({});
      setTargetAmountModified(false);
    }
  }, [isOpen, fromFundId]);



  useEffect(() => {
    if (toFund && formData.source_amount && !targetAmountModified) {
      // Auto-fill target amount with source amount as user types, unless manually modified
      setFormData(prev => ({
        ...prev,
        target_amount: formData.source_amount
      }));
    }
  }, [toFund, formData.source_amount, targetAmountModified]);

  const handleClose = () => {
    setFormData({
      from_fund_id: "",
      to_fund_id: "",
      source_units: "",
      source_amount: "",
      target_units: "",
      target_amount: "",
      transaction_date: new Date(),
      notes: "",
    });
    setErrors({});
    setTargetAmountModified(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.to_fund_id) newErrors.to_fund_id = "Please select target fund";
    if (formData.from_fund_id === formData.to_fund_id) newErrors.to_fund_id = "Source and target funds cannot be the same";
    if (!formData.source_units || parseFloat(formData.source_units) <= 0) newErrors.source_units = "Source units must be greater than 0";
    if (!formData.source_amount || parseFloat(formData.source_amount) <= 0) newErrors.source_amount = "Source amount must be greater than 0";
    if (!formData.target_units || parseFloat(formData.target_units) <= 0) newErrors.target_units = "Target units must be greater than 0";
    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) newErrors.target_amount = "Target amount must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const switchData: MfSwitchCreate = {
      source_mutual_fund_id: fromFundId!,
      target_mutual_fund_id: parseInt(formData.to_fund_id),
      source_units: parseFloat(formData.source_units),
      source_amount: parseFloat(formData.source_amount),
      target_units: parseFloat(formData.target_units),
      target_amount: parseFloat(formData.target_amount),
      transaction_date: formData.transaction_date, // Date object is fine, backend will format
      notes: formData.notes.trim() || undefined,
    };

    transferMutation.mutate(switchData);
  };

  const handleInputChange = (field: keyof FormData, value: string | Date) => {
    let processedValue: string | Date = value;

    // For transaction_date field, value is Date
    if (field === "transaction_date") {
      processedValue = value as Date;
    } else {
      // For amount fields, limit to 2 decimal places
      if (field === "source_amount" || field === "target_amount") {
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

      // For units fields, limit to 3 decimal places
      if (field === "source_units" || field === "target_units") {
        const stringValue = value as string;
        // Allow empty string, numbers, and decimal point
        if (stringValue === "" || /^\d*\.?\d*$/.test(stringValue)) {
          // Check if there are more than 3 decimal places
          const decimalPart = stringValue.split(".")[1];
          if (decimalPart && decimalPart.length > 3) {
            // Truncate to 3 decimal places
            const integerPart = stringValue.split(".")[0];
            processedValue = `${integerPart}.${decimalPart.substring(0, 3)}`;
          }
        } else {
          // If invalid characters, don't update
          return;
        }
      }
    }

    // Track manual modifications
    if (field === "target_amount") {
      setTargetAmountModified(true);
    } else if (field === "source_amount") {
      setTargetAmountModified(false); // Reset when source changes
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const availableUnits = sourceFund ? parseFloat(String(sourceFund.total_units)) : 0;
  const sourceUnits = parseFloat(formData.source_units) || 0;
  const sourceAmount = parseFloat(formData.source_amount) || 0;
  const targetUnits = parseFloat(formData.target_units) || 0;
  const targetAmount = parseFloat(formData.target_amount) || 0;
  const sourceNav = sourceUnits > 0 ? sourceAmount / sourceUnits : 0;
  const targetNav = targetUnits > 0 ? targetAmount / targetUnits : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
      isCentered
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
              <ArrowRightLeft size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Text
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
                mb={1}
              >
                Transfer Mutual Fund Units
              </Text>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
              >
                 {sourceFund ? `From ${sourceFund.name}` : 'Switch units between funds'}
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
          <form id="transfer-units-form" onSubmit={handleSubmit}>
            <VStack spacing={{ base: 5, sm: 6 }} align="stretch">

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
                    <AlertTitle fontWeight="bold">Transfer Failed!</AlertTitle>
                    <AlertDescription>
                      {errors.general}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Fund Selection Card */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack spacing={5} align="stretch">

                  <FormControl isInvalid={!!errors.to_fund_id}>
                      <FormLabel fontWeight="semibold" mb={2}>
                        <HStack spacing={2}>
                          <TrendingUp size={16} />
                          <Text>
                            To Fund{" "}
                            <Text as="span" color="red.500">
                              *
                            </Text>
                          </Text>
                        </HStack>
                      </FormLabel>
                         <Select
                         value={formData.to_fund_id}
                         onChange={(e) => handleInputChange("to_fund_id", e.target.value)}
                         placeholder="Select target fund"
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
                       >
                      {mutualFunds
                        .filter(fund => fund.mutual_fund_id !== fromFundId && fund.amc_id === sourceFund?.amc_id && fund.owner === sourceFund?.owner)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((fund) => (
                             <option key={fund.mutual_fund_id} value={fund.mutual_fund_id.toString()}>
                               {fund.name} ({fund.amc?.name})
                             </option>
                           ))}
                      </Select>
                       <FormErrorMessage>{errors.to_fund_id}</FormErrorMessage>
                     </FormControl>

                 </VStack>
              </Box>

              {/* Transfer Details Card */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack spacing={5} align="stretch">
                   {/* Row 1: Source Units and Amount */}
                   <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                     <FormControl flex={1} isInvalid={!!errors.source_units}>
                       <FormLabel fontWeight="semibold" mb={2}>
                         <HStack spacing={2}>
                           <Coins size={16} />
                           <Text>
                             Source Units{" "}
                             <Text as="span" color="red.500">
                               *
                             </Text>
                           </Text>
                         </HStack>
                       </FormLabel>
                         <Input
                           type="number"
                           step="0.001"
                           value={formData.source_units}
                           onChange={(e) => handleInputChange("source_units", e.target.value)}
                           placeholder="0.000"
                           min={0}
                           max={availableUnits}
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
                         <FormHelperText color={useColorModeValue("gray.500", "gray.400")}>Available units: {formatUnits(availableUnits)}</FormHelperText>
                       <FormErrorMessage>{errors.source_units}</FormErrorMessage>
                     </FormControl>

                     <FormControl flex={1} isInvalid={!!errors.source_amount}>
                       <FormLabel fontWeight="semibold" mb={2}>
                         <HStack spacing={2}>
                           <DollarSign size={16} />
                           <Text>
                             Source Amount{" "}
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
                           color={useColorModeValue("gray.600", "gray.200")}
                           fontWeight="semibold"
                         >
                           {currencySymbol}
                         </InputLeftAddon>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.source_amount}
                            onChange={(e) => handleInputChange("source_amount", e.target.value)}
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
                        <FormHelperText color={useColorModeValue("gray.500", "gray.400")}>Source NAV: {currencySymbol}{formatAmount(sourceNav)}</FormHelperText>
                       <FormErrorMessage>{errors.source_amount}</FormErrorMessage>
                     </FormControl>
                   </Stack>

                   {/* Row 2: Target Units and Amount */}
                   <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                     <FormControl flex={1} isInvalid={!!errors.target_units}>
                       <FormLabel fontWeight="semibold" mb={2}>
                         <HStack spacing={2}>
                           <Coins size={16} />
                           <Text>
                             Target Units{" "}
                             <Text as="span" color="red.500">
                               *
                             </Text>
                           </Text>
                         </HStack>
                       </FormLabel>
                        <Input
                          type="number"
                          step="0.001"
                          value={formData.target_units}
                          onChange={(e) => handleInputChange("target_units", e.target.value)}
                          placeholder="0.000"
                          min={0}
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
                         <FormHelperText color={useColorModeValue("gray.500", "gray.400")}>units to purchase</FormHelperText>
                        <FormErrorMessage>{errors.target_units}</FormErrorMessage>
                     </FormControl>

                     <FormControl flex={1} isInvalid={!!errors.target_amount}>
                       <FormLabel fontWeight="semibold" mb={2}>
                         <HStack spacing={2}>
                           <DollarSign size={16} />
                           <Text>
                             Target Amount{" "}
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
                           color={useColorModeValue("gray.600", "gray.200")}
                           fontWeight="semibold"
                         >
                           {currencySymbol}
                         </InputLeftAddon>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.target_amount}
                            onChange={(e) => handleInputChange("target_amount", e.target.value)}
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
                         <FormHelperText color={useColorModeValue("gray.500", "gray.400")}>Target NAV: {currencySymbol}{formatAmount(targetNav)}</FormHelperText>
                        <FormErrorMessage>{errors.target_amount}</FormErrorMessage>
                      </FormControl>
                   </Stack>

                   {/* Row 3: Transfer Date */}
                    <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                      <FormControl maxW={{ md: "50%" }}>
                       <FormLabel fontWeight="semibold" mb={2}>
                         <HStack spacing={2}>
                           <Calendar size={16} />
                           <Text>Transfer Date</Text>
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
                          />
                       </Box>

                     </FormControl>
                   </Stack>

                  {/* Row 3: Notes (full width) */}
                  <FormControl isInvalid={!!errors.notes}>
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <FileText size={16} />
                        <Text>Notes (Optional)</Text>
                      </HStack>
                    </FormLabel>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Add any notes about this transfer..."
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
                    <FormHelperText color={useColorModeValue("gray.500", "gray.400")}>Additional details about this transfer</FormHelperText>
                    <FormErrorMessage>{errors.notes}</FormErrorMessage>
                  </FormControl>





                </VStack>
              </Box>

              {/* Mobile-only action buttons that stay at bottom */}
              <Box display={{ base: "block", sm: "none" }} mt={6}>
                <Stack direction="row" spacing={3} width="full">
                   <Button
                     type="submit"
                     bg="teal.500"
                     color="white"
                     _hover={{
                       bg: "teal.600",
                       transform: transferMutation.isPending ? "none" : "translateY(-2px)",
                       boxShadow: transferMutation.isPending ? "none" : "lg",
                     }}
                     size="lg"
                     flex={1}
                     borderRadius="md"
                     isLoading={transferMutation.isPending}
                     loadingText="Processing Transfer..."
                      isDisabled={
                        !formData.to_fund_id ||
                        !formData.source_units ||
                        !formData.source_amount ||
                        !formData.target_units ||
                        !formData.target_amount ||
                        sourceUnits > availableUnits ||
                        Object.keys(errors).length > 0
                      }
                     leftIcon={<ArrowRightLeft size={16} />}
                     transition="all 0.2s"
                   >
                     Transfer Units
                   </Button>

                  <Button
                    variant="outline"
                    onClick={handleClose}
                    size="lg"
                    flex={1}
                    borderRadius="md"
                    borderWidth="2px"
                    borderColor={useColorModeValue("gray.300", "gray.600")}
                    color={useColorModeValue("gray.600", "gray.200")}
                    _hover={{
                      bg: useColorModeValue("gray.50", "gray.600"),
                      borderColor: useColorModeValue("gray.400", "gray.500"),
                      transform: "translateY(-2px)",
                    }}
                    isDisabled={transferMutation.isPending}
                    transition="all 0.2s"
                  >
                    Cancel
                  </Button>
                </Stack>
              </Box>
            </VStack>
          </form>
        </ModalBody>

        {/* Desktop-only footer */}
        <ModalFooter
          display={{ base: "none", sm: "flex" }}
          px={8}
          py={6}
          bg={cardBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            type="submit"
            form="transfer-units-form"
            bg="teal.500"
            color="white"
            _hover={{
              bg: "teal.600",
              transform: transferMutation.isPending ? "none" : "translateY(-2px)",
              boxShadow: transferMutation.isPending ? "none" : "lg",
            }}
            mr={3}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={transferMutation.isPending}
            loadingText="Processing Transfer..."
            isDisabled={
              !formData.to_fund_id ||
              !formData.source_units ||
              !formData.source_amount ||
              !formData.target_units ||
              !formData.target_amount ||
              sourceUnits > availableUnits ||
              Object.keys(errors).length > 0
            }
            leftIcon={<ArrowRightLeft size={16} />}
            transition="all 0.2s"
            onClick={handleSubmit}
          >
            Transfer Units
          </Button>

          <Button
            variant="outline"
            onClick={handleClose}
            isDisabled={transferMutation.isPending}
            px={6}
            py={3}
            borderRadius="md"
            borderWidth="2px"
            borderColor={useColorModeValue("gray.300", "gray.600")}
            color={useColorModeValue("gray.600", "gray.200")}
            _hover={{
              bg: useColorModeValue("gray.50", "gray.600"),
              borderColor: useColorModeValue("gray.400", "gray.500"),
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TransferUnitsModal;