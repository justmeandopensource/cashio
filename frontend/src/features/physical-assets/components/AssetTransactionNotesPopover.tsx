import { FC, useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverBody,
  useColorModeValue,
  Link as ChakraLink,
  Icon,
  IconButton,
  Textarea,
  Button,
  Flex,
  Text,
  Box,
} from "@chakra-ui/react";
import { FileText, Edit, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import { notify } from "@/components/shared/notify";

const useUpdateAssetTransactionNotes = () => {
  const queryClient = useQueryClient();
  const { ledgerId } = useLedgerStore();

  return useMutation({
    mutationFn: ({
      assetTransactionId,
      notes,
    }: {
      assetTransactionId: number;
      notes: string;
    }) =>
      api.patch(
        `/ledger/${ledgerId}/asset-transaction/${assetTransactionId}`,
        { notes },
      ),
    onSuccess: () => {
      // Invalidate all asset transaction queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: ["asset-transactions", ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-asset-transactions", ledgerId],
      });
      // Also invalidate asset-specific queries (we don't know which asset this transaction belongs to)
      queryClient.invalidateQueries({
        queryKey: ["asset-transactions"],
      });
    },
  });
};

interface AssetTransactionNotesPopoverProps {
  transaction: {
    asset_transaction_id: number;
    notes?: string | null;
  };
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const AssetTransactionNotesPopover: FC<AssetTransactionNotesPopoverProps> = ({
  transaction,
  isOpen,
  onOpen,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(transaction.notes || "");
  const popoverBg = useColorModeValue("white", "gray.800");
  const popoverBorderColor = useColorModeValue("gray.100", "gray.700");
  const popoverHeaderBorderColor = popoverBorderColor;
  const popoverHeaderBg = useColorModeValue("gray.50", "gray.700");
  const popoverTitleColor = useColorModeValue("gray.900", "gray.50");
  const popoverIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.15)");
  const popoverIconColor = useColorModeValue("brand.600", "brand.300");

  const updateNotesMutation = useUpdateAssetTransactionNotes();

  useEffect(() => {
    if (isOpen) {
      // When the popover is opened, reset the state to match the prop.
      setNotes(transaction.notes || "");
    } else {
      // When the popover is closed, always reset the editing state.
      setIsEditing(false);
    }
  }, [isOpen, transaction.notes]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    try {
      await updateNotesMutation.mutateAsync({
        assetTransactionId: transaction.asset_transaction_id,
        notes,
      });
      notify({
        title: "Note updated",
        description: "The transaction note has been saved.",
        status: "success",
      });
      onClose(); // Close popover on successful save
    } catch {
      notify({
        title: "Error",
        description: "Failed to update the note.",
        status: "error",
      });
    }
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={handleClose}
      placement="left-start"
      isLazy
    >
      <PopoverTrigger>
        <ChakraLink _hover={{ textDecoration: "none" }}>
          <Icon
            as={FileText}
            boxSize={4}
            color={transaction.notes ? "blue.500" : "gray.400"}
            _hover={{ color: transaction.notes ? "blue.600" : "gray.500" }}
            transition="opacity 0.2s"
          />
        </ChakraLink>
      </PopoverTrigger>
      <PopoverContent
        bg={popoverBg}
        borderRadius="xl"
        boxShadow="2xl"
        border="1px solid"
        borderColor={popoverBorderColor}
        overflow="hidden"
        w="300px"
      >
        <PopoverArrow bg={popoverBg} />
        <PopoverHeader
          bg={popoverHeaderBg}
          px={4}
          py={3}
          fontWeight="bold"
          borderBottom="1px solid"
          borderColor={popoverHeaderBorderColor}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Flex align="center" gap={2}>
            <Box p={1} bg={popoverIconBg} borderRadius="md">
              <FileText size={14} color={popoverIconColor} />
            </Box>
            <Text fontSize="sm" fontWeight="bold" color={popoverTitleColor}>
              Transaction Note
            </Text>
          </Flex>
          {!isEditing && (
            <IconButton
              aria-label={transaction.notes ? "Edit note" : "Add note"}
              icon={<Edit size={16} />}
              size="xs"
              variant="ghost"
              colorScheme="teal"
              onClick={() => setIsEditing(true)}
            />
          )}
        </PopoverHeader>
        <PopoverBody p={4}>
          {isEditing ? (
            <Box>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note for this transaction..."
                size="sm"
                borderRadius="md"
                minH="100px"
              />
              <Flex justify="flex-end" mt={3}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  leftIcon={<X size={16} />}
                  mr={2}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={handleSave}
                  isLoading={updateNotesMutation.isPending}
                  leftIcon={<Save size={16} />}
                >
                  Save
                </Button>
              </Flex>
            </Box>
          ) : (
            <Text
              whiteSpace="pre-wrap"
              color={notes ? "inherit" : "gray.500"}
            >
              {notes || "Click the edit icon to add a note."}
            </Text>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default AssetTransactionNotesPopover;
