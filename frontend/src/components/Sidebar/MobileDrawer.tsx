import React from "react";
import { useColorModeValue } from "../ui/color-mode";
import {
  Box,
  Flex,
  Heading,
  Link as ChakraLink,
  Icon,
  Drawer,
  Button,
  Text,
  HStack,
  Portal,
} from "@chakra-ui/react";
import { Wallet, X, LogOut, Search } from "lucide-react";
import UserProfileDisplay from "../shared/UserProfileDisplay";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  handleLogout: () => void;
  onSearchOpen: () => void;
  renderNavItems: (onAfterNavigate?: () => void, forceExpanded?: boolean) => React.ReactNode;
  // Color tokens
  sidebarBg: string;
  borderColor: string;
  brandBgLight: string;
  brandIconColor: string;
  brandTitleColor: string;
  brandSubtitleColor: string;
  inactiveColor: string;
  hoverBg: string;
  logoutColor: string;
  logoutIconColor: string;
  logoutHoverBg: string;
  logoutHoverColor: string;
  cardBg: string;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  handleLogout,
  onSearchOpen,
  renderNavItems,
  sidebarBg,
  borderColor,
  brandBgLight,
  brandIconColor,
  brandTitleColor,
  brandSubtitleColor,
  inactiveColor,
  hoverBg,
  logoutColor,
  logoutIconColor,
  logoutHoverBg,
  logoutHoverColor,
  cardBg,
}) => {
  const searchBg = useColorModeValue("gray.50", "gray.800");
  const searchHoverBg = useColorModeValue("gray.100", "gray.700");
  const searchColor = useColorModeValue("gray.400", "gray.500");

  return (
    <Drawer.Root open={isOpen} placement='start' size='sm' onOpenChange={e => {
      if (!e.open) {
        onClose();
      }
    }}>
      <Portal>

        <Drawer.Backdrop
          bg="blackAlpha.500"
          backdropFilter="blur(12px)"
        />
        <Drawer.Positioner>
          <Drawer.Content
            bg={sidebarBg}
            maxW="80vw"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            borderRight="1px solid"
            borderColor={borderColor}>
            <Drawer.Header
              px={5}
              py={4}
              borderBottom="1px solid"
              borderColor={borderColor}
              position="relative"
            >
              <HStack gap={3} align="center">
                <Box
                  p={2}
                  borderRadius="xl"
                  bg={brandBgLight}
                >
                  <Icon boxSize={5} color={brandIconColor} flexShrink={0} asChild><Wallet /></Icon>
                </Box>
                <Box flex={1}>
                  <Heading
                    as="h1"
                    fontSize="lg"
                    fontWeight="bold"
                    letterSpacing="-0.03em"
                    color={brandTitleColor}
                    lineHeight="1.2"
                  >
                    Cashio
                  </Heading>
                  <Text fontSize="xs" color={brandSubtitleColor} letterSpacing="-0.01em">
                    Finance Manager
                  </Text>
                </Box>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  color={inactiveColor}
                  _hover={{ bg: hoverBg }}
                  borderRadius="lg"
                >
                  <Icon boxSize={4} asChild><X /></Icon>
                </Button>
              </HStack>
            </Drawer.Header>

            <Drawer.Body px={0} py={5}>
              <Flex direction="column" justify="space-between" h="full">
                <Box px={5}>
                  {/* Search Button */}
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={3}
                    w="full"
                    py={2}
                    px={3}
                    mb={3}
                    borderRadius="lg"
                    bg={searchBg}
                    color={searchColor}
                    fontSize="sm"
                    _hover={{ bg: searchHoverBg }}
                    transition="all 0.2s ease"
                    asChild><button
                      onClick={() => {
                        onClose();
                        onSearchOpen();
                      }}>
                      <Icon boxSize={4} flexShrink={0} asChild><Search /></Icon>
                      <Text flex={1} textAlign="left">Search...</Text>
                    </button></Box>

                  {renderNavItems(onClose, true)}
                </Box>

                <Box>
                  {/* Log Out */}
                  <Box px={5} py={1}>
                    <ChakraLink
                      display="flex"
                      alignItems="center"
                      gap={3}
                      onClick={() => {
                        handleLogout();
                        onClose();
                      }}
                      py={2}
                      px={3}
                      borderRadius="lg"
                      color={logoutColor}
                      fontWeight="medium"
                      fontSize="sm"
                      _hover={{
                        bg: logoutHoverBg,
                        color: logoutHoverColor,
                        textDecoration: "none",
                      }}
                      transition="all 0.2s ease"
                      width="full"
                      textDecoration="none"
                      _focus={{ boxShadow: "none" }}
                    >
                      <Icon boxSize="18px" flexShrink={0} color={logoutIconColor} asChild><LogOut /></Icon>
                      <Text>Log Out</Text>
                    </ChakraLink>
                  </Box>

                  {/* User Profile at bottom */}
                  <Box
                    px={5}
                    py={4}
                    borderTop="1px solid"
                    borderColor={borderColor}
                    bg={cardBg}
                  >
                    <UserProfileDisplay handleLogout={handleLogout} />
                  </Box>
                </Box>
              </Flex>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>

      </Portal>
    </Drawer.Root>
  );
};

export default MobileDrawer;
