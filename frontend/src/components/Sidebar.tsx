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

import { Home, Bookmark, Menu, PieChart, TrendingUp, Wallet, X, BookText } from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import UserProfileDisplay from "./shared/UserProfileDisplay";
import useLedgerStore from "@/components/shared/store";

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
  const { ledgerId, ledgerName } = useLedgerStore();

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
  const sectionLabelColor = useColorModeValue("gray.400", "gray.500");
  const dividerColor = useColorModeValue("gray.100", "gray.700");

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // The ledger section is "active" when on any ledger-scoped page
  const isLedgerSectionActive =
    location.pathname === "/ledger" ||
    location.pathname === "/net-worth" ||
    location.pathname === "/insights";

  // Get current page title for mobile header
  const getCurrentPageTitle = () => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname === "/ledger") return ledgerName || "Ledger";
    if (location.pathname === "/net-worth") return "Net Worth";
    if (location.pathname === "/insights") return "Insights";
    if (location.pathname === "/categories") return "Categories";
    if (location.pathname === "/profile") return "Profile";
    if (location.pathname.startsWith("/account/")) return "Account";
    return "Dashboard";
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

  const NavSubItem = ({
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
        gap={2.5}
        onClick={onClick || (() => navigate(path))}
        py={2}
        pl={8}
        pr={3}
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
          boxSize={3.5}
          color={isActive ? activeIconColor : inactiveIconColor}
          flexShrink={0}
          transition="color 0.15s ease"
        />
        <Text>{label}</Text>
      </ChakraLink>
    );
  };

  // Renders the full nav tree; onAfterNavigate is called after any item click (used by mobile to close drawer)
  const renderNavItems = (onAfterNavigate?: () => void) => {
    const go = (path: string) => {
      navigate(path);
      onAfterNavigate?.();
    };

    return (
      <VStack align="stretch" spacing={1}>
        <NavItem path="/" label="Dashboard" icon={Home} onClick={() => go("/")} />

        {ledgerId ? (
          // ── Ledger context section ──────────────────────────────────────
          <Box mt={3}>
            <Text
              fontSize="2xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={sectionLabelColor}
              px={3}
              mb={1}
            >
              Current Ledger
            </Text>

            {/* Ledger name — parent item, navigates to /ledger */}
            <ChakraLink
              display="flex"
              alignItems="center"
              gap={3}
              onClick={() => go("/ledger")}
              py={2.5}
              px={3}
              borderRadius="lg"
              bg={isLedgerSectionActive ? activeBg : "transparent"}
              color={isLedgerSectionActive ? activeColor : inactiveColor}
              fontWeight={isLedgerSectionActive ? "semibold" : "medium"}
              fontSize="sm"
              _hover={{
                bg: isLedgerSectionActive ? activeBg : hoverBg,
                color: isLedgerSectionActive ? activeColor : hoverColor,
                textDecoration: "none",
              }}
              transition="background 0.15s ease, color 0.15s ease"
              width="full"
              textDecoration="none"
              _focus={{ boxShadow: "none" }}
              _focusVisible={{ boxShadow: "0 0 0 2px var(--chakra-colors-brand-500)" }}
            >
              <Icon
                as={BookText}
                boxSize={4}
                color={isLedgerSectionActive ? activeIconColor : inactiveIconColor}
                flexShrink={0}
                transition="color 0.15s ease"
              />
              <Text noOfLines={1} flex={1}>{ledgerName || "Ledger"}</Text>
            </ChakraLink>

            {/* Sub-items */}
            <NavSubItem
              path="/net-worth"
              label="Net Worth"
              icon={TrendingUp}
              onClick={() => go("/net-worth")}
            />
            <NavSubItem
              path="/insights"
              label="Insights"
              icon={PieChart}
              onClick={() => go("/insights")}
            />
          </Box>
        ) : (
          // ── No ledger context — show as global top-level items ──────────
          <>
            <NavItem path="/net-worth" label="Net Worth" icon={TrendingUp} onClick={() => go("/net-worth")} />
            <NavItem path="/insights" label="Insights" icon={PieChart} onClick={() => go("/insights")} />
          </>
        )}

        {/* Divider before global utilities */}
        <Box
          mt={ledgerId ? 3 : 2}
          mb={1}
          borderTop="1px solid"
          borderColor={dividerColor}
        />

        <NavItem path="/categories" label="Categories" icon={Bookmark} onClick={() => go("/categories")} />
      </VStack>
    );
  };

  return (
    <>
      {/* Mobile Header */}
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
            <Icon as={Wallet} boxSize={6} mt="3px" color={brandIconColor} flexShrink={0} />
            <Box>
              <Heading
                as="h1"
                fontSize="xl"
                fontWeight="bold"
                letterSpacing="-0.02em"
                color={brandTitleColor}
              >
                Cashio
              </Heading>
              <Text fontSize="sm" color={brandSubtitleColor}>
                Financial Management
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Navigation */}
        <Box flex="1" px={3} py={4}>
          {renderNavItems()}
        </Box>

        {/* User Profile at bottom */}
        <Box px={3} py={3} borderTop="1px solid" borderColor={borderColor}>
          <UserProfileDisplay handleLogout={handleLogout} />
        </Box>
      </Box>

      {/* Mobile Drawer */}
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
              <Icon as={Wallet} boxSize={6} mt="3px" color={brandIconColor} flexShrink={0} />
              <Box flex={1}>
                <Heading
                  as="h1"
                  fontSize="xl"
                  fontWeight="bold"
                  letterSpacing="-0.02em"
                  color={brandTitleColor}
                >
                  Cashio
                </Heading>
                <Text fontSize="sm" color={brandSubtitleColor}>
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
                {renderNavItems(onClose)}
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
