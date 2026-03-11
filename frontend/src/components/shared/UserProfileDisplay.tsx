import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Text,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  PopoverFooter,
  VStack,
  Link as ChakraLink,
  HStack,
  Divider,
  useColorMode,
  Icon,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronUp, Sun, Moon, Laptop } from "lucide-react";
import { VERSION } from "../../version";

interface UserProfile {
  full_name: string;
  email: string;
  // Add other user properties as needed
}

interface UserProfileDisplayProps {
  handleLogout: () => void;
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

   // Modern color scheme
   const bgColor = useColorModeValue("primaryBg", "primaryBg");
   const borderColor = useColorModeValue("tertiaryBg", "gray.700");
   const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
   const secondaryTextColor = useColorModeValue(
     "secondaryTextColor",
     "secondaryTextColor"
   );
   const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("secondaryBg", "secondaryBg");
  const avatarBg = useColorModeValue("brand.500", "brand.600");
  const errorBorderColor = useColorModeValue("red.200", "red.700");
  const errorTextColor = useColorModeValue("red.600", "red.300");
  const brandIconColor = useColorModeValue("brand.500", "brand.300");

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

  // Keep Chakra's color mode in sync with the system preference when "system" is selected
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

  if (isLoading) {
    return (
      <Box
        p={3}
        borderRadius="md"
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
      >
        <HStack spacing={3}>
          <Box width="40px" height="40px" borderRadius="md" bg={hoverBg} />
          <Box flex="1">
            <Box height="16px" bg={hoverBg} borderRadius="md" mb={1} />
            <Box height="12px" bg={hoverBg} borderRadius="md" width="70%" />
          </Box>
        </HStack>
      </Box>
    );
  }

  if (isError || !userProfile) {
    return (
      <Box
        p={3}
        borderRadius="md"
        bg={cardBg}
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
    <Popover placement="top" isLazy>
      <PopoverTrigger>
        <Button
          ref={triggerRef}
          variant="ghost"
          p={3}
          height="auto"
          borderRadius="md"
          bg="transparent"
          border="1px solid"
          borderColor={borderColor}
          _hover={{
            bg: hoverBg,
            transform: "translateY(-2px)",
            boxShadow: "lg",
          }}
          _active={{ transform: "translateY(0)" }}
          _focus={{ outline: "none", ring: 0, borderColor: borderColor }}
          transition="all 0.2s ease"
          width="full"
          justifyContent="flex-start"
          sx={{ "&:focus": { outline: "none" } }}
        >
          <HStack spacing={3} width="full">
            <Avatar
              size="sm"
              name={userProfile.full_name}
              src=""
              getInitials={getInitials}
              bg={avatarBg}
              borderRadius="md"
              color="white"
              fontWeight="bold"
              fontSize="sm"
            />

             <Box flex="1" textAlign="left" minWidth="0">
               <Text
                 fontWeight="semibold"
                 fontSize="sm"
                 color={tertiaryTextColor}
                 noOfLines={1}
               >
                 {userProfile.full_name}
               </Text>
               <Text fontSize="xs" color={tertiaryTextColor} noOfLines={1}>
                 {userProfile.email}
               </Text>
             </Box>

            <Icon
              as={ChevronUp}
              boxSize={4}
              color={secondaryTextColor}
              opacity={0.7}
            />
          </HStack>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg={bgColor}
        borderColor="transparent"
        boxShadow="rgba(0, 0, 0, 0.1) 0px 4px 12px"
        borderRadius="xl"
        border="none"
        width={triggerWidth > 0 ? `${triggerWidth}px` : "240px"}
        maxWidth="none"
        overflow="hidden"
        autoFocus={false}
        tabIndex={-1}
        _focus={{ outline: "none" }}
        style={{ outline: "none" }}
        css={{
          "--popper-arrow-shadow-color": "transparent",
        }}
        sx={{ "&:focus": { outline: "none" } }}
      >
        <PopoverArrow bg={bgColor} shadow="none" border="none" />

        <PopoverBody p={0} pt={4}>
          <VStack align="stretch" spacing={0}>
             <ChakraLink
               onClick={() => navigate("/profile")}
               display="flex"
               alignItems="center"
               px={4}
               py={4}
               color={tertiaryTextColor}
               fontWeight="medium"
               fontSize="md"
               tabIndex={-1}
               _hover={{ bg: hoverBg }}
               transition="all 0.2s"
             >
               <Icon as={User} boxSize={4} mr={3} color={brandIconColor} />
               Profile Settings
             </ChakraLink>
            <Divider borderColor={borderColor} />
            <Box px={4} py={4}>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={secondaryTextColor}
                mb={3}
              >
                Theme
              </Text>
               <VStack spacing={2} align="stretch">
                 <Button
                   variant={selectedTheme === "light" ? "solid" : "outline"}
                   onClick={() => {
                     setSelectedTheme("light");
                     localStorage.setItem(THEME_PREF_KEY, "light");
                     setColorMode("light");
                   }}
                   size="sm"
                   leftIcon={<Icon as={Sun} />}
                   justifyContent="flex-start"
                 >
                   Light
                 </Button>
                 <Button
                   variant={selectedTheme === "dark" ? "solid" : "outline"}
                   onClick={() => {
                     setSelectedTheme("dark");
                     localStorage.setItem(THEME_PREF_KEY, "dark");
                     setColorMode("dark");
                   }}
                   size="sm"
                   leftIcon={<Icon as={Moon} />}
                   justifyContent="flex-start"
                 >
                   Dark
                 </Button>
                 <Button
                   variant={selectedTheme === "system" ? "solid" : "outline"}
                   onClick={() => {
                     setSelectedTheme("system");
                     localStorage.setItem(THEME_PREF_KEY, "system");
                     // color mode is applied reactively by the useEffect above
                   }}
                   size="sm"
                   leftIcon={<Icon as={Laptop} />}
                   justifyContent="flex-start"
                 >
                   System
                 </Button>
               </VStack>
            </Box>

            <Divider borderColor={borderColor} />

             <ChakraLink
               onClick={handleLogout}
               display="flex"
               alignItems="center"
               px={4}
               py={4}
               color={tertiaryTextColor}
               fontWeight="medium"
               fontSize="md"
               tabIndex={-1}
               _hover={{ bg: hoverBg }}
               transition="all 0.2s"
             >
               <Icon as={LogOut} boxSize={4} mr={3} />
               Sign Out
             </ChakraLink>
          </VStack>
        </PopoverBody>

        <PopoverFooter
          px={4}
          py={3}
          bg={cardBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Text fontSize="xs" color={secondaryTextColor}>
            Version {VERSION}
          </Text>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileDisplay;
