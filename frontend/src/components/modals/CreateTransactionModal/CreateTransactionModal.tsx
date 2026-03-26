import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  Button,
  HStack,
  Box,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import CreateTransactionForm from "./CreateTransactionForm";
import { useCreateTransactionForm } from "./useCreateTransactionForm";
import type { CreateTransactionModalProps } from "./types";

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onTransactionAdded,
  initialData,
}) => {
  const form = useCreateTransactionForm({
    isOpen,
    accountId,
    initialData,
    onClose,
    onTransactionAdded,
  });

  // Modal-level theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

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
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={borderColor}
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
                Add Transaction
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
              >
                Record your {form.type === "expense" ? "expense" : "income"}
              </Box>
            </Box>
          </HStack>
        </Box>

        <CreateTransactionForm
          {...form}
          accountId={accountId}
          onClose={onClose}
        />

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
            onClick={form.handleSubmit}
            px={8}
            py={3}
            borderRadius="lg"
            isLoading={form.isLoading}
            loadingText="Saving..."
            isDisabled={form.isSaveDisabled}
            fontWeight="bold"
          >
            Save Transaction
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={form.isLoading}
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

export default CreateTransactionModal;
