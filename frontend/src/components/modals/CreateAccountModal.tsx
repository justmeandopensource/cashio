import React, { useState } from "react";
import { useColorModeValue } from "../ui/color-mode";
import {
  Input,
  NativeSelect,
  Button,
  Box,
  VStack,
  HStack,
  InputGroup,
  Textarea,
  Icon,
  Field,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import useLedgerStore from "../shared/store";
import { Plus, Check } from "lucide-react";
import { notify } from "@/components/shared/notify";
import { AxiosError } from "axios";
import { useCreateAccount } from "@features/ledger/hooks";
import FormOwnerSuggestionField from "@/components/shared/FormOwnerSuggestionField";
import { getSubtypesForType } from "@/features/ledger/constants/accountSubtypes";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: "asset" | "liability";
}


const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  accountType,
}) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
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

  const createAccountBase = useCreateAccount();
  const createAccountMutation = {
    ...createAccountBase,
    mutate: (payload: { name: string; subtype: string; type: string; owner?: string; opening_balance?: number; description?: string; notes?: string }) => {
      createAccountBase.mutate(
        { ledgerId: ledgerId!, data: payload },
        {
          onSuccess: () => {
            notify({ description: "Account created successfully.", status: "success" });
            resetForm();
            onClose();
          },
          onError: (error: Error) => {
            const axiosErr = error as AxiosError<{ detail: string }>;
            if (axiosErr.response?.status !== 401) {
              notify({ description: axiosErr.response?.data?.detail || "Failed to create account.", status: "error" });
            }
          },
        },
      );
    },
  };

  const handleSubmit = (): void => {
    if (!accountName) {
      notify({ description: "Please enter an account name.", status: "warning" });
      return;
    }
    if (!subtype) {
      notify({ description: "Please select an account type.", status: "warning" });
      return;
    }

    const payload: Record<string, any> = {
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

    createAccountMutation.mutate(payload as any);
  };

  return (
    <Dialog.Root
      open={isOpen}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slide-in-bottom"
      onOpenChange={e => {
        if (!e.open) {
          onClose();
        }
      }}>
      <Portal>

        <Dialog.Backdrop backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <Dialog.Positioner>
          <Dialog.Content
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
            flexDirection="column">
            {/* Gradient accent line */}
            <Box h="3px" bgGradient="to-r" gradientFrom="brand.400" gradientVia="brand.600" gradientTo="teal.300"  />

            {/* Header */}
            <Box
              px={{ base: 4, sm: 8 }}
              py={5}
              borderBottom="1px solid"
              borderColor={modalHeaderBorderColor}
            >
              <HStack gap={3} align="flex-start">
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><Plus /></Icon>
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
              <VStack gap={{ base: 5, sm: 6 }} align="stretch" w="100%">
                {/* Account Name */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Field.Root>
                    <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                      Account Name
                      {accountName && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
                    </Field.Label>
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
                    <Field.HelperText mt={2} color={textColorSecondary}>
                      Enter a descriptive name for your {accountType} account
                    </Field.HelperText>
                  </Field.Root>
                </Box>

                {/* Account Subtype + Opening Balance */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <VStack gap={5} align="stretch">
                    <Field.Root>
                      <Field.Label fontWeight="semibold" mb={2}>
                        Account Type
                      </Field.Label>
                      <NativeSelect.Root size="lg">
                        <NativeSelect.Field
                          value={subtype}
                          onChange={(e) => setSubtype(e.target.value)}
                          placeholder="Select account type"
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          bg={inputBg}
                          borderRadius="lg"
                          _hover={{ borderColor: "brand.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}>
                          {subtypeOptions.map(([value, meta]) => (
                            <option key={value} value={value}>
                              {meta.label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.HelperText mt={2} color={textColorSecondary}>
                        Choose the category that best describes this account
                      </Field.HelperText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label fontWeight="semibold" mb={2}>
                        Opening Balance
                      </Field.Label>
                      <InputGroup
                        startAddon={currencySymbol}
                        startAddonProps={{
                          size: "lg",
                          bg: inputBorderColor,
                          borderWidth: "2px",
                          borderColor: inputBorderColor,
                          color: textColorTertiary,
                          fontWeight: "semibold",
                        }}
                      >
                        <Input
                          type="number"
                          size="lg"
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
                      <Field.HelperText mt={2} color={textColorSecondary}>
                        Starting balance for this account (optional)
                      </Field.HelperText>
                    </Field.Root>
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
                  <VStack gap={5} align="stretch">
                    <Field.Root>
                      <Field.Label fontWeight="semibold" mb={2}>
                        Description
                      </Field.Label>
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
                        disabled={createAccountMutation.isPending}
                      />
                      <Field.HelperText mt={2} color={textColorSecondary}>
                        A brief overview of this account&apos;s purpose (optional)
                      </Field.HelperText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label fontWeight="semibold" mb={2}>
                        Notes
                      </Field.Label>
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
                        disabled={createAccountMutation.isPending}
                      />
                      <Field.HelperText mt={2} color={textColorSecondary}>
                        Detailed notes for this account (optional)
                      </Field.HelperText>
                    </Field.Root>
                  </VStack>
                </Box>
              </VStack>

              {/* Mobile action buttons */}
              <Box display={{ base: "block", sm: "none" }} mt={6}>
                <Button
                  onClick={handleSubmit}
                  colorPalette="brand"
                  size="lg"
                  width="100%"
                  mb={3}
                  borderRadius="lg"
                  fontWeight="bold"
                  loading={createAccountMutation.isPending}
                  disabled={!accountName || !subtype}
                  loadingText="Creating..."
                >
                  Create Account
                </Button>
                <Button
                  variant="ghost"
                  colorPalette="gray"
                  onClick={onClose}
                  size="lg"
                  width="100%"
                  borderRadius="lg"
                  disabled={createAccountMutation.isPending}
                >
                  Cancel
                </Button>
              </Box>
            </Dialog.Body>

            {/* Desktop footer */}
            <Dialog.Footer
              display={{ base: "none", sm: "flex" }}
              px={8}
              py={6}
              bg={footerBg}
              borderTop="1px solid"
              borderColor={borderColor}
            >
              <Button
                colorPalette="brand"
                mr={3}
                onClick={handleSubmit}
                px={8}
                py={3}
                borderRadius="lg"
                fontWeight="bold"
                loading={createAccountMutation.isPending}
                disabled={!accountName || !subtype}
                loadingText="Creating..."
              >
                Create Account
              </Button>
              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={onClose}
                disabled={createAccountMutation.isPending}
                px={6}
                py={3}
                borderRadius="lg"
              >
                Cancel
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default CreateAccountModal;
