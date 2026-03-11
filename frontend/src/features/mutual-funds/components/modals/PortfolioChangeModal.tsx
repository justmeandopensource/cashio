import { FC } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
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

  const totalValueFormatted = splitCurrencyForDisplay(Math.abs(totalValueChange), currencySymbol);
  const totalValuePercentFormatted = {
    value: `${Math.abs(totalValueChangePercent).toFixed(2)}%`,
    isPositive: totalValueChangePercent >= 0,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isCentered
      motionPreset="slideInBottom"
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius="xl"
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mx={4}
      >
        <Box
          bgGradient="linear(135deg, teal.400, teal.600)"
          color="white"
          px={6}
          py={4}
          position="relative"
        >
          <VStack spacing={2} align="center">
            <Box
              p={2}
              bg="whiteAlpha.200"
              borderRadius="full"
              backdropFilter="blur(10px)"
            >
              <CheckCircle size={24} />
            </Box>
            <Text fontSize="xl" fontWeight="bold" textAlign="center">
              Portfolio Updated Successfully
            </Text>
            <Text fontSize="sm" color="whiteAlpha.900" textAlign="center">
              Your mutual fund NAVs have been updated
            </Text>
          </VStack>
        </Box>

        <ModalBody px={6} py={6}>
          <VStack spacing={6} align="stretch">
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
              <VStack spacing={3}>
              <HStack spacing={3} justify="center">
                  <Icon
                    as={totalValueChange >= 0 ? TrendingUp : TrendingDown}
                    size={20}
                    color={totalValueChange >= 0 ? "green.500" : "red.500"}
                  />
                  <HStack spacing={0} align="baseline">
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
                <HStack spacing={2} justify="center">
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
        </ModalBody>

        <ModalFooter
          px={6}
          py={4}
          bg={useColorModeValue("gray.50", "gray.700")}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button colorScheme="teal" onClick={onClose} w="full">
            Got it
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PortfolioChangeModal;

