import React, { useState, useEffect } from "react";
import {
  Flex,
  Spinner,
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
  Checkbox,
  Button,
  useToast,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  Text,
  InputGroup,
  InputLeftAddon,
  Textarea,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import useLedgerStore from "../shared/store";
import { Plus, X, CheckCircle } from "lucide-react";
import { toastDefaults } from "../shared/utils";
import { AxiosError } from "axios";

interface GroupAccount {
  account_id: string;
  name: string;
}

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: "asset" | "liability";
  parentAccountId?: string | null;
}

interface CreateAccountPayload {
  name: string;
  is_group: boolean;
  parent_account_id: string | null;
  type: string;
  opening_balance?: number;
  description?: string;
  notes?: string;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  accountType,
  parentAccountId,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { ledgerId, currencySymbol } = useLedgerStore();
  const [accountName, setAccountName] = useState<string>("");
  const [isGroupAccount, setIsGroupAccount] = useState<boolean>(false);
  const [parentAccount, setParentAccount] = useState<string>(
    parentAccountId || "",
  );
  const [openingBalance, setOpeningBalance] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Modern theme colors - matching CreateTransactionModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const textColorTertiary = useColorModeValue("gray.600", "gray.200");
  const textColorError = useColorModeValue("red.700", "red.300");
  const bgInfo = useColorModeValue("blue.50", "blue.900");
  const borderColorInfo = useColorModeValue("blue.200", "blue.700");
  const textColorInfo = useColorModeValue("blue.700", "blue.300");
  const buttonBorderColor = useColorModeValue("gray.300", "gray.600");
  const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
  const buttonHoverBorderColor = useColorModeValue("gray.400", "gray.500");

  // Update parentAccount state when parentAccountId prop changes
  useEffect(() => {
    setParentAccount(parentAccountId || "");
  }, [parentAccountId]);

  // Fetch group accounts when the modal is opened
  const {
    data: groupAccounts,
    isLoading: isGroupAccountsLoading,
    isError: isGroupAccountsError,
  } = useQuery({
    queryKey: ["groupAccounts", ledgerId, accountType],
    queryFn: async (): Promise<GroupAccount[]> => {
      try {
        const response = await api.get<GroupAccount[]>(
          `/ledger/${ledgerId}/accounts/group?account_type=${accountType}`,
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status === 401) {
          throw error; // Let the interceptor handle the redirect
        }
        throw new Error(
          axiosError.response?.data?.detail || "Failed to fetch group accounts",
        );
      }
    },
    enabled: isOpen && !parentAccountId, // Only fetch group accounts when the modal is open and no parentAccountId is provided
  });

  // Reset form fields
  const resetForm = (): void => {
    setAccountName("");
    setIsGroupAccount(false);
    setParentAccount(parentAccountId || "");
    setOpeningBalance("");
    setDescription("");
    setNotes("");
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Mutation for creating a new account
  const createAccountMutation = useMutation({
    mutationFn: async (payload: CreateAccountPayload) => {
      const response = await api.post(
        `/ledger/${ledgerId}/account/create`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        description: "Account created successfully.",
        status: "success",
        ...toastDefaults,
      });
      resetForm();
      onClose();
      queryClient.invalidateQueries({
        queryKey: ["accounts"],
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        toast({
          description:
            error.response?.data?.detail || "Failed to create account.",
          status: "error",
          ...toastDefaults,
        });
      }
    },
  });

  // Handle form submission
  const handleSubmit = (): void => {
    if (!accountName) {
      toast({
        description: "Please enter an account name.",
        status: "warning",
        ...toastDefaults,
      });
      return;
    }

    const payload: CreateAccountPayload = {
      name: accountName,
      is_group: isGroupAccount,
      parent_account_id: parentAccount || null,
      type: accountType,
    };

    // Add opening_balance only if it's provided and the account is not a group account
    if (!isGroupAccount && openingBalance) {
      payload.opening_balance = parseFloat(openingBalance);
    }

    // Add description and notes if provided
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
              <Plus size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Box
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Create {accountType === "asset" ? "Asset" : "Liability"} Account
              </Box>
              <Box
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
              >
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
          overflow="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Account Name Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" mb={2}>
                  Account Name
                </FormLabel>
                <Input
                  placeholder={`e.g., ${accountType === "asset" ? "Cash, Bank Account" : "Credit Card, Mortgage"}`}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  onKeyDown={handleKeyDown}
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
                  autoFocus
                />
                 <FormHelperText mt={2} color={textColorSecondary}>
                   Enter a descriptive name for your {accountType} account
                 </FormHelperText>
              </FormControl>
            </Box>

            {/* Account Type Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                {/* Group Account Toggle */}
                <Box>
                  <HStack justifyContent="space-between" align="center" mb={2}>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>
                        Group Account
                      </Text>
                       <Text fontSize="sm" color={textColor}>
                         Group accounts can contain other accounts but cannot
                         hold transactions
                       </Text>
                    </Box>
                    <Checkbox
                      isChecked={isGroupAccount}
                      onChange={(e) => setIsGroupAccount(e.target.checked)}
                      colorScheme="teal"
                      size="lg"
                    />
                  </HStack>
                </Box>

                {/* Opening Balance (only for non-group accounts) */}
                {!isGroupAccount && (
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
                        borderRadius="md"
                        _hover={{ borderColor: "teal.300" }}
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
                )}
              </VStack>
            </Box>

            {/* Parent Account Card (only show if not creating under a specific parent) */}
            {!parentAccountId && (
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Parent Account (Optional)
                  </FormLabel>

                  {/* Show loading spinner while fetching group accounts */}
                  {isGroupAccountsLoading && (
                    <Flex justify="center" align="center" py={8}>
                      <VStack spacing={3}>
                        <Spinner size="md" color="teal.500" thickness="3px" />
                         <Text fontSize="sm" color={textColor}>
                           Loading group accounts...
                         </Text>
                      </VStack>
                    </Flex>
                  )}

                  {/* Show error message if fetching group accounts fails */}
                  {isGroupAccountsError && (
                    <Box
                      bg="red.50"
                      border="2px solid"
                      borderColor="red.200"
                      borderRadius="md"
                      p={4}
                    >
                                             <Text
                                               color={textColorError}
                                               fontSize="sm"
                                               fontWeight="medium"
                                             >
                                               Failed to load group accounts. Please try again.
                                             </Text>
                    </Box>
                  )}

                  {/* Show parent account selection if data is available */}
                  {groupAccounts &&
                    groupAccounts.length > 0 &&
                    !isGroupAccountsLoading && (
                      <>
                        <Select
                          value={parentAccount}
                          onChange={(e) => setParentAccount(e.target.value)}
                          placeholder="Select parent account"
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
                          {groupAccounts.map((account) => (
                            <option
                              key={account.account_id}
                              value={account.account_id}
                            >
                              {account.name}
                            </option>
                          ))}
                        </Select>
                         <FormHelperText mt={2} color={textColorSecondary}>
                           Organize this account under an existing group
                         </FormHelperText>
                      </>
                    )}

                  {/* Show message if no group accounts are available */}
                  {groupAccounts &&
                    groupAccounts.length === 0 &&
                    !isGroupAccountsLoading &&
                    !isGroupAccountsError && (
                       <Box
                         bg={bgInfo}
                         border="2px solid"
                         borderColor={borderColorInfo}
                         borderRadius="md"
                         p={4}
                       >
                         <Text
                           color={textColorInfo}
                           fontSize="sm"
                           fontWeight="medium"
                         >
                           No group accounts available. This account will be
                           created at the root level.
                         </Text>
                       </Box>
                    )}
                </FormControl>
               </Box>
             )}

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
                     placeholder="e.g., My main checking account"
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
                     borderRadius="md"
                     rows={4}
                     _hover={{ borderColor: "teal.300" }}
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

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={createAccountMutation.isPending}
              isDisabled={!accountName || isGroupAccountsError}
              loadingText="Creating..."
              leftIcon={<CheckCircle />}
              _hover={{
                transform: createAccountMutation.isPending
                  ? "none"
                  : "translateY(-2px)",
                boxShadow: createAccountMutation.isPending ? "none" : "lg",
              }}
              transition="all 0.2s"
            >
              Create Account
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="md"
              isDisabled={createAccountMutation.isPending}
              leftIcon={<X />}
               borderWidth="2px"
               borderColor={buttonBorderColor}
               color={textColorTertiary}
               _hover={{
                 bg: buttonHoverBg,
                 borderColor: buttonHoverBorderColor,
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
            isLoading={createAccountMutation.isPending}
            isDisabled={!accountName || isGroupAccountsError}
            loadingText="Creating..."
            leftIcon={<CheckCircle />}
            _hover={{
              transform: createAccountMutation.isPending
                ? "none"
                : "translateY(-2px)",
              boxShadow: createAccountMutation.isPending ? "none" : "lg",
            }}
            transition="all 0.2s"
          >
            Create Account
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            isDisabled={createAccountMutation.isPending}
            leftIcon={<X />}
            px={6}
            py={3}
            borderRadius="md"
             borderWidth="2px"
             borderColor={buttonBorderColor}
             color={textColorTertiary}
             _hover={{
               bg: buttonHoverBg,
               borderColor: buttonHoverBorderColor,
             }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateAccountModal;
