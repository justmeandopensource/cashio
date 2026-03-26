import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  VStack,
  Input,
  Button,
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
import { Edit } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import { notify } from "@/components/shared/notify";
import { useLedgerDetails } from "@features/ledger/hooks";

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
   
  onUpdateCompleted: (data: {
    name: string;
    currency_symbol: string;
    description: string;
    notes: string;
    nav_service_type: string;
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
}

const UpdateLedgerModal: React.FC<UpdateLedgerModalProps> = ({
  isOpen,
  onClose,
  currentLedgerName,
  currentCurrencySymbol,
  currentDescription,
  currentNotes,
  currentNavServiceType,
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Fetch current ledger data when modal opens
  const { data: ledgerData, isLoading: isFetching } = useLedgerDetails(ledgerId, isOpen);

  // Update state when props change or data is fetched
  useEffect(() => {
    if (ledgerData) {
      setLedgerName(ledgerData.name || currentLedgerName);
      setSelectedCurrency(ledgerData.currency_symbol || currentCurrencySymbol);
      setDescription(ledgerData.description ?? "");
      setNotes(ledgerData.notes ?? "");
      setNavServiceType(ledgerData.nav_service_type || currentNavServiceType);
    } else {
      setLedgerName(currentLedgerName);
      setSelectedCurrency(currentCurrencySymbol);
      setDescription(currentDescription ?? "");
      setNotes(currentNotes ?? "");
      setNavServiceType(currentNavServiceType);
    }
  }, [ledgerData, currentLedgerName, currentCurrencySymbol, currentDescription, currentNotes, currentNavServiceType]);

  // Modern color scheme
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

  const handleSubmit = async (): Promise<void> => {
    if (!ledgerName || !selectedCurrency) {
      notify({
        description: "Please enter both ledger name and select a currency.",
        status: "warning",
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

    if (Object.keys(payload).length === 0) {
      notify({
        description: "No changes detected.",
        status: "info",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.put(`/ledger/${ledgerId}/update`, payload);
      notify({
        description: "Ledger updated successfully",
        status: "success",
      });
      onClose();
      onUpdateCompleted(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description:
            axiosError.response?.data?.detail || "Failed to update ledger",
          status: "error",
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
    navServiceType !== currentNavServiceType;

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={onClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
      isCentered
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius={{ base: 0, sm: "xl" }}
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
        {/* Gradient accent line */}
        <Box
          h="3px"
          bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
        />
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={Edit} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Box
                fontSize="lg"
                fontWeight="800"
                letterSpacing="-0.02em"
                color={modalTitleColor}
              >
                Update Ledger
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
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
          overflowY="auto"
          overflowX="hidden"
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
              borderRadius="xl"
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
                    borderRadius="lg"
                    _hover={{ borderColor: "brand.300" }}
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
                    borderRadius="lg"
                    _hover={{ borderColor: "brand.300" }}
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
                    borderRadius="lg"
                    _hover={{ borderColor: "brand.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    isDisabled={isLoading}
                  >
                    <option value="india">
                      Indian Mutual Funds (MFAPI.in)
                    </option>
                    <option value="uk">UK Mutual Funds (Yahoo Finance)</option>
                  </Select>
                  <FormHelperText mt={2}>
                    Update the mutual fund data service for this ledger
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>

            {/* Optional fields card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
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
                    borderRadius="lg"
                    _hover={{ borderColor: "brand.300" }}
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
                    borderRadius="lg"
                    rows={4}
                    _hover={{ borderColor: "brand.300" }}
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
              colorScheme="brand"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              fontWeight="bold"
              isLoading={isLoading}
              loadingText="Updating..."
              isDisabled={!ledgerName || !selectedCurrency || !hasChanges}
            >
              Update Ledger
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              width="100%"
              size="lg"
              borderRadius="lg"
              isDisabled={isLoading}
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
          bg={footerBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            colorScheme="brand"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="lg"
            fontWeight="bold"
            isLoading={isLoading}
            loadingText="Updating..."
            isDisabled={!ledgerName || !selectedCurrency || !hasChanges}
          >
            Update Ledger
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={isLoading}
            px={6}
            py={3}
            borderRadius="lg"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateLedgerModal;
