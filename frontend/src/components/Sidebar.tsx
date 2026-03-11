import React from "react";
import {
  Box,
  Flex,
  VStack,
  Heading,
  Link as ChakraLink,
  Icon,
  useDisclosure,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Text,
  HStack,
} from "@chakra-ui/react";

import { Home, Bookmark, Menu, PieChart, Wallet, X } from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import UserProfileDisplay from "./shared/UserProfileDisplay";

interface SidebarProps {
  handleLogout: () => void;
}

// Mobile Header Component for consistent spacing
export const MobileHeader: React.FC<{
  onMenuOpen: () => void;
  title?: string;
}> = ({ onMenuOpen, title = "Dashboard" }) => {
  const headerBg = useColorModeValue("primaryBg", "primaryBg");
  const borderColor = useColorModeValue("tertiaryBg", "tertiaryBg");
  const gradientBg = useColorModeValue(
    "linear(135deg, brand.500, brand.600)",
    "linear(135deg, brand.600, brand.700)"
  );

  return (
    <Box
      display={{ base: "block", md: "none" }}
      position="sticky"
      top={0}
      zIndex={999}
      bg={headerBg}
      borderBottom="1px solid"
      borderColor={borderColor}
      backdropFilter="blur(10px)"
      boxShadow="lg"
    >
      <Flex align="center" justify="space-between" px={4} py={3}>
        <Button
          onClick={onMenuOpen}
          variant="ghost"
          size="sm"
          borderRadius="md"
          bgGradient={gradientBg}
          color="white"
          _hover={{
            transform: "scale(1.05)",
            boxShadow: "lg",
          }}
          _active={{ transform: "scale(0.95)" }}
          transition="all 0.2s ease"
          boxShadow="md"
        >
          <Icon as={Menu} boxSize={5} />
        </Button>

        <Heading
          size="md"
          color={useColorModeValue("gray.700", "gray.200")}
          fontWeight="semibold"
          textAlign="center"
          flex="1"
          mx={4}
        >
          {title}
        </Heading>

        {/* Invisible spacer for balance */}
        <Box w="40px" />
      </Flex>
    </Box>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ handleLogout }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

   // Modern color scheme
   const sidebarBg = useColorModeValue("bodyBg", "bodyBg");
   const sidebarColor = useColorModeValue("primaryTextColor", "primaryTextColor");
   const borderColor = useColorModeValue("tertiaryBg", "gray.700");
   const activeBg = useColorModeValue("brand.100", "brand.700");
  const activeColor = useColorModeValue("brand.700", "brand.200");
  const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const cardBg = useColorModeValue("bodyBg", "bodyBg");
  const gradientBg = useColorModeValue(
    "linear(135deg, brand.500, brand.600)",
    "linear(135deg, brand.600, brand.700)"
  );

  const menuItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/insights", label: "Insights", icon: PieChart },
    { path: "/categories", label: "Categories", icon: Bookmark },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Get current page title for mobile header
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find((item) => isActivePath(item.path));
    return currentItem?.label || "Dashboard";
  };

  const NavItem = ({
    path,
    label,
    icon,
    onClick,
  }: {
    path: string;
    label: string;
    icon: any;
    onClick?: () => void;
  }) => {
    const isActive = isActivePath(path);

    return (
      <ChakraLink
        display="flex"
        alignItems="center"
        onClick={onClick || (() => navigate(path))}
        py={{ base: 4, md: 3 }}
        px={{ base: 4, md: 4 }}
        borderRadius="md"
        bg={isActive ? activeBg : "transparent"}
        color={isActive ? activeColor : sidebarColor}
        fontWeight={isActive ? "semibold" : "medium"}
        fontSize={{ base: "md", md: "md" }}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          transform: "translateX(4px)",
          boxShadow: isActive ? "lg" : "md",
        }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        position="relative"
        width="full"
        textDecoration="none"
        _focus={{ boxShadow: "outline" }}
        border="1px solid transparent"
        _focusVisible={{
          borderColor: "brand.500",
          boxShadow: "0 0 0 3px rgba(56, 178, 172, 0.1)",
        }}
      >
        {isActive && (
          <Box
            position="absolute"
            left="0"
            top="50%"
            transform="translateY(-50%)"
            width="4px"
            height="24px"
            bg="brand.500"
            borderRadius="full"
            boxShadow="0 0 8px rgba(56, 178, 172, 0.3)"
          />
        )}
        <Flex align="center" gap={{ base: 4, md: 3 }}>
          <Box
            p={2}
            borderRadius="md"
            bg={isActive ? "whiteAlpha.200" : "transparent"}
            transition="all 0.2s ease"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon
              as={icon}
              boxSize={{ base: 5, md: 4 }}
              opacity={isActive ? 1 : 0.7}
            />
          </Box>
          <Text>{label}</Text>
        </Flex>
      </ChakraLink>
    );
  };

  return (
    <>
      {/* Mobile Header - Replaces floating hamburger */}
      <MobileHeader onMenuOpen={onOpen} title={getCurrentPageTitle()} />

      {/* Desktop Sidebar */}
      <Box
        w="280px"
        bg={sidebarBg}
        borderRight="1px solid"
        borderColor={borderColor}
        display={{ base: "none", md: "flex" }}
        flexDirection="column"
        height="100vh"
        position="sticky"
        top={0}
        left={0}
        overflowY="auto"
        flexShrink={0}
        boxShadow="xl"
      >
        {/* Modern Header */}
        <Box bgGradient={gradientBg} color="white" p={6} boxShadow="lg">
          <HStack spacing={3} align="center">
            <Box
              p={3}
              bg="whiteAlpha.200"
              borderRadius="md"
              backdropFilter="blur(20px)"
              border="1px solid whiteAlpha.300"
              boxShadow="xl"
            >
              <Icon as={Wallet} boxSize={6} />
            </Box>
            <Box>
              <Heading
                as="h1"
                size="lg"
                fontWeight="bold"
                letterSpacing="-0.02em"
              >
                Cashio
              </Heading>
              <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
                Financial Management
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Navigation */}
        <Box flex="1" px={4} py={6}>
          <VStack align="stretch" spacing={2}>
            {menuItems.map((item) => (
              <NavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </VStack>
        </Box>

        {/* User Profile at bottom */}
        <Box p={4} borderTop="1px solid" borderColor={borderColor} bg={cardBg}>
          <UserProfileDisplay handleLogout={handleLogout} />
        </Box>
      </Box>

      {/* Enhanced Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
        <DrawerOverlay
          bg="blackAlpha.600"
          backdropFilter="blur(8px)"
          transition="all 0.3s ease"
        />
        <DrawerContent
          bg={sidebarBg}
          maxW="85vw"
          boxShadow="2xl"
          border="1px solid"
          borderColor={borderColor}
        >
          <DrawerHeader
            bgGradient={gradientBg}
            color="white"
            pb={6}
            position="relative"
            boxShadow="lg"
          >
            <Button
              position="absolute"
              top={4}
              right={4}
              onClick={onClose}
              variant="ghost"
              size="sm"
              color="white"
              _hover={{
                bg: "whiteAlpha.200",
                transform: "scale(1.05)",
              }}
              _active={{ transform: "scale(0.95)" }}
              borderRadius="md"
              transition="all 0.2s ease"
            >
              <Icon as={X} boxSize={4} />
            </Button>

            <HStack spacing={3} align="center" mt={2}>
              <Box
                p={3}
                bg="whiteAlpha.200"
                borderRadius="md"
                backdropFilter="blur(20px)"
                border="1px solid whiteAlpha.300"
                boxShadow="xl"
              >
                <Icon as={Wallet} boxSize={6} />
              </Box>
              <Box>
                <Heading
                  as="h1"
                  size="lg"
                  fontWeight="bold"
                  letterSpacing="-0.02em"
                >
                  Cashio
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
                  Financial Management
                </Text>
              </Box>
            </HStack>
          </DrawerHeader>

          <DrawerBody px={0} py={6}>
            <Flex direction="column" justify="space-between" h="full">
              <Box px={6}>
                <VStack align="stretch" spacing={2}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.500"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={3}
                    px={4}
                  >
                    Navigation
                  </Text>
                  {menuItems.map((item) => (
                    <NavItem
                      key={item.path}
                      path={item.path}
                      label={item.label}
                      icon={item.icon}
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                    />
                  ))}
                </VStack>
              </Box>

              {/* User Profile at bottom */}
              <Box
                px={6}
                py={4}
                borderTop="1px solid"
                borderColor={borderColor}
                bg={cardBg}
              >
                <UserProfileDisplay handleLogout={handleLogout} />
              </Box>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Sidebar;
