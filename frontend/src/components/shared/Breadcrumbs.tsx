import React from "react";
import { useColorModeValue } from "../ui/color-mode";
import { Link as RouterLink } from "react-router-dom";
import { Breadcrumb, Icon } from "@chakra-ui/react";
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
    <Breadcrumb.Root fontSize="xs">
      <Breadcrumb.List gap="6px">
        {/* Home is always the first item */}
        <Breadcrumb.Item>
          <Breadcrumb.Link
            color={linkColor}
            _hover={{ color: linkHoverColor, textDecoration: "none" }}
            display="flex"
            alignItems="center"
            gap={1}
            transition="color 0.15s ease"
            asChild
          >
            <RouterLink to="/">
              <Icon boxSize={3} color={homeIconColor} asChild>
                <Home />
              </Icon>
              Home
            </RouterLink>
          </Breadcrumb.Link>
        </Breadcrumb.Item>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <Breadcrumb.Separator>
                <Icon boxSize={3} color={separatorColor} asChild>
                  <ChevronRight />
                </Icon>
              </Breadcrumb.Separator>
              <Breadcrumb.Item>
                {isLast || !item.path ? (
                  <Breadcrumb.CurrentLink
                    color={currentColor}
                    fontWeight="medium"
                    cursor="default"
                    _hover={{ textDecoration: "none" }}
                    lineClamp={1}
                    maxW={{ base: "120px", md: "200px" }}
                  >
                    {item.label}
                  </Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link
                    color={linkColor}
                    _hover={{ color: linkHoverColor, textDecoration: "none" }}
                    transition="color 0.15s ease"
                    lineClamp={1}
                    maxW={{ base: "120px", md: "200px" }}
                    asChild
                  >
                    <RouterLink to={item.path}>{item.label}</RouterLink>
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
            </React.Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
};

export default Breadcrumbs;
