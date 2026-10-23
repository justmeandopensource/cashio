import { FC } from "react";
import { useColorModeValue } from "../../../../components/ui/color-mode";
import { Button, VStack, HStack, Text, Box, Icon, Dialog, Portal } from "@chakra-ui/react";
import { TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { splitCurrencyForDisplay } from "../../utils";

interface PortfolioChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalValueChange: number;
  totalValueChangePercent: number;
  currencySymbol: string;
}

const PortfolioChangeModal: FC<PortfolioChangeModalProps> = ({
  isOpen,
  onClose,
  totalValueChange,
  totalValueChangePercent,
  currencySymbol,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

  const totalValueFormatted = splitCurrencyForDisplay(Math.abs(totalValueChange), currencySymbol);
  const totalValuePercentFormatted = {
    value: `${Math.abs(totalValueChangePercent).toFixed(2)}%`,
    isPositive: totalValueChangePercent >= 0,
  };

  return (
    <Dialog.Root
      open={isOpen}
      restoreFocus={false}
      size='md'
      placement='center'
      motionPreset="slide-in-bottom"
      closeOnInteractOutside={false}
      closeOnEscape={false}
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
            borderRadius="xl"
            boxShadow="2xl"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
            mx={4}>
            <Box
              px={6}
              py={5}
              borderBottom="1px solid"
              borderColor={modalHeaderBorderColor}
            >
              <HStack gap={3} align="flex-start">
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><CheckCircle /></Icon>
                <Box>
                  <Text fontSize="lg" fontWeight="800" letterSpacing="-0.02em" color={modalTitleColor}>
                    Portfolio Updated Successfully
                  </Text>
                  <Text fontSize="sm" color={modalSubtitleColor}>
                    Your mutual fund NAVs have been updated
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Dialog.Body px={6} py={6}>
              <VStack gap={6} align="stretch">
                <Text fontSize="md" color="gray.600" textAlign="center">
                  Here&apos;s how your portfolio value changed:
                </Text>

                <Box
                  p={6}
                  bg={useColorModeValue("gray.50", "gray.700")}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                  textAlign="center"
                >
                  <VStack gap={3}>
                  <HStack gap={3} justify="center">
                      <Icon
                        boxSize={5}
                        color={totalValueChange >= 0 ? "green.500" : "red.500"}
                        asChild
                      >
                        {totalValueChange >= 0 ? <TrendingUp /> : <TrendingDown />}
                      </Icon>
                      <HStack gap={0} align="baseline">
                        <Text
                          fontSize="3xl"
                          fontWeight="bold"
                          color={totalValueChange >= 0 ? "green.500" : "red.500"}
                        >
                          {totalValueChange >= 0 ? "+" : "-"}{totalValueFormatted.main}
                        </Text>
                        <Text
                          fontSize="xl"
                          fontWeight="bold"
                          color={totalValueChange >= 0 ? "green.500" : "red.500"}
                          opacity={0.7}
                        >
                          {totalValueFormatted.decimals}
                        </Text>
                      </HStack>
                    </HStack>
                    <HStack gap={2} justify="center">
                      <Text
                        fontSize="xl"
                        fontWeight="semibold"
                        color={
                          totalValuePercentFormatted.isPositive
                            ? "green.500"
                            : "red.500"
                        }
                      >
                        ({totalValuePercentFormatted.isPositive ? "+" : "-"}
                        {totalValuePercentFormatted.value})
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer
              px={6}
              py={4}
              bg={useColorModeValue("gray.50", "gray.700")}
              borderTop="1px solid"
              borderColor={borderColor}
            >
              <Button colorPalette="brand" onClick={onClose} w="full">
                Got it
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default PortfolioChangeModal;

