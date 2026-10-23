import React from "react";
import { useColorModeValue } from "../../ui/color-mode";
import { Button, HStack, Box, Icon, Dialog, Portal } from "@chakra-ui/react";
import { Edit } from "lucide-react";
import { useEditTransactionForm } from "./useEditTransactionForm";
import EditTransactionForm from "./EditTransactionForm";
import type { EditTransactionModalProps } from "./types";

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  const form = useEditTransactionForm(isOpen, transaction, onClose, onTransactionUpdated);

  // Modal shell theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

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
            <Box h="3px" bgGradient="to-r" gradientFrom="brand.400" gradientVia="brand.600" gradientTo="teal.300"  />
            {/* Flat header */}
            <Box
              px={{ base: 4, sm: 8 }}
              py={5}
              borderBottom="1px solid"
              borderColor={modalHeaderBorderColor}
            >
              <HStack gap={3} align="flex-start">
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><Edit /></Icon>

                <Box>
                  <Box
                    fontSize="lg"
                    fontWeight="800"
                    letterSpacing="-0.02em"
                    color={modalTitleColor}
                  >
                    Edit Transaction
                  </Box>
                  <Box
                    fontSize="sm"
                    color={modalSubtitleColor}
                  >
                    Update your {form.type === "expense" ? "expense" : "income"}
                  </Box>
                </Box>
              </HStack>
            </Box>

            <EditTransactionForm {...form} onClose={onClose} />

            {/* Desktop-only footer */}
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
                onClick={form.handleSubmit}
                px={8}
                py={3}
                borderRadius="lg"
                loading={form.isLoading}
                loadingText="Saving..."
                disabled={form.isSaveDisabled}
                fontWeight="bold"
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={onClose}
                disabled={form.isLoading}
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

export default EditTransactionModal;
