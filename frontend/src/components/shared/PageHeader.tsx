import {
  Box,
  Heading,
  useColorModeValue,
  HStack,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import React, { FC, ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: ReactNode;
  headerContent?: ReactNode;
  backIcon?: React.ElementType;
  backOnClick?: () => void;
}

const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, icon, actions, headerContent, backIcon, backOnClick }) => {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "gray.50");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("gray.400", "gray.500");
  const backIconColor = useColorModeValue("gray.500", "gray.400");
  const headerShadow = useColorModeValue("sm", "0 2px 8px rgba(0,0,0,0.6)");
  const headerBg = useColorModeValue("white", "gray.800");

  return (
    <Box
      px={{ base: 4, md: 8 }}
      py={{ base: 3, md: 6 }}
      position="sticky"
      top={0}
      zIndex={10}
      borderBottom="1px solid"
      borderColor={borderColor}
      bg={headerBg}
      boxShadow={headerShadow}
      sx={{ clipPath: "inset(0 -20px -20px 0)" }}
    >
      <Flex
        justifyContent="space-between"
        align={{ base: "flex-start", md: "center" }}
        flexDirection={{ base: "column", md: "row" }}
        gap={{ base: 2, md: 4 }}
        width="100%"
      >
        <HStack spacing={3} align="flex-start">
          {backIcon && (
            <Icon
              as={backIcon}
              boxSize={5}
              mt={{ base: "2px", md: "4px" }}
              onClick={backOnClick}
              cursor="pointer"
              color={backIconColor}
              _hover={{ color: titleColor }}
            />
          )}
          {icon && (
            <Icon as={icon} boxSize={{ base: 5, md: 6 }} mt={{ base: "2px", md: "3px" }} color={iconColor} flexShrink={0} display={{ base: "none", md: "block" }} />
          )}
          <Box>
            <Heading
              as="h1"
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              letterSpacing="-0.02em"
              color={titleColor}
            >
              {title}
            </Heading>
            {subtitle && (
              <Text fontSize="sm" color={subtitleColor} mt={0.5} display={{ base: "none", md: "block" }}>
                {subtitle}
              </Text>
            )}
          </Box>
        </HStack>
        {(headerContent || actions) && (
          <Flex
            gap={3}
            justify={{ base: "flex-start", md: "flex-end" }}
            w={{ base: "100%", md: "auto" }}
            flexWrap="wrap"
          >
            {headerContent}
            {actions}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default PageHeader;
