import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbEntry {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbEntry[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const linkColor = useColorModeValue("gray.500", "gray.400");
  const linkHoverColor = useColorModeValue("brand.600", "brand.300");
  const currentColor = useColorModeValue("gray.700", "gray.200");
  const separatorColor = useColorModeValue("gray.300", "gray.600");
  const homeIconColor = useColorModeValue("gray.400", "gray.500");

  return (
    <Breadcrumb
      spacing="6px"
      separator={
        <Icon as={ChevronRight} boxSize={3} color={separatorColor} />
      }
      fontSize="xs"
    >
      {/* Home is always the first item */}
      <BreadcrumbItem>
        <BreadcrumbLink
          as={RouterLink}
          to="/"
          color={linkColor}
          _hover={{ color: linkHoverColor, textDecoration: "none" }}
          display="flex"
          alignItems="center"
          gap={1}
          transition="color 0.15s ease"
        >
          <Icon as={Home} boxSize={3} color={homeIconColor} />
          Home
        </BreadcrumbLink>
      </BreadcrumbItem>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <BreadcrumbItem key={index} isCurrentPage={isLast}>
            {isLast || !item.path ? (
              <BreadcrumbLink
                color={currentColor}
                fontWeight="medium"
                cursor="default"
                _hover={{ textDecoration: "none" }}
                noOfLines={1}
                maxW={{ base: "120px", md: "200px" }}
              >
                {item.label}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbLink
                as={RouterLink}
                to={item.path}
                color={linkColor}
                _hover={{ color: linkHoverColor, textDecoration: "none" }}
                transition="color 0.15s ease"
                noOfLines={1}
                maxW={{ base: "120px", md: "200px" }}
              >
                {item.label}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

export default Breadcrumbs;
