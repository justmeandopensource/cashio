import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Button,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  Textarea,
  Icon,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import useLedgerStore from "../shared/store";
import { Edit } from "lucide-react";
import { notify } from "@/components/shared/notify";
import FormOwnerSuggestionField from "@/components/shared/FormOwnerSuggestionField";
import { getSubtypesForType } from "@/features/ledger/constants/accountSubtypes";

interface Account {
  account_id: string | number;
  name: string;
  opening_balance: number;
  type: "asset" | "liability";
  subtype: string;
  owner?: string;
  ledger_id: string | number;
  description?: string;
  notes?: string;
}

interface UpdateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onUpdateCompleted: () => void;
  currentDescription?: string;
  currentNotes?: string;
}

interface UpdateAccountPayload {
  name?: string;
  subtype?: string;
  owner?: string;
  opening_balance?: number;
  description?: string;
  notes?: string;
}

const UpdateAccountModal: React.FC<UpdateAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onUpdateCompleted,
  currentDescription,
  currentNotes,
}) => {
  const [name, setName] = useState<string>(account.name);
  const [openingBalance, setOpeningBalance] = useState<string>(
    account.opening_balance.toString(),
  );
  const [subtype, setSubtype] = useState<string>(account.subtype);
  const [owner, setOwner] = useState<string>(account.owner ?? "");
  const [description, setDescription] = useState<string>(
    currentDescription ?? account.description ?? ""
  );
  const [notes, setNotes] = useState<string>(
    currentNotes ?? account.notes ?? ""
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { currencySymbol } = useLedgerStore();

  const subtypeOptions = getSubtypesForType(account.type);

  // Theme colors
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  React.useEffect(() => {
    setDescription(currentDescription ?? account.description ?? "");
    setNotes(currentNotes ?? account.notes ?? "");
  }, [currentDescription, currentNotes, account.description, account.notes]);

  const hasChanges = () => {
    return (
      name !== account.name ||
      parseFloat(openingBalance) !== account.opening_balance ||
      subtype !== account.subtype ||
      owner !== (account.owner ?? "") ||
      description !== (currentDescription ?? account.description ?? "") ||
      notes !== (currentNotes ?? account.notes ?? "")
    );
  };

  const handleSubmit = async (): Promise<void> => {
    if (!name) {
      notify({ description: "Please enter an account name.", status: "warning" });
      return;
    }

    const payload: UpdateAccountPayload = {};

    if (name !== account.name) payload.name = name;
    if (parseFloat(openingBalance) !== account.opening_balance)
      payload.opening_balance = parseFloat(openingBalance) || 0;
    if (subtype !== account.subtype) payload.subtype = subtype;
    if (owner !== (account.owner ?? "")) payload.owner = owner.trim();
    if (description !== (currentDescription ?? account.description ?? ""))
      payload.description = description;
    if (notes !== (currentNotes ?? account.notes ?? ""))
      payload.notes = notes;

    if (Object.keys(payload).length === 0) {
      notify({ description: "Please update at least one field.", status: "warning" });
      return;
    }

    try {
      setIsLoading(true);
      await api.put(
        `/ledger/${account.ledger_id}/account/${account.account_id}/update`,
        payload,
      );
      notify({ description: "Account updated successfully", status: "success" });
      onClose();
      onUpdateCompleted();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description: axiosError.response?.data?.detail || "Failed to update account",
          status: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={onClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
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
        <Box h="3px" bgGradient="linear(to-r, brand.400, brand.600, teal.300)" />

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
                Update {account.type === "asset" ? "Asset" : "Liability"} Account
              </Box>
              <Box fontSize="sm" color={modalSubtitleColor}>
                Modify account details and settings
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
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Account Name */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" mb={2}>
                  Account Name
                </FormLabel>
                <Input
                  placeholder={`e.g., ${account.type === "asset" ? "Cash, Bank Account" : "Credit Card, Mortgage"}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
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
                  autoFocus
                />
                <FormHelperText mt={2}>
                  Update the name of your {account.type} account
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Subtype + Opening Balance */}
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
                    Account Type
                  </FormLabel>
                  <Select
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
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
                  >
                    {subtypeOptions.map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </Select>
                  <FormHelperText mt={2}>
                    Choose the category that best describes this account
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Opening Balance
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
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="0.00"
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={{ borderColor: "brand.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                    />
                  </InputGroup>
                  <FormHelperText mt={2}>
                    Starting balance for this account
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>

            {/* Owner */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormOwnerSuggestionField
                suggestionsUrl={`/ledger/${account.ledger_id}/account/owner/suggestions`}
                label="Owner (Optional)"
                value={owner}
                setValue={setOwner}
                placeholder="e.g., John Doe"
                helperText="Assign this account to a person for filtering"
                borderColor={inputBorderColor}
                inputBg={inputBg}
              />
            </Box>

            {/* Description + Notes */}
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
                    placeholder="e.g., My main checking account"
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
                    A brief overview of this account&apos;s purpose
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
                    Detailed notes for this account
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>
          </VStack>

          {/* Mobile action buttons */}
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
              isDisabled={!name || !hasChanges()}
            >
              Update Account
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

        {/* Desktop footer */}
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
            isDisabled={!name || !hasChanges()}
          >
            Update Account
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

export default UpdateAccountModal;
