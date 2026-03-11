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
  const gradientBg = useColorModeValue(
    "linear(135deg, brand.500, brand.600)",
    "linear(135deg, brand.600, brand.700)"
  );

  return (
    <Box
      bgGradient={gradientBg}
      color="white"
      p={6}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="lg"
    >
      <Flex
        justifyContent="space-between"
        align={{ base: "center", md: "center" }}
        flexDirection={{ base: "column", md: "row" }}
        gap={4}
        width="100%"
      >
        <HStack spacing={3} align="center" flex={1} justifyContent={{ base: "flex-start", md: "flex-start" }} width={{ base: "100%", md: "auto" }}>
           {backIcon && (
             <Icon
               as={backIcon}
               boxSize={5}
               onClick={backOnClick}
               cursor="pointer"
               color="whiteAlpha.800"
               _hover={{ color: "white" }}
             />
           )}
           {icon && (
             <Box
               p={3}
               bg="whiteAlpha.200"
               borderRadius="md"
               backdropFilter="blur(20px)"
               border="1px solid whiteAlpha.300"
               boxShadow="xl"
             >
               <Icon as={icon} boxSize={6} />
             </Box>
           )}
            <Box flex={1}>
             <Heading
               as="h1"
               size="lg"
               fontWeight="bold"
               letterSpacing="-0.02em"
             >
               {title}
             </Heading>
             <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
               {subtitle || <span>&nbsp;</span>}
             </Text>
           </Box>
        </HStack>
         <HStack justifyContent={{ base: "center", md: "flex-end" }} flexShrink={1} width={{ base: "100%", md: "auto" }}>
           {headerContent}
           {actions && <Box w="100%">{actions}</Box>}
         </HStack>
      </Flex>
    </Box>
  );
};

export default PageHeader;
