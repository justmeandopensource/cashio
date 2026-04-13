import {
  Box,
  Heading,
  useColorModeValue,
  HStack,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import React, { FC, ReactNode } from "react";
import Breadcrumbs, { type BreadcrumbEntry } from "./Breadcrumbs";

const MotionFlex = motion.create(Flex);

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: ReactNode;
  headerContent?: ReactNode;
  backIcon?: React.ElementType;
  backOnClick?: () => void;
  breadcrumbs?: BreadcrumbEntry[];
}

const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, icon, actions, headerContent, backIcon, backOnClick, breadcrumbs }) => {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const titleColor = useColorModeValue("gray.900", "gray.50");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("gray.400", "gray.500");
  const backIconColor = useColorModeValue("gray.500", "gray.400");
  const headerBg = useColorModeValue("white", "gray.800");

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={10}
      borderBottom="1px solid"
      borderColor={borderColor}
      bg={headerBg}
    >
      {/* Gradient accent line */}
      <Box
        h="2px"
        bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
      />

      {breadcrumbs && breadcrumbs.length > 0 && (
        <Box px={{ base: 5, md: 8 }} pt={{ base: 2, md: 3 }}>
          <Breadcrumbs items={breadcrumbs} />
        </Box>
      )}

      <MotionFlex
        px={{ base: 5, md: 8 }}
        pt={breadcrumbs && breadcrumbs.length > 0 ? { base: 1, md: 2 } : { base: 3, md: 6 }}
        pb={{ base: 3, md: 6 }}
        justifyContent="space-between"
        align={{ base: "flex-start", md: "center" }}
        flexDirection={{ base: "column", md: "row" }}
        gap={{ base: 2, md: 4 }}
        width="100%"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
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
              transition="color 0.15s ease"
            />
          )}
          {icon && (
            <Icon as={icon} boxSize={{ base: 5, md: 6 }} mt={{ base: "2px", md: "3px" }} color={iconColor} flexShrink={0} display={{ base: "none", md: "block" }} />
          )}
          <Box>
            <Heading
              as="h1"
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="800"
              letterSpacing="-0.03em"
              color={titleColor}
            >
              {title}
            </Heading>
            {subtitle && (
              <Text fontSize="sm" color={subtitleColor} mt={1} display={{ base: "none", md: "block" }} letterSpacing="0.01em">
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
      </MotionFlex>
    </Box>
  );
};

export default PageHeader;
