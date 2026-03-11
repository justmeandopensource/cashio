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
  InputGroup,
  InputLeftAddon,
  Select,
  Button,
  useToast,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import useLedgerStore from "../shared/store";
import { Edit, Check, X } from "lucide-react";
import { toastDefaults } from "../shared/utils";

interface GroupAccount {
  account_id: string | number;
  name: string;
}

interface Account {
  account_id: string | number;
  name: string;
  opening_balance: number;
  parent_account_id: string | number | null;
  type: "asset" | "liability";
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
  opening_balance?: number;
  parent_account_id?: string | number | null;
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
  const [parentAccountId, setParentAccountId] = useState<
    string | number | null
  >(account.parent_account_id);
  const [description, setDescription] = useState<string>(
    currentDescription ?? account.description ?? ""
  );
  const [notes, setNotes] = useState<string>(
    currentNotes ?? account.notes ?? ""
  );
  const [groupAccounts, setGroupAccounts] = useState<GroupAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingGroups, setIsFetchingGroups] = useState<boolean>(false);
  const toast = useToast();

  const { currencySymbol } = useLedgerStore();

  // Modern theme colors - matching other modals
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Fetch group accounts based on the account type
  useEffect(() => {
    const fetchGroupAccounts = async (): Promise<void> => {
      try {
        setIsFetchingGroups(true);
        const response = await api.get<GroupAccount[]>(
          `/ledger/${account.ledger_id}/accounts/group?account_type=${account.type}`,
        );
        setGroupAccounts(response.data);
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status !== 401) {
          toast({
            description:
              axiosError.response?.data?.detail ||
              "Failed to fetch group accounts",
            status: "error",
            ...toastDefaults,
          });
        }
      } finally {
        setIsFetchingGroups(false);
      }
    };

    if (isOpen) {
      fetchGroupAccounts();
    }
  }, [isOpen, account.ledger_id, account.type, toast]);

  // Update state when props change
  React.useEffect(() => {
    setDescription(currentDescription ?? account.description ?? "");
    setNotes(currentNotes ?? account.notes ?? "");
  }, [currentDescription, currentNotes, account.description, account.notes]);

  const handleSubmit = async (): Promise<void> => {
    if (!name) {
      toast({
        description: "Please enter an account name.",
        status: "warning",
        ...toastDefaults,
      });
      return;
    }

    const payload: UpdateAccountPayload = {};

    // Add only the fields that have changed
    if (name !== account.name) payload.name = name;
    if (parseFloat(openingBalance) !== account.opening_balance)
      payload.opening_balance = parseFloat(openingBalance) || 0;
    if (parentAccountId !== account.parent_account_id)
      payload.parent_account_id = parentAccountId;
    if (description !== (currentDescription ?? account.description ?? ""))
      payload.description = description;
    if (notes !== (currentNotes ?? account.notes ?? ""))
      payload.notes = notes;

    // If no fields have changed, show an error toast
    if (Object.keys(payload).length === 0) {
      toast({
        description: "Please update at least one field.",
        status: "warning",
        ...toastDefaults,
      });
      return;
    }

    try {
      setIsLoading(true);
      await api.put(
        `/ledger/${account.ledger_id}/account/${account.account_id}/update`,
        payload,
      );
      toast({
        description: "Account updated successfully",
        status: "success",
        ...toastDefaults,
      });
      onClose();
      onUpdateCompleted();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description:
            axiosError.response?.data?.detail || "Failed to update account",
          status: "error",
          ...toastDefaults,
        });
      }
    } finally {
      setIsLoading(false);
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
              <Edit size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Box
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Update {account.type === "asset" ? "Asset" : "Liability"}{" "}
                Account
              </Box>
              <Box
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
              >
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
                  placeholder={`e.g., ${
                    account.type === "asset"
                      ? "Cash, Bank Account"
                      : "Credit Card, Mortgage"
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <FormHelperText mt={2}>
                  Update the name of your {account.type} account
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Opening Balance Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
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
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
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
            </Box>

            {/* Parent Account Card */}
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
                {isFetchingGroups && (
                  <Flex justify="center" align="center" py={8}>
                    <VStack spacing={3}>
                      <Spinner size="md" color="teal.500" thickness="3px" />
                      <Text fontSize="sm" color="gray.600">
                        Loading parent accounts...
                      </Text>
                    </VStack>
                  </Flex>
                )}

                {/* Show parent account selection if data is available */}
                {groupAccounts.length > 0 && !isFetchingGroups && (
                  <>
                    <Select
                      value={parentAccountId?.toString() || ""}
                      onChange={(e) =>
                        setParentAccountId(
                          e.target.value ? e.target.value : null,
                        )
                      }
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
                      data-testid="updateaccountmodal-parent-account-dropdown"
                    >
                      {groupAccounts.map((group) => (
                        <option
                          key={group.account_id.toString()}
                          value={group.account_id.toString()}
                        >
                          {group.name}
                        </option>
                      ))}
                    </Select>
                    <FormHelperText mt={2}>
                      Organize this account under an existing group
                    </FormHelperText>
                  </>
                )}

                {/* Show message if no group accounts are available */}
                {groupAccounts.length === 0 && !isFetchingGroups && (
                  <Box
                    bg="blue.50"
                    border="2px solid"
                    borderColor="blue.200"
                    borderRadius="md"
                    p={4}
                  >
                    <Text color="blue.700" fontSize="sm" fontWeight="medium">
                      No group accounts available. This account will remain at
                      the root level.
                    </Text>
                  </Box>
                )}
              </FormControl>
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
                    Detailed notes for this account
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
              isLoading={isLoading}
              loadingText="Updating..."
               isDisabled={
                 !name ||
                 (name === account.name &&
                   openingBalance === account.opening_balance.toString() &&
                   parentAccountId === account.parent_account_id &&
                   description === (currentDescription ?? account.description ?? "") &&
                   notes === (currentNotes ?? account.notes ?? ""))
               }
              leftIcon={<Check />}
              _hover={{
                transform: isLoading ? "none" : "translateY(-2px)",
                boxShadow: isLoading ? "none" : "lg",
              }}
              transition="all 0.2s"
            >
              Update Account
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              size="lg"
              width="100%"
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
             isDisabled={
               !name ||
               (name === account.name &&
                 openingBalance === account.opening_balance.toString() &&
                 parentAccountId === account.parent_account_id &&
                 description === (currentDescription ?? account.description ?? "") &&
                 notes === (currentNotes ?? account.notes ?? ""))
             }
            leftIcon={<Check />}
            _hover={{
              transform: isLoading ? "none" : "translateY(-2px)",
              boxShadow: isLoading ? "none" : "lg",
            }}
            transition="all 0.2s"
          >
            Update Account
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

export default UpdateAccountModal;
