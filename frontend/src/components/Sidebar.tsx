import React, { useState } from "react";
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
  Tooltip,
} from "@chakra-ui/react";

import { Home, Bookmark, Menu, PieChart, Target, TrendingUp, Wallet, X, BookText, ChevronLeft, ChevronRight } from "lucide-react";

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

const Sidebar: React.FC<SidebarProps> = ({ handleLogout: _handleLogout }) => {
  const handleLogout = () => {
    localStorage.removeItem("sidebar-collapsed");
    _handleLogout();
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") !== "false"
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { ledgerId, ledgerName } = useLedgerStore();

  const sidebarBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const activeBg = useColorModeValue("brand.100", "rgba(116, 207, 202, 0.18)");
  const activeColor = useColorModeValue("brand.700", "brand.200");
  const activeIconColor = useColorModeValue("brand.600", "brand.300");
  const inactiveColor = useColorModeValue("gray.600", "gray.400");
  const inactiveIconColor = useColorModeValue("gray.400", "gray.500");
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const hoverColor = useColorModeValue("gray.800", "gray.100");
  const cardBg = useColorModeValue("white", "gray.800");
  const brandTitleColor = useColorModeValue("gray.900", "gray.50");
  const brandSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const brandIconColor = useColorModeValue("brand.500", "brand.400");
  const sidebarShadow = useColorModeValue("xl", "4px 0 12px rgba(0,0,0,0.6)");
  const sectionLabelColor = useColorModeValue("gray.400", "gray.500");

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // The ledger section is "expanded" when on any ledger-scoped page (controls sub-item visibility)
  const isLedgerSectionActive =
    location.pathname === "/ledger" ||
    location.pathname === "/net-worth" ||
    location.pathname === "/insights" ||
    location.pathname === "/budget";

  // The ledger parent item is only highlighted when on /ledger itself
  const isLedgerItemActive = location.pathname === "/ledger";

  // Get current page title for mobile header
  const getCurrentPageTitle = () => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname === "/ledger") return ledgerName || "Ledger";
    if (location.pathname === "/net-worth") return "Net Worth";
    if (location.pathname === "/insights") return "Insights";
    if (location.pathname === "/budget") return "Budget";
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

    const linkEl = (
      <ChakraLink
        display="flex"
        alignItems="center"
        justifyContent={isCollapsed ? "center" : "flex-start"}
        gap={isCollapsed ? 0 : 3}
        onClick={onClick || (() => navigate(path))}
        py={2.5}
        px={isCollapsed ? 0 : 3}
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
          boxSize={isCollapsed ? 5 : 4}
          color={isActive ? activeIconColor : inactiveIconColor}
          flexShrink={0}
          transition="color 0.15s ease"
        />
        {!isCollapsed && <Text>{label}</Text>}
      </ChakraLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip label={label} placement="right" hasArrow openDelay={200}>
          {linkEl}
        </Tooltip>
      );
    }
    return linkEl;
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

    const linkEl = (
      <ChakraLink
        display="flex"
        alignItems="center"
        justifyContent={isCollapsed ? "center" : "flex-start"}
        gap={isCollapsed ? 0 : 2.5}
        onClick={onClick || (() => navigate(path))}
        py={2}
        pl={isCollapsed ? 0 : 8}
        pr={isCollapsed ? 0 : 3}
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
          boxSize={isCollapsed ? 5 : 3.5}
          color={isActive ? activeIconColor : inactiveIconColor}
          flexShrink={0}
          transition="color 0.15s ease"
        />
        {!isCollapsed && <Text>{label}</Text>}
      </ChakraLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip label={label} placement="right" hasArrow openDelay={200}>
          {linkEl}
        </Tooltip>
      );
    }
    return linkEl;
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
            {!isCollapsed && (
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
            )}

            {/* Ledger name — parent item, navigates to /ledger */}
            {isCollapsed ? (
              <Tooltip label={ledgerName || "Ledger"} placement="right" hasArrow openDelay={200}>
                <ChakraLink
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onClick={() => go("/ledger")}
                  py={2.5}
                  px={0}
                  borderRadius="lg"
                  bg={isLedgerItemActive ? activeBg : "transparent"}
                  color={isLedgerItemActive ? activeColor : inactiveColor}
                  fontWeight={isLedgerItemActive ? "semibold" : "medium"}
                  fontSize="sm"
                  _hover={{
                    bg: isLedgerItemActive ? activeBg : hoverBg,
                    color: isLedgerItemActive ? activeColor : hoverColor,
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
                    boxSize={5}
                    color={isLedgerItemActive ? activeIconColor : inactiveIconColor}
                    flexShrink={0}
                    transition="color 0.15s ease"
                  />
                </ChakraLink>
              </Tooltip>
            ) : (
              <ChakraLink
                display="flex"
                alignItems="center"
                gap={3}
                onClick={() => go("/ledger")}
                py={2.5}
                px={3}
                borderRadius="lg"
                bg={isLedgerItemActive ? activeBg : "transparent"}
                color={isLedgerItemActive ? activeColor : inactiveColor}
                fontWeight={isLedgerItemActive ? "semibold" : "medium"}
                fontSize="sm"
                _hover={{
                  bg: isLedgerItemActive ? activeBg : hoverBg,
                  color: isLedgerItemActive ? activeColor : hoverColor,
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
                  color={isLedgerItemActive ? activeIconColor : inactiveIconColor}
                  flexShrink={0}
                  transition="color 0.15s ease"
                />
                <Text noOfLines={1} flex={1}>{ledgerName || "Ledger"}</Text>
              </ChakraLink>
            )}

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
            <NavSubItem
              path="/budget"
              label="Budget"
              icon={Target}
              onClick={() => go("/budget")}
            />
          </Box>
        ) : (
          // ── No ledger context — show as global top-level items ──────────
          <>
            <NavItem path="/net-worth" label="Net Worth" icon={TrendingUp} onClick={() => go("/net-worth")} />
            <NavItem path="/insights" label="Insights" icon={PieChart} onClick={() => go("/insights")} />
            <NavItem path="/budget" label="Budget" icon={Target} onClick={() => go("/budget")} />
          </>
        )}

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
        w={isCollapsed ? "64px" : "280px"}
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
        overflowX="hidden"
        flexShrink={0}
        boxShadow={sidebarShadow}
        transition="width 0.2s ease"
      >
        {/* Brand Header */}
        <Box
          px={isCollapsed ? 0 : 4}
          py={5}
          display="flex"
          alignItems="center"
          justifyContent={isCollapsed ? "center" : "flex-start"}
        >
          {isCollapsed ? (
            <Tooltip label="Cashio" placement="right" hasArrow openDelay={200}>
              <Icon as={Wallet} boxSize={6} color={brandIconColor} flexShrink={0} />
            </Tooltip>
          ) : (
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
          )}
        </Box>

        {/* Navigation */}
        <Box flex="1" px={isCollapsed ? 2 : 3} py={4}>
          {renderNavItems()}
        </Box>

        {/* Collapse toggle */}
        <Box
          px={isCollapsed ? 2 : 3}
          py={2}
          display="flex"
          justifyContent={isCollapsed ? "center" : "flex-end"}
        >
          <Tooltip
            label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            placement="right"
            hasArrow
            openDelay={200}
          >
            <Button
              onClick={() => setIsCollapsed((c) => {
                const next = !c;
                localStorage.setItem("sidebar-collapsed", String(next));
                return next;
              })}
              variant="ghost"
              size="sm"
              borderRadius="md"
              color={inactiveColor}
              _hover={{ bg: hoverBg, color: hoverColor }}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon as={isCollapsed ? ChevronRight : ChevronLeft} boxSize={4} />
            </Button>
          </Tooltip>
        </Box>

        {/* User Profile at bottom */}
        <Box px={isCollapsed ? 2 : 3} py={3} borderTop="1px solid" borderColor={borderColor}>
          <UserProfileDisplay
            handleLogout={handleLogout}
            isCollapsed={isCollapsed}
            onCollapsedClick={() => {
              setIsCollapsed(false);
              localStorage.setItem("sidebar-collapsed", "false");
            }}
          />
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
