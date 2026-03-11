import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  VStack,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  useToast,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  useColorModeValue,
  Box,
  Textarea,
  HStack,
  Icon,
  Text,
} from "@chakra-ui/react";
import { Edit, Check, X, Eye, EyeOff } from "lucide-react";
import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import { toastDefaults } from "../shared/utils";

interface Currency {
  symbol: string;
  name: string;
}

const currencies: Currency[] = [
  { symbol: "£", name: "British Pound" },
  { symbol: "₹", name: "Indian Rupee" },
  { symbol: "$", name: "US Dollar" },
  // Add more common currencies as needed
];

interface UpdateLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLedgerName: string;
  currentCurrencySymbol: string;
  currentDescription: string;
  currentNotes: string;
  currentNavServiceType: string;
  currentApiKey: string;
  // eslint-disable-next-line no-unused-vars
  onUpdateCompleted: (data: {
    name: string;
    currency_symbol: string;
    description: string;
    notes: string;
    nav_service_type: string;
    api_key: string;
    created_at: string;
    updated_at: string;
  }) => void;
}

interface UpdateLedgerPayload {
  name?: string;
  currency_symbol?: string;
  description?: string;
  notes?: string;
  nav_service_type?: string;
  api_key?: string;
}

const UpdateLedgerModal: React.FC<UpdateLedgerModalProps> = ({
  isOpen,
  onClose,
  currentLedgerName,
  currentCurrencySymbol,
  currentDescription,
  currentNotes,
  currentNavServiceType,
  currentApiKey,
  onUpdateCompleted,
}) => {
  const { ledgerId } = useLedgerStore();
  const [ledgerName, setLedgerName] = useState<string>(currentLedgerName);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    currentCurrencySymbol,
  );
  const [description, setDescription] = useState<string>(
    currentDescription ?? "",
  );
  const [notes, setNotes] = useState<string>(currentNotes ?? "");
  const [navServiceType, setNavServiceType] = useState<string>(
    currentNavServiceType,
  );
  const [apiKey, setApiKey] = useState<string>(currentApiKey ?? "");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();

  // Fetch current ledger data when modal opens
  const { data: ledgerData, isLoading: isFetching } = useQuery({
    queryKey: ["ledger-details", ledgerId],
    queryFn: async () => {
      if (!ledgerId) return null;
      const response = await api.get(`/ledger/${ledgerId}`);
      return response.data;
    },
    enabled: isOpen && !!ledgerId,
    staleTime: 0, // Always fetch fresh data
  });

  // Update state when props change or data is fetched
  useEffect(() => {
    if (ledgerData) {
      setLedgerName(ledgerData.name || currentLedgerName);
      setSelectedCurrency(ledgerData.currency_symbol || currentCurrencySymbol);
      setDescription(ledgerData.description ?? "");
      setNotes(ledgerData.notes ?? "");
      setNavServiceType(ledgerData.nav_service_type || currentNavServiceType);
      setApiKey(ledgerData.api_key ?? "");
    } else {
      setLedgerName(currentLedgerName);
      setSelectedCurrency(currentCurrencySymbol);
      setDescription(currentDescription ?? "");
      setNotes(currentNotes ?? "");
      setNavServiceType(currentNavServiceType);
      setApiKey(currentApiKey ?? "");
    }
  }, [ledgerData, currentLedgerName, currentCurrencySymbol, currentDescription, currentNotes, currentNavServiceType, currentApiKey]);

  // Modern color scheme
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");

  const handleSubmit = async (): Promise<void> => {
    if (!ledgerName || !selectedCurrency) {
      toast({
        description: "Please enter both ledger name and select a currency.",
        status: "warning",
        ...toastDefaults,
      });
      return;
    }

    if (navServiceType === "uk" && !apiKey.trim()) {
      toast({
        description: "API key is required for UK mutual fund service.",
        status: "warning",
        ...toastDefaults,
      });
      return;
    }

    const payload: UpdateLedgerPayload = {};

    if (ledgerName !== currentLedgerName) {
      payload.name = ledgerName;
    }
    if (selectedCurrency !== currentCurrencySymbol) {
      payload.currency_symbol = selectedCurrency;
    }
    if (description !== currentDescription) {
      payload.description = description;
    }
    if (notes !== currentNotes) {
      payload.notes = notes;
    }
    if (navServiceType !== currentNavServiceType) {
      payload.nav_service_type = navServiceType;
    }
    if (apiKey !== (currentApiKey ?? "")) {
      payload.api_key = apiKey;
    }

    if (Object.keys(payload).length === 0) {
      toast({
        description: "No changes detected.",
        status: "info",
        ...toastDefaults,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.put(`/ledger/${ledgerId}/update`, payload);
      toast({
        description: "Ledger updated successfully",
        status: "success",
        ...toastDefaults,
      });
      onClose();
      onUpdateCompleted(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description:
            axiosError.response?.data?.detail || "Failed to update ledger",
          status: "error",
          ...toastDefaults,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const hasChanges =
    ledgerName !== currentLedgerName ||
    selectedCurrency !== currentCurrencySymbol ||
    description !== (currentDescription ?? "") ||
    notes !== (currentNotes ?? "") ||
    navServiceType !== currentNavServiceType ||
    apiKey !== (currentApiKey ?? "");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
        maxHeight={{ base: "100%", md: "90vh" }}
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
              <Icon as={Edit} boxSize={{ base: 5, sm: 6 }} />
            </Box>

            <Box>
              <Box
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Update Ledger
              </Box>
              <Box
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
              >
                Modify your ledger settings
              </Box>
            </Box>
          </HStack>
        </Box>

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          display="flex"
          flexDirection="column"
          overflow="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          {isFetching ? (
            <Box textAlign="center" py={8}>
              <Text>Loading ledger details...</Text>
            </Box>
          ) : (
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Basic fields card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Ledger Name
                  </FormLabel>
                  <Input
                    placeholder="e.g., Personal Finance, Family Budget"
                    value={ledgerName}
                    onChange={(e) => setLedgerName(e.target.value)}
                    autoFocus
                    onKeyDown={handleKeyPress}
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    size="lg"
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    isDisabled={isLoading}
                  />
                  <FormHelperText mt={2}>
                    Update the descriptive name for your financial records
                  </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Currency
                  </FormLabel>
                  <Select
                    placeholder="Select currency"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    size="lg"
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    isDisabled={isLoading}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.symbol} value={currency.symbol}>
                        {currency.symbol} ({currency.name})
                      </option>
                    ))}
                  </Select>
                  <FormHelperText mt={2}>
                    Update the primary currency for this ledger
                  </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Mutual Fund Service
                  </FormLabel>
                  <Select
                    value={navServiceType}
                    onChange={(e) => setNavServiceType(e.target.value)}
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    size="lg"
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    isDisabled={isLoading}
                  >
                    <option value="india">
                      Indian Mutual Funds (MFAPI.in)
                    </option>
                    <option value="uk">UK Mutual Funds (Alpha Vantage)</option>
                  </Select>
                  <FormHelperText mt={2}>
                    Update the mutual fund data service for this ledger
                  </FormHelperText>
                </FormControl>

                 {navServiceType === "uk" && (
                   <FormControl isRequired>
                     <FormLabel fontWeight="semibold" mb={2}>
                       Alpha Vantage API Key
                     </FormLabel>
                     <InputGroup size="lg">
                       <Input
                         type={showApiKey ? "text" : "password"}
                         placeholder="Enter your Alpha Vantage API key"
                         value={apiKey}
                         onChange={(e) => setApiKey(e.target.value)}
                         borderWidth="2px"
                         borderColor={inputBorderColor}
                         bg={inputBg}
                         borderRadius="md"
                         _hover={{ borderColor: "teal.300" }}
                         _focus={{
                           borderColor: focusBorderColor,
                           boxShadow: `0 0 0 1px ${focusBorderColor}`,
                         }}
                         isDisabled={isLoading}
                       />
                       <InputRightElement height="100%">
                         <Button
                           variant="ghost"
                           onClick={() => setShowApiKey(!showApiKey)}
                           _hover={{ bg: "transparent" }}
                           size="sm"
                           aria-label={
                             showApiKey ? "Hide API key" : "Show API key"
                           }
                         >
                           <Icon as={showApiKey ? EyeOff : Eye} boxSize={4} />
                         </Button>
                       </InputRightElement>
                     </InputGroup>
                     <FormHelperText mt={2}>
                       Required for UK mutual fund data.
                     </FormHelperText>
                   </FormControl>
                 )}
              </VStack>
            </Box>

            {/* Optional fields card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Description
                  </FormLabel>
                  <Input
                    placeholder="e.g., My main personal finance ledger"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    size="lg"
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    isDisabled={isLoading}
                  />
                  <FormHelperText mt={2}>
                    A brief overview of this ledger&apos;s purpose
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Notes
                  </FormLabel>
                  <Textarea
                    placeholder="Any additional notes or details"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    size="lg"
                    borderRadius="md"
                    rows={4}
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    isDisabled={isLoading}
                  />
                  <FormHelperText mt={2}>
                    Detailed notes for this ledger
                  </FormHelperText>
                </FormControl>
               </VStack>
             </Box>
           </VStack>
           )}

           {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={isLoading}
              loadingText="Updating..."
              isDisabled={!ledgerName || !selectedCurrency || !hasChanges}
              leftIcon={<Check />}
              _hover={{
                transform: isLoading ? "none" : "translateY(-2px)",
                boxShadow: isLoading ? "none" : "lg",
              }}
              transition="all 0.2s"
            >
              Update Ledger
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              width="100%"
              size="lg"
              borderRadius="md"
              isDisabled={isLoading}
              leftIcon={<X />}
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
          </Box>
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
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={isLoading}
            loadingText="Updating..."
            isDisabled={!ledgerName || !selectedCurrency || !hasChanges}
            leftIcon={<Check />}
            _hover={{
              transform: isLoading ? "none" : "translateY(-2px)",
              boxShadow: isLoading ? "none" : "lg",
            }}
            transition="all 0.2s"
          >
            Update Ledger
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            isDisabled={isLoading}
            leftIcon={<X />}
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

export default UpdateLedgerModal;
