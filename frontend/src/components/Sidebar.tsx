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
  const mobileButtonColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Box
      display={{ base: "block", md: "none" }}
      position="sticky"
      top={0}
      zIndex={999}
      bg={headerBg}
      borderBottom="1px solid"
      borderColor={borderColor}
    >
      <Flex align="center" justify="space-between" px={4} py={3}>
        <Button
          onClick={onMenuOpen}
          variant="ghost"
          size="sm"
          borderRadius="md"
          color={mobileButtonColor}
          _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
          _active={{ bg: useColorModeValue("gray.200", "gray.600") }}
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

   const sidebarBg = useColorModeValue("bodyBg", "bodyBg");
   const borderColor = useColorModeValue("tertiaryBg", "gray.700");
   const activeBg = useColorModeValue("brand.50", "whiteAlpha.150");
   const activeColor = useColorModeValue("brand.700", "brand.200");
   const activeIconColor = useColorModeValue("brand.600", "brand.300");
   const inactiveColor = useColorModeValue("gray.600", "gray.400");
   const inactiveIconColor = useColorModeValue("gray.400", "gray.500");
   const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
   const hoverColor = useColorModeValue("gray.800", "gray.100");
   const cardBg = useColorModeValue("bodyBg", "bodyBg");
   const brandTitleColor = useColorModeValue("gray.900", "gray.50");
   const brandSubtitleColor = useColorModeValue("gray.500", "gray.400");
   const brandIconColor = useColorModeValue("brand.500", "brand.400");
   const sidebarShadow = useColorModeValue("xl", "4px 0 12px rgba(0,0,0,0.6)");

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
        gap={3}
        onClick={onClick || (() => navigate(path))}
        py={2.5}
        px={3}
        borderRadius="lg"
        bg={isActive ? activeBg : "transparent"}
        color={isActive ? activeColor : inactiveColor}
        fontWeight={isActive ? "semibold" : "medium"}
        fontSize="sm"
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: isActive ? activeColor : hoverColor,
          textDecoration: "none",
        }}
        transition="background 0.15s ease, color 0.15s ease"
        width="full"
        textDecoration="none"
        _focus={{ boxShadow: "none" }}
        _focusVisible={{ boxShadow: "0 0 0 2px var(--chakra-colors-brand-500)" }}
      >
        <Icon
          as={icon}
          boxSize={4}
          color={isActive ? activeIconColor : inactiveIconColor}
          flexShrink={0}
          transition="color 0.15s ease"
        />
        <Text>{label}</Text>
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
        boxShadow={sidebarShadow}
      >
        {/* Brand Header */}
        <Box px={4} py={5}>
          <HStack spacing={3} align="flex-start">
            <Icon as={Wallet} boxSize={5} mt="2px" color={brandIconColor} flexShrink={0} />
            <Box>
              <Heading
                as="h1"
                fontSize="md"
                fontWeight="bold"
                letterSpacing="-0.02em"
                color={brandTitleColor}
              >
                Cashio
              </Heading>
              <Text fontSize="xs" color={brandSubtitleColor}>
                Financial Management
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Navigation */}
        <Box flex="1" px={3} py={4}>
          <VStack align="stretch" spacing={1}>
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
        <Box px={3} py={3} borderTop="1px solid" borderColor={borderColor}>
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
            px={4}
            py={4}
            borderBottom="1px solid"
            borderColor={borderColor}
            position="relative"
          >
            <HStack spacing={3} align="flex-start">
              <Icon as={Wallet} boxSize={5} mt="2px" color={brandIconColor} flexShrink={0} />
              <Box flex={1}>
                <Heading
                  as="h1"
                  fontSize="md"
                  fontWeight="bold"
                  letterSpacing="-0.02em"
                  color={brandTitleColor}
                >
                  Cashio
                </Heading>
                <Text fontSize="xs" color={brandSubtitleColor}>
                  Financial Management
                </Text>
              </Box>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                color={inactiveColor}
                _hover={{ bg: hoverBg }}
                borderRadius="md"
              >
                <Icon as={X} boxSize={4} />
              </Button>
            </HStack>
          </DrawerHeader>

          <DrawerBody px={0} py={6}>
            <Flex direction="column" justify="space-between" h="full">
              <Box px={6}>
                <VStack align="stretch" spacing={1}>
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
