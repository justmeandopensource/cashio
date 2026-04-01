import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  VStack,
  Heading,
  Link as ChakraLink,
  Icon,
  useDisclosure,
  useColorModeValue,
  Button,
  Text,
  HStack,
  Tooltip,
  Kbd,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

import {
  Home,
  Bookmark,
  PieChart,
  Target,
  TrendingUp,
  Wallet,
  BookText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import UserProfileDisplay from "../shared/UserProfileDisplay";
import useLedgerStore from "@/components/shared/store";
import { MobileHeader } from "./MobileHeader";
import MobileDrawer from "./MobileDrawer";
import { NavItem, NavSubItem, type NavItemColorTokens } from "./SidebarNavItem";
import GlobalSearch from "../shared/GlobalSearch";

const MotionBox = motion(Box);

interface SidebarProps {
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ handleLogout: _handleLogout }) => {
  const handleLogout = () => {
    localStorage.removeItem("sidebar-collapsed");
    _handleLogout();
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSearchOpen, onOpen: _onSearchOpen, onClose: _onSearchClose } = useDisclosure();
  const [isSearchTooltipDisabled, setIsSearchTooltipDisabled] = useState(false);
  const onSearchOpen = useCallback(() => {
    (document.activeElement as HTMLElement)?.blur();
    setIsSearchTooltipDisabled(true);
    _onSearchOpen();
  }, [_onSearchOpen]);
  const onSearchClose = useCallback(() => {
    _onSearchClose();
    // Keep tooltip suppressed briefly so hover doesn't re-trigger it
    setTimeout(() => setIsSearchTooltipDisabled(false), 300);
  }, [_onSearchClose]);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") !== "false"
  );
  const navigate = useNavigate();
  const location = useLocation();
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const ledgerName = useLedgerStore((s) => s.ledgerName);

  // -- Color tokens --
  const sidebarBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const activeBg = useColorModeValue("brand.50", "rgba(53, 169, 163, 0.10)");
  const activeColor = useColorModeValue("brand.700", "brand.200");
  const activeIconColor = useColorModeValue("brand.500", "brand.300");
  const accentColor = useColorModeValue("brand.500", "brand.400");
  const inactiveColor = useColorModeValue("gray.500", "gray.400");
  const inactiveIconColor = useColorModeValue("gray.400", "gray.500");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const hoverColor = useColorModeValue("gray.700", "gray.200");
  const brandTitleColor = useColorModeValue("gray.900", "gray.50");
  const brandSubtitleColor = useColorModeValue("gray.400", "gray.500");
  const brandIconColor = useColorModeValue("brand.500", "brand.400");
  const sectionLabelColor = useColorModeValue("gray.400", "gray.600");
  const logoutColor = useColorModeValue("gray.500", "gray.500");
  const logoutIconColor = useColorModeValue("gray.400", "gray.600");
  const logoutHoverBg = useColorModeValue("red.50", "rgba(254,178,178,0.06)");
  const logoutHoverColor = useColorModeValue("red.600", "red.300");
  const cardBg = useColorModeValue("white", "gray.900");
  const collapseButtonBg = useColorModeValue("gray.50", "gray.800");
  const collapseButtonHoverBg = useColorModeValue("gray.100", "gray.700");
  const brandBgLight = useColorModeValue("brand.50", "rgba(53, 169, 163, 0.12)");
  const searchBg = useColorModeValue("gray.50", "gray.800");
  const searchHoverBg = useColorModeValue("gray.100", "gray.700");
  const searchColor = useColorModeValue("gray.400", "gray.500");
  const searchKbdBg = useColorModeValue("gray.100", "gray.700");

  // Global keyboard shortcut: Ctrl/Cmd + K to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearchOpen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSearchOpen]);

  const navColors: NavItemColorTokens = useMemo(() => ({
    activeBg,
    activeColor,
    activeIconColor,
    accentColor,
    inactiveColor,
    inactiveIconColor,
    hoverBg,
    hoverColor,
  }), [activeBg, activeColor, activeIconColor, accentColor, inactiveColor, inactiveIconColor, hoverBg, hoverColor]);

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isLedgerItemActive = location.pathname === "/ledger";

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

  // Renders the full nav tree
  const renderNavItems = (onAfterNavigate?: () => void, forceExpanded = false) => {
    const go = (path: string) => {
      navigate(path);
      onAfterNavigate?.();
    };
    const collapsed = forceExpanded ? false : isCollapsed;

    return (
      <VStack align="stretch" spacing={0.5}>
        <NavItem path="/" label="Dashboard" icon={Home} onClick={() => go("/")} collapsed={collapsed} isActive={isActivePath("/")} colors={navColors} />

        {ledgerId ? (
          // -- Ledger context section --
          <Box mt={4}>
            {!collapsed && (
              <Text
                fontSize="10px"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="0.08em"
                color={sectionLabelColor}
                px={3}
                mb={1.5}
              >
                Current Ledger
              </Text>
            )}

            {/* Ledger name - parent item */}
            {collapsed ? (
              <Tooltip label={ledgerName || "Ledger"} placement="right" hasArrow openDelay={200}>
                <ChakraLink
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onClick={() => go("/ledger")}
                  py={2}
                  px={0}
                  borderRadius="lg"
                  bg={isLedgerItemActive ? activeBg : "transparent"}
                  color={isLedgerItemActive ? activeColor : inactiveColor}
                  fontWeight={isLedgerItemActive ? "600" : "500"}
                  fontSize="sm"
                  _hover={{
                    bg: isLedgerItemActive ? activeBg : hoverBg,
                    color: isLedgerItemActive ? activeColor : hoverColor,
                    textDecoration: "none",
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
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
                    transition="all 0.2s ease"
                  />
                </ChakraLink>
              </Tooltip>
            ) : (
              <ChakraLink
                display="flex"
                alignItems="center"
                gap={3}
                onClick={() => go("/ledger")}
                py={2}
                px={3}
                borderRadius="lg"
                bg={isLedgerItemActive ? activeBg : "transparent"}
                color={isLedgerItemActive ? activeColor : inactiveColor}
                fontWeight={isLedgerItemActive ? "600" : "500"}
                fontSize="sm"
                position="relative"
                _hover={{
                  bg: isLedgerItemActive ? activeBg : hoverBg,
                  color: isLedgerItemActive ? activeColor : hoverColor,
                  textDecoration: "none",
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                width="full"
                textDecoration="none"
                _focus={{ boxShadow: "none" }}
                _focusVisible={{ boxShadow: "0 0 0 2px var(--chakra-colors-brand-500)" }}
              >
                {isLedgerItemActive && (
                  <MotionBox
                    position="absolute"
                    left="-1px"
                    top="6px"
                    bottom="6px"
                    w="3px"
                    borderRadius="full"
                    bg={accentColor}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  as={BookText}
                  boxSize="18px"
                  color={isLedgerItemActive ? activeIconColor : inactiveIconColor}
                  flexShrink={0}
                  transition="all 0.2s ease"
                />
                <Text noOfLines={1} flex={1} letterSpacing="-0.01em">
                  {ledgerName || "Ledger"}
                </Text>
              </ChakraLink>
            )}

            {/* Sub-items */}
            <NavSubItem
              path="/net-worth"
              label="Net Worth"
              icon={TrendingUp}
              onClick={() => go("/net-worth")}
              collapsed={collapsed}
              isActive={isActivePath("/net-worth")}
              colors={navColors}
            />
            <NavSubItem
              path="/insights"
              label="Insights"
              icon={PieChart}
              onClick={() => go("/insights")}
              collapsed={collapsed}
              isActive={isActivePath("/insights")}
              colors={navColors}
            />
            <NavSubItem
              path="/budget"
              label="Budget"
              icon={Target}
              onClick={() => go("/budget")}
              collapsed={collapsed}
              isActive={isActivePath("/budget")}
              colors={navColors}
            />
          </Box>
        ) : (
          // -- No ledger context - show as global top-level items --
          <>
            <NavItem path="/net-worth" label="Net Worth" icon={TrendingUp} onClick={() => go("/net-worth")} collapsed={collapsed} isActive={isActivePath("/net-worth")} colors={navColors} />
            <NavItem path="/insights" label="Insights" icon={PieChart} onClick={() => go("/insights")} collapsed={collapsed} isActive={isActivePath("/insights")} colors={navColors} />
            <NavItem path="/budget" label="Budget" icon={Target} onClick={() => go("/budget")} collapsed={collapsed} isActive={isActivePath("/budget")} colors={navColors} />
          </>
        )}

        <NavItem path="/categories" label="Categories" icon={Bookmark} onClick={() => go("/categories")} collapsed={collapsed} isActive={isActivePath("/categories")} colors={navColors} />
      </VStack>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader onMenuOpen={onOpen} onSearchOpen={onSearchOpen} title={getCurrentPageTitle()} />

      {/* Desktop Sidebar */}
      <MotionBox
        animate={{ width: isCollapsed ? 64 : 260 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
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
        sx={{
          "&::-webkit-scrollbar": {
            width: "0px",
          },
        }}
      >
        {/* Brand Header */}
        <Box
          px={isCollapsed ? 0 : 5}
          pt={5}
          pb={4}
          display="flex"
          alignItems="center"
          justifyContent={isCollapsed ? "center" : "flex-start"}
        >
          {isCollapsed ? (
            <Tooltip label="Cashio" placement="right" hasArrow openDelay={200}>
              <Box position="relative">
                <Icon as={Wallet} boxSize={6} color={brandIconColor} flexShrink={0} />
              </Box>
            </Tooltip>
          ) : (
            <HStack spacing={3} align="center">
              <Box
                p={2}
                borderRadius="xl"
                bg={brandBgLight}
              >
                <Icon as={Wallet} boxSize={5} color={brandIconColor} flexShrink={0} />
              </Box>
              <Box>
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
            </HStack>
          )}
        </Box>

        {/* Divider */}
        <Box mx={isCollapsed ? 2 : 4} h="1px" bg={borderColor} />

        {/* Search Button */}
        <Box px={isCollapsed ? 2 : 3} pt={3} pb={1}>
          {isCollapsed ? (
            <Tooltip label="Search (⌘K)" placement="right" hasArrow openDelay={200} isDisabled={isSearchTooltipDisabled}>
              <Box
                as="button"
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="full"
                py={2}
                borderRadius="lg"
                bg={searchBg}
                color={searchColor}
                _hover={{ bg: searchHoverBg }}
                transition="all 0.2s ease"
                onClick={onSearchOpen}
              >
                <Icon as={Search} boxSize={4} />
              </Box>
            </Tooltip>
          ) : (
            <Box
              as="button"
              display="flex"
              alignItems="center"
              gap={3}
              w="full"
              py={2}
              px={3}
              borderRadius="lg"
              bg={searchBg}
              color={searchColor}
              fontSize="sm"
              _hover={{ bg: searchHoverBg }}
              transition="all 0.2s ease"
              onClick={onSearchOpen}
            >
              <Icon as={Search} boxSize={4} flexShrink={0} />
              <Text flex={1} textAlign="left">Search...</Text>
              <Kbd
                fontSize="2xs"
                bg={searchKbdBg}
                borderColor={borderColor}
                px={1.5}
              >
                ⌘K
              </Kbd>
            </Box>
          )}
        </Box>

        {/* Navigation */}
        <Box flex="1" px={isCollapsed ? 2 : 3} py={4}>
          {renderNavItems()}
        </Box>

        {/* Bottom section */}
        <VStack spacing={0} align="stretch">
          {/* Collapse toggle */}
          <Box
            px={isCollapsed ? 2 : 3}
            py={1.5}
            display="flex"
            justifyContent={isCollapsed ? "center" : "flex-end"}
          >
            <Tooltip
              label={isCollapsed ? "Expand" : "Collapse"}
              placement="right"
              hasArrow
              openDelay={200}
            >
              <Button
                onClick={() =>
                  setIsCollapsed((c) => {
                    const next = !c;
                    localStorage.setItem("sidebar-collapsed", String(next));
                    return next;
                  })
                }
                variant="ghost"
                size="xs"
                h="28px"
                w={isCollapsed ? "28px" : "28px"}
                borderRadius="lg"
                bg={collapseButtonBg}
                color={inactiveColor}
                _hover={{ bg: collapseButtonHoverBg, color: hoverColor }}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Icon as={isCollapsed ? ChevronRight : ChevronLeft} boxSize={3.5} />
              </Button>
            </Tooltip>
          </Box>

          {/* Log Out */}
          <Box px={isCollapsed ? 2 : 3} py={1}>
            {isCollapsed ? (
              <Tooltip label="Log Out" placement="right" hasArrow openDelay={200}>
                <ChakraLink
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onClick={handleLogout}
                  py={2}
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
                  <Icon as={LogOut} boxSize={5} flexShrink={0} color={logoutIconColor} />
                </ChakraLink>
              </Tooltip>
            ) : (
              <ChakraLink
                display="flex"
                alignItems="center"
                gap={3}
                onClick={handleLogout}
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
                <Icon as={LogOut} boxSize="18px" flexShrink={0} color={logoutIconColor} />
                <Text>Log Out</Text>
              </ChakraLink>
            )}
          </Box>

          {/* User Profile at bottom */}
          <Box
            px={isCollapsed ? 2 : 3}
            py={3}
            borderTop="1px solid"
            borderColor={borderColor}
          >
            <UserProfileDisplay
              handleLogout={handleLogout}
              isCollapsed={isCollapsed}
              onCollapsedClick={() => {
                setIsCollapsed(false);
                localStorage.setItem("sidebar-collapsed", "false");
              }}
            />
          </Box>
        </VStack>
      </MotionBox>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isOpen}
        onClose={onClose}
        handleLogout={handleLogout}
        onSearchOpen={onSearchOpen}
        renderNavItems={renderNavItems}
        sidebarBg={sidebarBg}
        borderColor={borderColor}
        brandBgLight={brandBgLight}
        brandIconColor={brandIconColor}
        brandTitleColor={brandTitleColor}
        brandSubtitleColor={brandSubtitleColor}
        inactiveColor={inactiveColor}
        hoverBg={hoverBg}
        logoutColor={logoutColor}
        logoutIconColor={logoutIconColor}
        logoutHoverBg={logoutHoverBg}
        logoutHoverColor={logoutHoverColor}
        cardBg={cardBg}
      />

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={onSearchClose} />
    </>
  );
};

export default Sidebar;
