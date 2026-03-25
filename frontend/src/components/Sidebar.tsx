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
import { motion } from "framer-motion";

import {
  Home,
  Bookmark,
  Menu,
  PieChart,
  Target,
  TrendingUp,
  Wallet,
  X,
  BookText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import UserProfileDisplay from "./shared/UserProfileDisplay";
import useLedgerStore from "@/components/shared/store";

const MotionBox = motion(Box);

interface SidebarProps {
  handleLogout: () => void;
}

// Mobile Header Component for consistent spacing
export const MobileHeader: React.FC<{
  onMenuOpen: () => void;
  title?: string;
}> = ({ onMenuOpen, title = "Dashboard" }) => {
  const headerBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const brandColor = useColorModeValue("brand.500", "brand.400");

  return (
    <Box
      display={{ base: "block", md: "none" }}
      position="sticky"
      top={0}
      zIndex={999}
      bg={headerBg}
      borderBottom="1px solid"
      borderColor={borderColor}
      backdropFilter="blur(12px)"
    >
      <Flex align="center" justify="space-between" px={4} py={3}>
        <Button
          onClick={onMenuOpen}
          variant="ghost"
          size="sm"
          borderRadius="lg"
          color={brandColor}
          _hover={{ bg: useColorModeValue("brand.50", "whiteAlpha.100") }}
          _active={{ bg: useColorModeValue("brand.100", "whiteAlpha.200") }}
        >
          <Icon as={Menu} boxSize={5} />
        </Button>

        <Heading
          size="md"
          color={useColorModeValue("gray.800", "gray.100")}
          fontWeight="bold"
          textAlign="center"
          flex="1"
          mx={4}
          letterSpacing="-0.01em"
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

  // --- Nav Item with left accent bar ---
  const NavItem = ({
    path,
    label,
    icon,
    onClick,
    collapsed,
  }: {
    path: string;
    label: string;
    icon: any;
    onClick?: () => void;
    collapsed?: boolean;
  }) => {
    const isActive = isActivePath(path);
    const _collapsed = collapsed ?? isCollapsed;

    const linkEl = (
      <ChakraLink
        display="flex"
        alignItems="center"
        justifyContent={_collapsed ? "center" : "flex-start"}
        gap={_collapsed ? 0 : 3}
        onClick={onClick || (() => navigate(path))}
        py={2}
        px={_collapsed ? 0 : 3}
        borderRadius="lg"
        bg={isActive ? activeBg : "transparent"}
        color={isActive ? activeColor : inactiveColor}
        fontWeight={isActive ? "600" : "500"}
        fontSize="sm"
        position="relative"
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: isActive ? activeColor : hoverColor,
          textDecoration: "none",
          "& .nav-icon": {
            transform: "scale(1.08)",
          },
        }}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        width="full"
        textDecoration="none"
        _focus={{ boxShadow: "none" }}
        _focusVisible={{ boxShadow: "0 0 0 2px var(--chakra-colors-brand-500)" }}
        role="group"
      >
        {/* Active accent bar */}
        {isActive && !_collapsed && (
          <MotionBox
            layoutId="nav-accent"
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
          as={icon}
          boxSize={_collapsed ? 5 : "18px"}
          color={isActive ? activeIconColor : inactiveIconColor}
          flexShrink={0}
          transition="all 0.2s ease"
          className="nav-icon"
        />
        {!_collapsed && (
          <Text letterSpacing="-0.01em">{label}</Text>
        )}
      </ChakraLink>
    );

    if (_collapsed) {
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
    collapsed,
  }: {
    path: string;
    label: string;
    icon: any;
    onClick?: () => void;
    collapsed?: boolean;
  }) => {
    const isActive = isActivePath(path);
    const _collapsed = collapsed ?? isCollapsed;

    const linkEl = (
      <ChakraLink
        display="flex"
        alignItems="center"
        justifyContent={_collapsed ? "center" : "flex-start"}
        gap={_collapsed ? 0 : 2.5}
        onClick={onClick || (() => navigate(path))}
        py={1.5}
        pl={_collapsed ? 0 : 9}
        pr={_collapsed ? 0 : 3}
        borderRadius="lg"
        bg={isActive ? activeBg : "transparent"}
        color={isActive ? activeColor : inactiveColor}
        fontWeight={isActive ? "600" : "500"}
        fontSize="13px"
        position="relative"
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: isActive ? activeColor : hoverColor,
          textDecoration: "none",
          "& .nav-icon": {
            transform: "scale(1.08)",
          },
        }}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        width="full"
        textDecoration="none"
        _focus={{ boxShadow: "none" }}
        _focusVisible={{ boxShadow: "0 0 0 2px var(--chakra-colors-brand-500)" }}
        role="group"
      >
        {isActive && !_collapsed && (
          <MotionBox
            position="absolute"
            left="-1px"
            top="5px"
            bottom="5px"
            w="3px"
            borderRadius="full"
            bg={accentColor}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon
          as={icon}
          boxSize={_collapsed ? 5 : "15px"}
          color={isActive ? activeIconColor : inactiveIconColor}
          flexShrink={0}
          transition="all 0.2s ease"
          className="nav-icon"
        />
        {!_collapsed && (
          <Text letterSpacing="-0.01em">{label}</Text>
        )}
      </ChakraLink>
    );

    if (_collapsed) {
      return (
        <Tooltip label={label} placement="right" hasArrow openDelay={200}>
          {linkEl}
        </Tooltip>
      );
    }
    return linkEl;
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
        <NavItem path="/" label="Dashboard" icon={Home} onClick={() => go("/")} collapsed={collapsed} />

        {ledgerId ? (
          // ── Ledger context section ──
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

            {/* Ledger name — parent item */}
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
            />
            <NavSubItem
              path="/insights"
              label="Insights"
              icon={PieChart}
              onClick={() => go("/insights")}
              collapsed={collapsed}
            />
            <NavSubItem
              path="/budget"
              label="Budget"
              icon={Target}
              onClick={() => go("/budget")}
              collapsed={collapsed}
            />
          </Box>
        ) : (
          // ── No ledger context — show as global top-level items ──
          <>
            <NavItem path="/net-worth" label="Net Worth" icon={TrendingUp} onClick={() => go("/net-worth")} collapsed={collapsed} />
            <NavItem path="/insights" label="Insights" icon={PieChart} onClick={() => go("/insights")} collapsed={collapsed} />
            <NavItem path="/budget" label="Budget" icon={Target} onClick={() => go("/budget")} collapsed={collapsed} />
          </>
        )}

        <NavItem path="/categories" label="Categories" icon={Bookmark} onClick={() => go("/categories")} collapsed={collapsed} />
      </VStack>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader onMenuOpen={onOpen} title={getCurrentPageTitle()} />

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
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
        <DrawerOverlay
          bg="blackAlpha.500"
          backdropFilter="blur(12px)"
        />
        <DrawerContent
          bg={sidebarBg}
          maxW="80vw"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          borderRight="1px solid"
          borderColor={borderColor}
        >
          <DrawerHeader
            px={5}
            py={4}
            borderBottom="1px solid"
            borderColor={borderColor}
            position="relative"
          >
            <HStack spacing={3} align="center">
              <Box
                p={2}
                borderRadius="xl"
                bg={brandBgLight}
              >
                <Icon as={Wallet} boxSize={5} color={brandIconColor} flexShrink={0} />
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
                <Icon as={X} boxSize={4} />
              </Button>
            </HStack>
          </DrawerHeader>

          <DrawerBody px={0} py={5}>
            <Flex direction="column" justify="space-between" h="full">
              <Box px={5}>
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
                    <Icon as={LogOut} boxSize="18px" flexShrink={0} color={logoutIconColor} />
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
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Sidebar;
