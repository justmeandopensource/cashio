import React from "react";
import {
  Link as ChakraLink,
  Icon,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Box } from "@chakra-ui/react";

const MotionBox = motion.create(Box);

export interface NavItemColorTokens {
  activeBg: string;
  activeColor: string;
  activeIconColor: string;
  accentColor: string;
  inactiveColor: string;
  inactiveIconColor: string;
  hoverBg: string;
  hoverColor: string;
}

interface NavItemProps {
  path: string;
  label: string;
  icon: any;
  onClick?: () => void;
  collapsed?: boolean;
  isActive: boolean;
  colors: NavItemColorTokens;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  icon,
  onClick,
  collapsed,
  isActive,
  colors,
}) => {
  const {
    activeBg,
    activeColor,
    activeIconColor,
    accentColor,
    inactiveColor,
    inactiveIconColor,
    hoverBg,
    hoverColor,
  } = colors;

  const linkEl = (
    <ChakraLink
      display="flex"
      alignItems="center"
      justifyContent={collapsed ? "center" : "flex-start"}
      gap={collapsed ? 0 : 3}
      onClick={onClick}
      py={2}
      px={collapsed ? 0 : 3}
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
      {isActive && !collapsed && (
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
        boxSize={collapsed ? 5 : "18px"}
        color={isActive ? activeIconColor : inactiveIconColor}
        flexShrink={0}
        transition="all 0.2s ease"
        className="nav-icon"
      />
      {!collapsed && (
        <Text letterSpacing="-0.01em">{label}</Text>
      )}
    </ChakraLink>
  );

  if (collapsed) {
    return (
      <Tooltip label={label} placement="right" hasArrow openDelay={200}>
        {linkEl}
      </Tooltip>
    );
  }
  return linkEl;
};

export const NavSubItem: React.FC<NavItemProps> = ({
  label,
  icon,
  onClick,
  collapsed,
  isActive,
  colors,
}) => {
  const {
    activeBg,
    activeColor,
    activeIconColor,
    accentColor,
    inactiveColor,
    inactiveIconColor,
    hoverBg,
    hoverColor,
  } = colors;

  const linkEl = (
    <ChakraLink
      display="flex"
      alignItems="center"
      justifyContent={collapsed ? "center" : "flex-start"}
      gap={collapsed ? 0 : 2.5}
      onClick={onClick}
      py={1.5}
      pl={collapsed ? 0 : 9}
      pr={collapsed ? 0 : 3}
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
      {isActive && !collapsed && (
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
        boxSize={collapsed ? 5 : "15px"}
        color={isActive ? activeIconColor : inactiveIconColor}
        flexShrink={0}
        transition="all 0.2s ease"
        className="nav-icon"
      />
      {!collapsed && (
        <Text letterSpacing="-0.01em">{label}</Text>
      )}
    </ChakraLink>
  );

  if (collapsed) {
    return (
      <Tooltip label={label} placement="right" hasArrow openDelay={200}>
        {linkEl}
      </Tooltip>
    );
  }
  return linkEl;
};
