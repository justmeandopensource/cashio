import React, { useState } from "react";
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
} from "@chakra-ui/react";
import { Plus, X, Eye, EyeOff } from "lucide-react";
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

interface CreateLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCreateLedger: (
    // eslint-disable-next-line no-unused-vars
    newLedgerName: string,
    // eslint-disable-next-line no-unused-vars
    currencySymbol: string,
    // eslint-disable-next-line no-unused-vars
    description: string,
    // eslint-disable-next-line no-unused-vars
    notes: string,
    // eslint-disable-next-line no-unused-vars
    navServiceType: string,
    // eslint-disable-next-line no-unused-vars
    apiKey: string,
  ) => void;
}

const CreateLedgerModal: React.FC<CreateLedgerModalProps> = ({
  isOpen,
  onClose,
  handleCreateLedger,
}) => {
  const [newLedgerName, setNewLedgerName] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [navServiceType, setNavServiceType] = useState<string>("india");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const toast = useToast();

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

  const handleSubmit = (): void => {
    if (!newLedgerName || !selectedCurrency) {
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

    // Call the handleCreateLedger function passed from the parent
    handleCreateLedger(
      newLedgerName,
      selectedCurrency,
      description,
      notes,
      navServiceType,
      apiKey,
    );

    // Reset the form fields
    setNewLedgerName("");
    setSelectedCurrency("");
    setDescription("");
    setNotes("");
    setNavServiceType("india");
    setApiKey("");

    // Close the modal
    onClose();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
        maxHeight={{ base: "100%", md: "90vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={Plus} boxSize={5} mt="3px" color={modalIconColor} />

            <Box flex={1}>
              <Box
                fontSize="lg"
                fontWeight="bold"
                color={modalTitleColor}
              >
                Create New Ledger
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
              >
                Set up your financial tracking
              </Box>
            </Box>

            {/* Mobile close button */}
            <Box
              as="button"
              display={{ base: "flex", sm: "none" }}
              alignItems="center"
              justifyContent="center"
              onClick={onClose}
              aria-label="Close"
              color={modalSubtitleColor}
              _hover={{ color: modalTitleColor }}
              p={1}
            >
              <Icon as={X} boxSize={5} />
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
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Form fields in modern cards */}
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
                    value={newLedgerName}
                    onChange={(e) => setNewLedgerName(e.target.value)}
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
                  />
                  <FormHelperText mt={2}>
                    Choose a descriptive name for your financial records
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
                  >
                    {currencies.map((currency) => (
                      <option key={currency.symbol} value={currency.symbol}>
                        {currency.symbol} ({currency.name})
                      </option>
                    ))}
                  </Select>
                  <FormHelperText mt={2}>
                    Select the primary currency for this ledger
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
                  >
                    <option value="india">
                      Indian Mutual Funds (MFAPI.in)
                    </option>
                    <option value="uk">UK Mutual Funds (Alpha Vantage)</option>
                  </Select>
                  <FormHelperText mt={2}>
                    Select the mutual fund data service for this ledger
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
                  />
                  <FormHelperText mt={2}>
                    Detailed notes for this ledger
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isDisabled={!newLedgerName || !selectedCurrency}
            >
              Create Ledger
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              width="100%"
              size="lg"
              borderRadius="md"
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
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="md"
            isDisabled={!newLedgerName || !selectedCurrency}
          >
            Create Ledger
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            px={6}
            py={3}
            borderRadius="md"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateLedgerModal;
