import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  Button,
  HStack,
  Box,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowRightLeft } from "lucide-react";
import { useTransferFundsForm } from "./useTransferFundsForm";
import TransferFundsForm from "./TransferFundsForm";
import type { TransferFundsModalProps } from "./types";

const TransferFundsModal: React.FC<TransferFundsModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onTransferCompleted,
  initialData,
  editTransferData,
}) => {
  const form = useTransferFundsForm({
    isOpen,
    onClose,
    accountId,
    onTransferCompleted,
    initialData,
    editTransferData,
  });

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const modalHeaderBorderColor = borderColor;
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
            <Icon as={ArrowRightLeft} boxSize={5} mt="3px" color={modalIconColor} />
            <Box>
              <Box fontSize="lg" fontWeight="800" letterSpacing="-0.02em" color={modalTitleColor}>
                {form.isEditMode ? "Edit Transfer" : "Transfer Funds"}
              </Box>
              <Box fontSize="sm" color={modalSubtitleColor}>
                {form.isEditMode ? "Update transfer details" : "Move money between accounts"}
              </Box>
            </Box>
          </HStack>
        </Box>

        <TransferFundsForm form={form} accountId={accountId} onClose={onClose} />

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
            fontWeight="bold"
            isLoading={form.isLoading}
            loadingText={form.isEditMode ? "Updating..." : "Transferring..."}
            isDisabled={form.isSaveDisabled}
          >
            {form.isEditMode ? "Save Changes" : "Complete Transfer"}
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

export default TransferFundsModal;
