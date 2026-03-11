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
  useToast,
  Text,
  Box,
} from "@chakra-ui/react";
import { FileText, Edit, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import { toastDefaults } from "@/components/shared/utils";

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
  const toast = useToast();
  const popoverBg = useColorModeValue("white", "gray.800");
  const popoverBorderColor = useColorModeValue("gray.100", "gray.700");

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
      toast({
        ...toastDefaults,
        title: "Note updated",
        description: "The transaction note has been saved.",
        status: "success",
      });
      onClose(); // Close popover on successful save
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast({
        ...toastDefaults,
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
          bgGradient="linear(135deg, teal.400, teal.600)"
          color="white"
          px={4}
          py={3}
          fontWeight="bold"
          borderBottom="none"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          Transaction Note
          {!isEditing && (
            <IconButton
              aria-label={transaction.notes ? "Edit note" : "Add note"}
              icon={<Edit size={16} />}
              size="xs"
              color="white"
              variant="ghost"
              _hover={{ bg: "teal.700" }}
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
