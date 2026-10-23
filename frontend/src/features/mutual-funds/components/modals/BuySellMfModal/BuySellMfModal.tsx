import { FC } from "react";
import { useColorModeValue } from "../../../../../components/ui/color-mode";
import { Button, HStack, Text, Badge, Box, Icon, Dialog, Portal } from "@chakra-ui/react";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";
import { motion } from "framer-motion";
import BuySellForm from "./BuySellForm";
import { useBuySellForm } from "./useBuySellForm";
import type { BuySellMfModalProps } from "./types";

const BuySellMfModal: FC<BuySellMfModalProps> = (props) => {
  const { isOpen, fund } = props;
  const form = useBuySellForm(props);

  const {
    tabIndex,
    setTabIndex,
    totalUnits,
    currentType,
    transactionMutation,
    isAccountOpen,
    isCategoryOpen,
    handleClose,
    handleSubmit,
    isFormValid,
  } = form;

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");
  const tabUnselectedColor = useColorModeValue("gray.600", "gray.200");

  return (
    <Dialog.Root
      open={isOpen}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slide-in-bottom"
      onOpenChange={e => {
        if (!e.open) {
          handleClose();
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
            {/* Gradient accent line */}
            <Box h="3px" bgGradient="to-r" gradientFrom="brand.400" gradientVia="brand.600" gradientTo="teal.300"  />
            {/* Flat header */}
            <Box
              px={{ base: 4, sm: 8 }}
              py={5}
              borderBottom="1px solid"
              borderColor={modalHeaderBorderColor}
            >
              <HStack gap={3} align="flex-start">
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><Coins /></Icon>

                <Box>
                  <HStack gap={3} mb={1} align="center">
                    <Text
                      fontSize="lg"
                      fontWeight="800"
                      letterSpacing="-0.02em"
                      color={modalTitleColor}
                    >
                      {fund ? fund.name : "Mutual Fund Transaction"}
                    </Text>
                    {fund && (
                      <Badge
                        colorPalette="brand"
                        variant="subtle"
                        fontSize="sm"
                        borderRadius="full"
                        px={2}
                        py={0.5}
                      >
                        {fund.amc?.name}
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" color={modalSubtitleColor}>
                    {tabIndex === 0 ? "Buy units" : "Sell units"}
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Dialog.Body
              px={{ base: 4, sm: 8 }}
              py={{ base: 4, sm: 6 }}
              flex="1"
              overflowY="auto"
              overflowX="hidden"
              display="flex"
              flexDirection="column"
              justifyContent={{ base: "space-between", sm: "flex-start" }}
            >
              <Box
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !transactionMutation.isPending) {
                    if (isAccountOpen || isCategoryOpen) return;
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              >
                {/* Sliding pill Buy / Sell toggle */}
                <Box
                  position="relative"
                  display="flex"
                  bg={cardBg}
                  borderRadius="full"
                  border="2px solid"
                  borderColor={inputBorderColor}
                  p="1"
                  overflow="hidden"
                  mb={6}
                >
                  <motion.div
                    animate={{
                      x: tabIndex === 1 ? "100%" : "0%",
                      background: tabIndex === 0 ? "#319795" : "#FC8181",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      width: "calc(50% - 4px)",
                      height: "calc(100% - 8px)",
                      borderRadius: "9999px",
                      zIndex: 0,
                    }}
                  />
                  <Button
                    flex={1}
                    position="relative"
                    zIndex={1}
                    onClick={() => setTabIndex(0)}
                    color={tabIndex === 0 ? "white" : tabUnselectedColor}
                    fontWeight="semibold"
                    fontSize="sm"
                    height="40px"
                    borderRadius="full"
                    transition="color 0.2s"
                    _hover={{}}
                    _active={{}}
                    unstyled
                  >
                    <HStack gap={2} justify="center">
                      <TrendingUp size={16} />
                      <Text>Buy</Text>
                    </HStack>
                  </Button>
                  <Button
                    flex={1}
                    position="relative"
                    zIndex={1}
                    onClick={() => {
                      if (!(fund ? totalUnits <= 0 : false)) setTabIndex(1);
                    }}
                    color={tabIndex === 1 ? "white" : tabUnselectedColor}
                    fontWeight="semibold"
                    fontSize="sm"
                    height="40px"
                    borderRadius="full"
                    transition="color 0.2s"
                    opacity={fund && totalUnits <= 0 ? 0.4 : 1}
                    cursor={
                      fund && totalUnits <= 0 ? "not-allowed" : "pointer"
                    }
                    _hover={{}}
                    _active={{}}
                    unstyled
                  >
                    <HStack gap={2} justify="center">
                      <TrendingDown size={16} />
                      <Text>Sell</Text>
                    </HStack>
                  </Button>
                </Box>

                {tabIndex === 0 ? (
                  <BuySellForm type="buy" form={form} />
                ) : (
                  <BuySellForm type="sell" form={form} />
                )}
              </Box>
            </Dialog.Body>

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
                onClick={() => handleSubmit()}
                colorPalette={currentType === "buy" ? "brand" : "red"}
                mr={3}
                px={8}
                py={3}
                borderRadius="lg"
                fontWeight="bold"
                loading={transactionMutation.isPending}
                loadingText={`Processing ${currentType === "buy" ? "Purchase" : "Sale"}...`}
                disabled={!isFormValid()}
              >
                {currentType === "buy" ? "Buy Units" : "Sell Units"}
              </Button>

              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={handleClose}
                disabled={transactionMutation.isPending}
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

export default BuySellMfModal;
