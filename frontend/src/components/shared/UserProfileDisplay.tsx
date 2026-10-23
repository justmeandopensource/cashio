import React, { useRef, useState, useEffect } from "react";
import { useColorMode, useColorModeValue } from "../ui/color-mode";
import {
  Box,
  Text,
  Avatar,
  Popover,
  VStack,
  Link as ChakraLink,
  HStack,
  Icon,
  Button,
  Separator,
} from "@chakra-ui/react";
import { Tooltip } from '@/components/ui/tooltip';
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { User, ChevronsUpDown, Sun, Moon, Monitor } from "lucide-react";
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
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const popoverBg = useColorModeValue("white", "gray.800");
  const userHeaderBg = useColorModeValue("gray.50", "rgba(255,255,255,0.03)");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const avatarBg = useColorModeValue("brand.500", "brand.600");
  const errorBorderColor = useColorModeValue("red.200", "red.700");
  const errorTextColor = useColorModeValue("red.600", "red.300");
  const themeSegmentBg = useColorModeValue("gray.100", "gray.700");
  const themeActiveBg = useColorModeValue("white", "gray.600");
  const themeActiveColor = useColorModeValue("brand.600", "brand.300");
  const themeInactiveColor = useColorModeValue("gray.500", "gray.400");
  const triggerHoverBg = useColorModeValue("gray.100", "gray.700");
  const triggerNameColor = useColorModeValue("gray.700", "gray.200");
  const triggerEmailColor = useColorModeValue("gray.500", "gray.400");
  const skeletonBg = useColorModeValue("gray.100", "gray.700");
  const versionColor = useColorModeValue("gray.400", "gray.500");
  const menuIconColor = useColorModeValue("gray.400", "gray.500");

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
          <Box width="36px" height="36px" borderRadius="full" bg={skeletonBg} mx="auto" />
        ) : (
          <HStack gap={3}>
            <Box width="36px" height="36px" borderRadius="full" bg={skeletonBg} flexShrink={0} />
            <Box flex="1">
              <Box height="13px" bg={skeletonBg} borderRadius="md" mb={1.5} />
              <Box height="11px" bg={skeletonBg} borderRadius="md" width="65%" />
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
        borderRadius="lg"
        border="1px solid"
        borderColor={errorBorderColor}
        color={errorTextColor}
        textAlign="center"
      >
        <Text fontSize="xs">Error loading profile</Text>
      </Box>
    );
  }

  return (
    <Popover.Root
      lazyMount
      open={isPopoverOpen}
      onOpenChange={e => {
        if (!(e.open)) { setIsPopoverOpen(false); }
      }}
      positioning={{
        placement: 'top'
      }}
    >
      <Popover.Trigger asChild>
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
          css={{
            "&:focus": { outline: "none" }
          }}
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
            <Tooltip content={userProfile.full_name} showArrow openDelay={200} positioning={{
              placement: "right"
            }}>
              <Avatar.Root
                size="sm"
                bg={avatarBg}
                borderRadius="full"
                color="white"
                fontWeight="bold"
                fontSize="xs"
                flexShrink={0}>
                <Avatar.Fallback name={userProfile.full_name}>
                  {getInitials(userProfile.full_name)}
                </Avatar.Fallback>
              </Avatar.Root>
            </Tooltip>
          ) : (
            <HStack gap={2.5} width="full">
              <Avatar.Root
                size="sm"
                bg={avatarBg}
                borderRadius="full"
                color="white"
                fontWeight="bold"
                fontSize="xs"
                flexShrink={0}>
                <Avatar.Fallback name={userProfile.full_name}>
                  {getInitials(userProfile.full_name)}
                </Avatar.Fallback>
              </Avatar.Root>
              <Box flex="1" textAlign="left" minWidth="0">
                <Text
                  fontWeight="600"
                  fontSize="sm"
                  color={triggerNameColor}
                  lineClamp={1}
                  lineHeight="1.3"
                >
                  {userProfile.full_name}
                </Text>
                <Text fontSize="xs" color={triggerEmailColor} lineClamp={1} lineHeight="1.3">
                  {userProfile.email}
                </Text>
              </Box>
              <Icon
                boxSize={3.5}
                color={triggerEmailColor}
                flexShrink={0}
                transition="transform 0.15s ease"
                transform={isPopoverOpen ? "rotate(180deg)" : "none"}
                asChild><ChevronsUpDown /></Icon>
            </HStack>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Positioner>
        <Popover.Content
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
          css={{
            "--popper-arrow-shadow-color": "transparent",
            "&:focus": { outline: "none" }
          }}>
          {/* User info header */}
          <Box px={4} py={3.5} bg={userHeaderBg} borderBottom="1px solid" borderColor={borderColor}>
            <HStack gap={3}>
              <Avatar.Root
                size="md"
                bg={avatarBg}
                borderRadius="full"
                color="white"
                fontWeight="bold"
                fontSize="sm"
                flexShrink={0}>
                <Avatar.Fallback name={userProfile.full_name}>
                  {getInitials(userProfile.full_name)}
                </Avatar.Fallback>
              </Avatar.Root>
              <Box minWidth="0" flex={1}>
                <Text fontWeight="700" fontSize="sm" color={primaryTextColor} lineClamp={1}>
                  {userProfile.full_name}
                </Text>
                <Text fontSize="xs" color={secondaryTextColor} lineClamp={1} mt={0.5}>
                  {userProfile.email}
                </Text>
              </Box>
            </HStack>
          </Box>

          <VStack align="stretch" gap={0} p={2}>
            {/* Theme toggle */}
            <Box px={2} py={2}>
              <Text
                fontSize="xs"
                fontWeight="600"
                color={secondaryTextColor}
                mb={2}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Appearance
              </Text>
              <HStack
                gap="1px"
                bg={themeSegmentBg}
                borderRadius="lg"
                p={1}
              >
                {themeOptions.map(({ key, icon, label }) => {
                  const isActive = selectedTheme === key;
                  return (
                    <Tooltip key={key} content={label} showArrow openDelay={600} positioning={{
                      placement: "top"
                    }}>
                      <Button
                        flex={1}
                        size="sm"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={1.5}
                        height="28px"
                        borderRadius="md"
                        bg={isActive ? themeActiveBg : "transparent"}
                        color={isActive ? themeActiveColor : themeInactiveColor}
                        boxShadow={isActive ? "sm" : "none"}
                        fontWeight={isActive ? "600" : "normal"}
                        fontSize="xs"
                        transition="all 0.15s ease"
                        onClick={() => {
                          setSelectedTheme(key);
                          localStorage.setItem(THEME_PREF_KEY, key);
                          if (key !== "system") setColorMode(key);
                        }}
                        _hover={{ color: isActive ? themeActiveColor : primaryTextColor }}
                        _focus={{ outline: "none", boxShadow: "none" }}
                        unstyled
                      >
                        <Icon as={icon} boxSize={3.5} />
                        <Text as="span">{label}</Text>
                      </Button>
                    </Tooltip>
                  );
                })}
              </HStack>
            </Box>

            <Separator borderColor={borderColor} my={1} />

            {/* Profile settings */}
            <ChakraLink
              onClick={() => {
                setIsPopoverOpen(false);
                navigate("/profile");
              }}
              display="flex"
              alignItems="center"
              px={3}
              py={2.5}
              borderRadius="lg"
              color={primaryTextColor}
              fontWeight="500"
              fontSize="sm"
              tabIndex={-1}
              _hover={{ bg: hoverBg, textDecoration: "none" }}
              transition="background 0.15s"
            >
              <Icon boxSize={4} mr={3} color={menuIconColor} asChild><User /></Icon>
              Profile Settings
            </ChakraLink>
          </VStack>

          {/* Version footer */}
          <Box
            px={4}
            py={2}
            borderTop="1px solid"
            borderColor={borderColor}
            bg={userHeaderBg}
          >
            <Text fontSize="xs" color={versionColor} fontFamily="mono">
              v{VERSION}
            </Text>
          </Box>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default UserProfileDisplay;
