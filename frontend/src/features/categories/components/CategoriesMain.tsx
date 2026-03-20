import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Icon,
  useDisclosure,
  SimpleGrid,
  Spinner,
  Link as ChakraLink,
  Heading,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { Plus,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import CreateCategoryModal from "@components/modals/CreateCategoryModal";
import config from "@/config";
import { notify } from "@/components/shared/notify";
import { useColorModeValue } from "@chakra-ui/react";

// Define TypeScript interfaces
interface Category {
  category_id: string;
  name: string;
  type: "income" | "expense";
  is_group: boolean;
  parent_category_id: string | null;
}

const CategoriesMain: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categoryType, setCategoryType] = useState<"income" | "expense" | null>(
    null,
  );
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loadingBg = useColorModeValue("gray.50", "primaryBg");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const groupBg = useColorModeValue("teal.50", "teal.900");
  const groupColor = useColorModeValue("brand.600", "brand.200");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const hoverIconColor = useColorModeValue("brand.600", "brand.400");
  const errorTextColor = useColorModeValue("red.500", "red.300");
  const emptyStateTextColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
  const emptyStateHeadingColor = useColorModeValue("primaryTextColor", "primaryTextColor");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const sectionBorderColor = useColorModeValue("gray.200", "gray.700");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const groupAccentColor = useColorModeValue("brand.400", "brand.500");
  const guideLineColor = useColorModeValue("brand.100", "whiteAlpha.200");
  const incomeTopAccent = useColorModeValue("green.400", "green.400");
  const expenseTopAccent = useColorModeValue("orange.400", "orange.400");

  // Listen for create category events from the header
  useEffect(() => {
    const handleCreateCategoryEvent = (event: CustomEvent) => {
      const { type } = event.detail;
      handleCreateCategoryClick(type);
    };

    window.addEventListener('createCategory', handleCreateCategoryEvent as EventListener);

    return () => {
      window.removeEventListener('createCategory', handleCreateCategoryEvent as EventListener);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch categories using React Query
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${config.apiBaseUrl}/category/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      return response.json();
    },
  });

  // Function to refresh categories data
  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  // Separate categories into Income and Expense
  const incomeCategories = categories.filter(
    (category) => category.type === "income",
  );
  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );

  // Function to render categories in a nested table format
  const renderCategoriesTable = (
    categories: Category[],
    parentId: string | null = null,
    level: number = 0,
  ): React.ReactNode => {
    return categories
      .filter((category) => category.parent_category_id === parentId)
      .map((category) => (
        <React.Fragment key={category.category_id}>
          <Tr
            bg={category.is_group ? groupBg : "transparent"}
            _hover={{ bg: hoverBg }}
          >
            <Td pl={`${level * 24 + 8}px`} position="relative">
              {category.is_group && (
                <Box
                  position="absolute"
                  left={0}
                  top={0}
                  bottom={0}
                  width="3px"
                  bg={groupAccentColor}
                  borderRadius="0 2px 2px 0"
                />
              )}
              {!category.is_group && level > 0 && (
                <Box
                  position="absolute"
                  left={`${(level - 1) * 24 + 20}px`}
                  top={0}
                  bottom={0}
                  width="1px"
                  bg={guideLineColor}
                />
              )}
              {!category.is_group ? (
                <Text fontWeight="normal" color={tertiaryTextColor} fontSize="sm">
                  {category.name}
                </Text>
              ) : (
                <Text fontWeight="bold" color={groupColor} fontSize="md">
                  {category.name}
                </Text>
              )}
            </Td>
            <Td>
              <Box display="flex" gap={2}>
                {category.is_group && (
                  <ChakraLink
                    onClick={() =>
                      handleCreateCategoryClick(
                        category.type,
                        category.category_id,
                      )
                    }
                    _hover={{ textDecoration: "none" }}
                  >
                    <Icon
                      as={Plus}
                      size={16}
                      color={iconColor}
                      _hover={{ color: hoverIconColor }}
                    />
                  </ChakraLink>
                )}
              </Box>
            </Td>
          </Tr>

          {renderCategoriesTable(categories, category.category_id, level + 1)}
        </React.Fragment>
      ));
  };

  // Open modal for creating a new category
  const handleCreateCategoryClick = (
    type: "income" | "expense",
    parentId: string | null = null,
  ): void => {
    setCategoryType(type);
    setParentCategoryId(parentId);
    onOpen();
  };

  if (isCategoriesLoading) {
    return (
      <Box bg={loadingBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="brand.500" />
        </Box>
      </Box>
    );
  }

  if (isCategoriesError) {
    notify({
      description: "Failed to fetch categories.",
      status: "error",
    });
    return (
      <Box bg={loadingBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
        <Box textAlign="center" py={10}>
          <Text color={errorTextColor} mb={4}>
            There was an error loading your categories.
          </Text>
          <Button onClick={refreshCategories} colorScheme="brand" leftIcon={<RefreshCw size={16} />}>
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box bg={loadingBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
        <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
          {/* Income Categories */}
          <Box
            bg={cardBg}
            p={{ base: 3, md: 4 }}
            borderRadius="md"
            boxShadow="md"
            border="1px solid"
            borderColor={sectionBorderColor}
            borderTopWidth="3px"
            borderTopColor={incomeTopAccent}
            transition="box-shadow 0.2s"
            _hover={{ boxShadow: "lg" }}
          >
            <HStack
              justifyContent="space-between"
              alignItems="center"
              mb={4}
              flexWrap={{ base: "wrap", sm: "nowrap" } as any}
            >
              <HStack spacing={2}>
                <Icon as={ArrowUpCircle} size={20} color={iconColor} />
                <Heading size="md" color={groupColor}>
                  Income Categories
                </Heading>
              </HStack>
              <IconButton
                icon={<Plus />}
                size="sm"
                colorScheme="brand"
                variant="ghost"
                aria-label="Add Income Category"
                onClick={() => handleCreateCategoryClick("income")}
              />
            </HStack>
            {incomeCategories.length === 0 ? (
              <Box textAlign="center" py={6} px={4}>
                <Text fontSize="lg" fontWeight="medium" mb={2} color={emptyStateHeadingColor}>
                  No Income Categories Found
                </Text>
                <Text color={emptyStateTextColor} mb={4} fontSize="sm">
                  You do not have any income categories yet.
                </Text>
                <Button
                  leftIcon={<Plus />}
                  onClick={() => handleCreateCategoryClick("income")}
                  size="sm"
                  colorScheme="brand"
                >
                  Create Income Category
                </Button>
              </Box>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th
                      color={columnHeaderColor}
                      fontSize="2xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      pb={2}
                      borderBottomColor={sectionBorderColor}
                    >
                      Category
                    </Th>
                    <Th pb={2} borderBottomColor={sectionBorderColor} />
                  </Tr>
                </Thead>
                <Tbody>{renderCategoriesTable(incomeCategories)}</Tbody>
              </Table>
            )}
          </Box>

          {/* Expense Categories */}
          <Box
            bg={cardBg}
            p={{ base: 3, md: 4 }}
            borderRadius="md"
            boxShadow="md"
            border="1px solid"
            borderColor={sectionBorderColor}
            borderTopWidth="3px"
            borderTopColor={expenseTopAccent}
            transition="box-shadow 0.2s"
            _hover={{ boxShadow: "lg" }}
          >
            <HStack
              justifyContent="space-between"
              alignItems="center"
              mb={4}
              flexWrap={{ base: "wrap", sm: "nowrap" } as any}
            >
              <HStack spacing={2}>
                <Icon as={ArrowDownCircle} size={20} color={iconColor} />
                <Heading size="md" color={groupColor}>
                  Expense Categories
                </Heading>
              </HStack>
              <IconButton
                icon={<Plus />}
                size="sm"
                colorScheme="brand"
                variant="ghost"
                aria-label="Add Expense Category"
                onClick={() => handleCreateCategoryClick("expense")}
              />
            </HStack>
            {expenseCategories.length === 0 ? (
              <Box textAlign="center" py={6} px={4}>
                <Text fontSize="lg" fontWeight="medium" mb={2} color={emptyStateHeadingColor}>
                  No Expense Categories Found
                </Text>
                <Text color={emptyStateTextColor} mb={4} fontSize="sm">
                  You do not have any expense categories yet.
                </Text>
                <Button
                  leftIcon={<Plus />}
                  onClick={() => handleCreateCategoryClick("expense")}
                  size="sm"
                  colorScheme="brand"
                >
                  Create Expense Category
                </Button>
              </Box>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th
                      color={columnHeaderColor}
                      fontSize="2xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      pb={2}
                      borderBottomColor={sectionBorderColor}
                    >
                      Category
                    </Th>
                    <Th pb={2} borderBottomColor={sectionBorderColor} />
                  </Tr>
                </Thead>
                <Tbody>{renderCategoriesTable(expenseCategories)}</Tbody>
              </Table>
            )}
          </Box>
        </SimpleGrid>
      </Box>

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={isOpen}
        onClose={onClose}
        categoryType={categoryType === "income" ? "income" : "expense"}
        parentCategoryId={parentCategoryId}
      />
    </Box>
  );
};

export default CategoriesMain;
