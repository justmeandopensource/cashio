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
  Select,
  Button,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  InputGroup,
  InputLeftAddon,
  Textarea,
  Icon,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import useLedgerStore from "../shared/store";
import { Plus, Check } from "lucide-react";
import { notify } from "@/components/shared/notify";
import { AxiosError } from "axios";
import FormOwnerSuggestionField from "@/components/shared/FormOwnerSuggestionField";
import { getSubtypesForType } from "@/features/ledger/constants/accountSubtypes";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: "asset" | "liability";
}

interface CreateAccountPayload {
  name: string;
  subtype: string;
  type: string;
  owner?: string;
  opening_balance?: number;
  description?: string;
  notes?: string;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  accountType,
}) => {
  const queryClient = useQueryClient();
  const { ledgerId, currencySymbol } = useLedgerStore();
  const [accountName, setAccountName] = useState<string>("");
  const [subtype, setSubtype] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [openingBalance, setOpeningBalance] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const subtypeOptions = getSubtypesForType(accountType);

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const textColorTertiary = useColorModeValue("gray.600", "gray.200");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = textColorSecondary;
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

  const resetForm = (): void => {
    setAccountName("");
    setSubtype("");
    setOwner("");
    setOpeningBalance("");
    setDescription("");
    setNotes("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const createAccountMutation = useMutation({
    mutationFn: async (payload: CreateAccountPayload) => {
      const response = await api.post(
        `/ledger/${ledgerId}/account/create`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      notify({
        description: "Account created successfully.",
        status: "success",
      });
      resetForm();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        notify({
          description: error.response?.data?.detail || "Failed to create account.",
          status: "error",
        });
      }
    },
  });

  const handleSubmit = (): void => {
    if (!accountName) {
      notify({ description: "Please enter an account name.", status: "warning" });
      return;
    }
    if (!subtype) {
      notify({ description: "Please select an account type.", status: "warning" });
      return;
    }

    const payload: CreateAccountPayload = {
      name: accountName,
      subtype,
      type: accountType,
    };

    if (owner.trim()) {
      payload.owner = owner.trim();
    }
    if (openingBalance) {
      payload.opening_balance = parseFloat(openingBalance);
    }
    if (description) {
      payload.description = description;
    }
    if (notes) {
      payload.notes = notes;
    }

    createAccountMutation.mutate(payload);
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
        {/* Gradient accent line */}
        <Box h="3px" bgGradient="linear(to-r, brand.400, brand.600, teal.300)" />

        {/* Header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={Plus} boxSize={5} mt="3px" color={modalIconColor} />
            <Box>
              <Box
                fontSize="lg"
                fontWeight="800"
                letterSpacing="-0.02em"
                color={modalTitleColor}
              >
                Create {accountType === "asset" ? "Asset" : "Liability"} Account
              </Box>
              <Box fontSize="sm" color={modalSubtitleColor}>
                Add a new {accountType} account to your ledger
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
              <FormControl>
                <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Account Name
                  {accountName && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                </FormLabel>
                <Input
                  placeholder={`e.g., ${accountType === "asset" ? "HSBC Current Account" : "Tesco Credit Card"}`}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
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
                <FormHelperText mt={2} color={textColorSecondary}>
                  Enter a descriptive name for your {accountType} account
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Account Subtype + Opening Balance */}
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
                    placeholder="Select account type"
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
                  <FormHelperText mt={2} color={textColorSecondary}>
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
                      color={textColorTertiary}
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
                  <FormHelperText mt={2} color={textColorSecondary}>
                    Starting balance for this account (optional)
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
                suggestionsUrl={`/ledger/${ledgerId}/account/owner/suggestions`}
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
                    isDisabled={createAccountMutation.isPending}
                  />
                  <FormHelperText mt={2} color={textColorSecondary}>
                    A brief overview of this account&apos;s purpose (optional)
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
                    isDisabled={createAccountMutation.isPending}
                  />
                  <FormHelperText mt={2} color={textColorSecondary}>
                    Detailed notes for this account (optional)
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
              isLoading={createAccountMutation.isPending}
              isDisabled={!accountName || !subtype}
              loadingText="Creating..."
            >
              Create Account
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="lg"
              isDisabled={createAccountMutation.isPending}
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
            isLoading={createAccountMutation.isPending}
            isDisabled={!accountName || !subtype}
            loadingText="Creating..."
          >
            Create Account
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={createAccountMutation.isPending}
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

export default CreateAccountModal;
