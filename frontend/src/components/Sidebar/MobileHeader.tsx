import React from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { Menu } from "lucide-react";

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
