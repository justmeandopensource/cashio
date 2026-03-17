import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Text,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  VStack,
  Link as ChakraLink,
  HStack,
  Divider,
  useColorMode,
  Icon,
  Button,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronsUpDown, Sun, Moon, Monitor } from "lucide-react";
import { VERSION } from "../../version";

interface UserProfile {
  full_name: string;
  email: string;
}

interface UserProfileDisplayProps {
  handleLogout: () => void;
  isCollapsed?: boolean;
  onCollapsedClick?: () => void;
}

const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get("/user/me");
  return response.data;
};

const THEME_PREF_KEY = "cashio-theme-preference";

const getStoredThemePref = (): "light" | "dark" | "system" => {
  const stored = localStorage.getItem(THEME_PREF_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
};

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({
  handleLogout,
  isCollapsed = false,
  onCollapsedClick,
}) => {
  const navigate = useNavigate();
  const { setColorMode } = useColorMode();
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">(getStoredThemePref);
  const {
    data: userProfile,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const popoverBg = useColorModeValue("white", "gray.800");
  const userHeaderBg = useColorModeValue("gray.50", "gray.750");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const avatarBg = useColorModeValue("brand.500", "brand.600");
  const errorBorderColor = useColorModeValue("red.200", "red.700");
  const errorTextColor = useColorModeValue("red.600", "red.300");
  const themeSegmentBg = useColorModeValue("gray.100", "gray.700");
  const themeActiveBg = useColorModeValue("white", "gray.600");
  const themeActiveColor = useColorModeValue("brand.600", "brand.300");
  const themeInactiveColor = useColorModeValue("gray.500", "gray.400");
  const signOutColor = useColorModeValue("red.600", "red.400");
  const signOutHoverBg = useColorModeValue("red.50", "rgba(254,178,178,0.08)");
  const triggerHoverBg = useColorModeValue("gray.100", "gray.700");
  const triggerNameColor = useColorModeValue("gray.700", "gray.200");
  const triggerEmailColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    const measureTriggerWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };
    measureTriggerWidth();
    window.addEventListener("resize", measureTriggerWidth);
    return () => window.removeEventListener("resize", measureTriggerWidth);
  }, [userProfile]);

  useEffect(() => {
    if (selectedTheme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e: MediaQueryList | MediaQueryListEvent) => {
      setColorMode(e.matches ? "dark" : "light");
    };
    apply(mediaQuery);
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, [selectedTheme, setColorMode]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const themeOptions = [
    { key: "light" as const, icon: Sun, label: "Light" },
    { key: "dark" as const, icon: Moon, label: "Dark" },
    { key: "system" as const, icon: Monitor, label: "System" },
  ];

  if (isLoading) {
    return (
      <Box px={2} py={2}>
        {isCollapsed ? (
          <Box width="36px" height="36px" borderRadius="full" bg={themeSegmentBg} mx="auto" />
        ) : (
          <HStack spacing={3}>
            <Box width="36px" height="36px" borderRadius="full" bg={themeSegmentBg} flexShrink={0} />
            <Box flex="1">
              <Box height="13px" bg={themeSegmentBg} borderRadius="md" mb={1.5} />
              <Box height="11px" bg={themeSegmentBg} borderRadius="md" width="65%" />
            </Box>
          </HStack>
        )}
      </Box>
    );
  }

  if (isError || !userProfile) {
    return (
      <Box
        px={2}
        py={2}
        borderRadius="md"
        border="1px solid"
        borderColor={errorBorderColor}
        color={errorTextColor}
        textAlign="center"
      >
        <Text fontSize="sm">Error loading profile</Text>
      </Box>
    );
  }

  return (
    <Popover
      placement="top"
      isLazy
      isOpen={isPopoverOpen}
      onClose={() => setIsPopoverOpen(false)}
    >
      <PopoverTrigger>
        <Button
          ref={triggerRef}
          variant="ghost"
          px={2}
          py={2}
          height="auto"
          borderRadius="lg"
          bg="transparent"
          _hover={{ bg: triggerHoverBg }}
          _active={{ bg: triggerHoverBg }}
          _focus={{ outline: "none", boxShadow: "none" }}
          transition="background 0.15s ease"
          width="full"
          justifyContent={isCollapsed ? "center" : "flex-start"}
          sx={{ "&:focus": { outline: "none" } }}
          onClick={() => {
            if (isCollapsed) {
              onCollapsedClick?.();
              setIsPopoverOpen(true);
            } else {
              setIsPopoverOpen((o) => !o);
            }
          }}
        >
          {isCollapsed ? (
            <Tooltip label={userProfile.full_name} placement="right" hasArrow openDelay={200}>
              <Avatar
                size="sm"
                name={userProfile.full_name}
                src=""
                getInitials={getInitials}
                bg={avatarBg}
                borderRadius="full"
                color="white"
                fontWeight="bold"
                fontSize="xs"
                flexShrink={0}
              />
            </Tooltip>
          ) : (
            <HStack spacing={2.5} width="full">
              <Avatar
                size="sm"
                name={userProfile.full_name}
                src=""
                getInitials={getInitials}
                bg={avatarBg}
                borderRadius="full"
                color="white"
                fontWeight="bold"
                fontSize="xs"
                flexShrink={0}
              />
              <Box flex="1" textAlign="left" minWidth="0">
                <Text
                  fontWeight="semibold"
                  fontSize="sm"
                  color={triggerNameColor}
                  noOfLines={1}
                  lineHeight="1.3"
                >
                  {userProfile.full_name}
                </Text>
                <Text fontSize="xs" color={triggerEmailColor} noOfLines={1} lineHeight="1.3">
                  {userProfile.email}
                </Text>
              </Box>
              <Icon
                as={ChevronsUpDown}
                boxSize={3.5}
                color={triggerEmailColor}
                flexShrink={0}
              />
            </HStack>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg={popoverBg}
        borderColor={borderColor}
        boxShadow="0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)"
        borderRadius="xl"
        border="1px solid"
        width={triggerWidth > 240 ? `${triggerWidth}px` : "240px"}
        maxWidth="none"
        overflow="hidden"
        autoFocus={false}
        tabIndex={-1}
        _focus={{ outline: "none" }}
        style={{ outline: "none" }}
        css={{ "--popper-arrow-shadow-color": "transparent" }}
        sx={{ "&:focus": { outline: "none" } }}
      >
        {/* User info header */}
        <Box px={4} py={4} bg={userHeaderBg} borderBottom="1px solid" borderColor={borderColor}>
          <HStack spacing={3}>
            <Avatar
              size="md"
              name={userProfile.full_name}
              src=""
              getInitials={getInitials}
              bg={avatarBg}
              borderRadius="full"
              color="white"
              fontWeight="bold"
              fontSize="sm"
              flexShrink={0}
            />
            <Box minWidth="0">
              <Text fontWeight="bold" fontSize="sm" color={primaryTextColor} noOfLines={1}>
                {userProfile.full_name}
              </Text>
              <Text fontSize="xs" color={secondaryTextColor} noOfLines={1}>
                {userProfile.email}
              </Text>
            </Box>
          </HStack>
        </Box>

        <VStack align="stretch" spacing={0} p={2}>
          {/* Theme toggle */}
          <Box px={2} py={2}>
            <Text fontSize="xs" fontWeight="semibold" color={secondaryTextColor} mb={2} textTransform="uppercase" letterSpacing="0.06em">
              Appearance
            </Text>
            <HStack
              spacing={0}
              gap="1px"
              bg={themeSegmentBg}
              borderRadius="lg"
              p={1}
            >
              {themeOptions.map(({ key, icon, label }) => {
                const isActive = selectedTheme === key;
                return (
                  <Tooltip key={key} label={label} placement="top" hasArrow openDelay={600}>
                    <Button
                      flex={1}
                      size="sm"
                      variant="unstyled"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={1.5}
                      height="28px"
                      borderRadius="md"
                      bg={isActive ? themeActiveBg : "transparent"}
                      color={isActive ? themeActiveColor : themeInactiveColor}
                      boxShadow={isActive ? "sm" : "none"}
                      fontWeight={isActive ? "semibold" : "normal"}
                      fontSize="xs"
                      transition="all 0.15s ease"
                      onClick={() => {
                        setSelectedTheme(key);
                        localStorage.setItem(THEME_PREF_KEY, key);
                        if (key !== "system") setColorMode(key);
                      }}
                      _hover={{ color: isActive ? themeActiveColor : primaryTextColor }}
                      _focus={{ outline: "none", boxShadow: "none" }}
                    >
                      <Icon as={icon} boxSize={3.5} />
                      <Text as="span">{label}</Text>
                    </Button>
                  </Tooltip>
                );
              })}
            </HStack>
          </Box>

          <Divider borderColor={borderColor} my={1} />

          {/* Profile settings */}
          <ChakraLink
            onClick={() => navigate("/profile")}
            display="flex"
            alignItems="center"
            px={3}
            py={2.5}
            borderRadius="lg"
            color={primaryTextColor}
            fontWeight="medium"
            fontSize="sm"
            tabIndex={-1}
            _hover={{ bg: hoverBg, textDecoration: "none" }}
            transition="background 0.15s"
          >
            <Icon as={User} boxSize={4} mr={3} color={secondaryTextColor} />
            Profile Settings
          </ChakraLink>

          {/* Sign out */}
          <ChakraLink
            onClick={handleLogout}
            display="flex"
            alignItems="center"
            px={3}
            py={2.5}
            borderRadius="lg"
            color={signOutColor}
            fontWeight="medium"
            fontSize="sm"
            tabIndex={-1}
            _hover={{ bg: signOutHoverBg, textDecoration: "none" }}
            transition="background 0.15s"
          >
            <Icon as={LogOut} boxSize={4} mr={3} />
            Sign Out
          </ChakraLink>
        </VStack>

        {/* Version footer */}
        <Box
          px={4}
          py={2.5}
          borderTop="1px solid"
          borderColor={borderColor}
          bg={userHeaderBg}
        >
          <Text fontSize="xs" color={secondaryTextColor}>
            Cashio v{VERSION}
          </Text>
        </Box>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileDisplay;
