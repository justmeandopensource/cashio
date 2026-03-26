import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  HStack,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/components/shared/utils";
import { splitCurrencyForDisplay } from "../mutual-funds/utils";
import type { Transaction } from "@/types";

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (transactionId: string) => Promise<void>;
  /** For TransactionCard: the full transaction for showing details */
  transaction?: Transaction;
  /** For TransactionTable: just the ID */
  transactionId?: string | null;
  currencySymbol?: string;
  amountColor?: string;
  amountValue?: number;
}

const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  transaction,
  transactionId,
  currencySymbol,
  amountColor,
  amountValue,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const modalSize = useBreakpointValue({ base: "full", md: "md" });
  const isMobile = useBreakpointValue({ base: true, md: false });
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.100", "gray.700");
  const modalDetailBg = useColorModeValue("gray.50", "gray.700");

  const handleDelete = async () => {
    const id = transaction?.transaction_id ?? transactionId;
    if (!id) return;
    try {
      setIsDeleting(true);
      await onDelete(id);
      onClose();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={onClose}
      size={modalSize}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        margin={isMobile ? 0 : "auto"}
        borderRadius={isMobile ? 0 : "xl"}
        bg={modalBg}
        border="1px solid"
        borderColor={modalBorderColor}
        boxShadow="2xl"
      >
        <ModalHeader fontWeight="800" letterSpacing="-0.02em">Delete Transaction</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Are you sure you want to delete this transaction?</Text>
          {transaction && currencySymbol && amountValue !== undefined && (
            <Box mt={4} p={3} bg={modalDetailBg} borderRadius="xl" border="1px solid" borderColor={modalBorderColor}>
              <Text fontWeight="bold">{transaction.category_name}</Text>
              <Text fontSize="sm" color="secondaryTextColor">{formatDate(transaction.date)}</Text>
              <HStack spacing={0} align="baseline" mt={1}>
                <Text fontWeight="bold" color={amountColor}>
                  {splitCurrencyForDisplay(amountValue, currencySymbol).main}
                </Text>
                <Text fontSize="xs" color={amountColor} opacity={0.6}>
                  {splitCurrencyForDisplay(amountValue, currencySymbol).decimals}
                </Text>
              </HStack>
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isDeleting} borderRadius="lg">
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting"
            leftIcon={<Trash2 size={16} />}
            borderRadius="lg"
            fontWeight="bold"
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteTransactionModal;
