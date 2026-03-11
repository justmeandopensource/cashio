import React, { useState, useEffect } from "react";
import {
  Flex,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  Checkbox,
  Button,
  useToast,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Plus, X, CheckCircle } from "lucide-react";
import { toastDefaults } from "../shared/utils";
import { AxiosError } from "axios";

interface GroupCategory {
  category_id: string;
  name: string;
}

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryType: "income" | "expense";
  parentCategoryId?: string | null;
}

interface CreateCategoryPayload {
  name: string;
  is_group: boolean;
  parent_category_id: string | null;
  type: string;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryType,
  parentCategoryId,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [categoryName, setCategoryName] = useState<string>("");
  const [isGroupCategory, setIsGroupCategory] = useState<boolean>(false);
  const [parentCategory, setParentCategory] = useState<string>(
    parentCategoryId || "",
  );

  // Modern theme colors - matching CreateAccountModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const textColorTertiary = useColorModeValue("gray.600", "gray.200");
  const textColorError = useColorModeValue("red.700", "red.300");
  const bgError = useColorModeValue("red.50", "red.900");
  const borderColorError = useColorModeValue("red.200", "red.700");
  const spinnerColor = useColorModeValue("teal.500", "teal.300");
  const bgInfo = useColorModeValue("blue.50", "blue.900");
  const borderColorInfo = useColorModeValue("blue.200", "blue.700");
  const textColorInfo = useColorModeValue("blue.700", "blue.300");
  const buttonBorderColor = useColorModeValue("gray.300", "gray.600");
  const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
  const buttonHoverBorderColor = useColorModeValue("gray.400", "gray.500");

  // Update parentCategory state when parentCategoryId prop changes
  useEffect(() => {
    setParentCategory(parentCategoryId || "");
  }, [parentCategoryId]);

  // Fetch group categories when the modal is opened
  const {
    data: groupCategories,
    isLoading: isGroupCategoriesLoading,
    isError: isGroupCategoriesError,
  } = useQuery({
    queryKey: ["groupCategories", categoryType],
    queryFn: async (): Promise<GroupCategory[]> => {
      try {
        const response = await api.get<GroupCategory[]>(
          `/category/group?category_type=${categoryType}`,
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status === 401) {
          throw error; // Let the interceptor handle the redirect
        }
        throw new Error(
          axiosError.response?.data?.detail ||
            "Failed to fetch group categories",
        );
      }
    },
    enabled: isOpen && !parentCategoryId, // Only fetch group categories when the modal is open and no parentCategoryId is provided
  });

  // Reset form fields
  const resetForm = (): void => {
    setCategoryName("");
    setIsGroupCategory(false);
    setParentCategory(parentCategoryId || "");
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Mutation for creating a new category
  const createCategoryMutation = useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const response = await api.post(`/category/create`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast({
        description: "Category created successfully.",
        status: "success",
        ...toastDefaults,
      });
      resetForm();
      onClose();
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        toast({
          description:
            error.response?.data?.detail || "Failed to create category.",
          status: "error",
          ...toastDefaults,
        });
      }
    },
  });

  // Handle form submission
  const handleSubmit = (): void => {
    if (!categoryName) {
      toast({
        description: "Please enter a category name.",
        status: "warning",
        ...toastDefaults,
      });
      return;
    }

    const payload: CreateCategoryPayload = {
      name: categoryName,
      is_group: isGroupCategory,
      parent_category_id: parentCategory || null,
      type: categoryType,
    };

    createCategoryMutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius={{ base: 0, sm: "md" }}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: 4 }}
        my={{ base: 0, sm: "auto" }}
        maxHeight={{ base: "100%", md: "90vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Modern gradient header */}
        <Box
          bgGradient="linear(135deg, teal.400, teal.600)"
          color="white"
          px={{ base: 4, sm: 8 }}
          py={{ base: 6, sm: 6 }}
          pt={{ base: 12, sm: 6 }}
          position="relative"
        >
          <HStack spacing={{ base: 3, sm: 4 }} align="center">
            <Box
              p={{ base: 2, sm: 3 }}
              bg="whiteAlpha.200"
              borderRadius="md"
              backdropFilter="blur(10px)"
            >
              <Plus size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Box
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Create {categoryType === "income" ? "Income" : "Expense"}{" "}
                Category
              </Box>
              <Box
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
              >
                Add a new {categoryType} category to organize transactions
              </Box>
            </Box>
          </HStack>
        </Box>

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          display="flex"
          flexDirection="column"
          overflow="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Category Name Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" mb={2}>
                  Category Name
                </FormLabel>
                <Input
                  placeholder={`e.g., ${categoryType === "income" ? "Salary, Freelance" : "Groceries, Utilities"}`}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  bg={inputBg}
                  size="lg"
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                  autoFocus
                />
                         <FormHelperText mt={2} color={textColorSecondary}>
                           Organize this category under an existing group
                         </FormHelperText>
              </FormControl>
            </Box>

            {/* Category Type Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <Box>
                <HStack justifyContent="space-between" align="center" mb={2}>
                  <Box>
                    <Text fontWeight="semibold" mb={1}>
                      Group Category
                    </Text>
                     <Text fontSize="sm" color={textColor}>
                       Group categories can contain other categories but cannot
                       be assigned to transactions
                     </Text>
                  </Box>
                  <Checkbox
                    isChecked={isGroupCategory}
                    onChange={(e) => setIsGroupCategory(e.target.checked)}
                    colorScheme="teal"
                    size="lg"
                  />
                </HStack>
              </Box>
            </Box>

            {/* Parent Category Card (only show if not creating under a specific parent) */}
            {!parentCategoryId && (
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Parent Category (Optional)
                  </FormLabel>

                  {/* Show loading spinner while fetching group categories */}
                  {isGroupCategoriesLoading && (
                    <Flex justify="center" align="center" py={8}>
                      <VStack spacing={3}>
                         <Spinner size="md" color={spinnerColor} thickness="3px" />
                         <Text fontSize="sm" color={textColor}>
                           Loading group categories...
                         </Text>
                      </VStack>
                    </Flex>
                  )}

                  {/* Show error message if fetching group categories fails */}
                  {isGroupCategoriesError && (
                     <Box
                       bg={bgError}
                       border="2px solid"
                       borderColor={borderColorError}
                       borderRadius="md"
                       p={4}
                     >
                       <Text color={textColorError} fontSize="sm" fontWeight="medium">
                         Failed to load group categories. Please try again.
                       </Text>
                    </Box>
                  )}

                  {/* Show parent category selection if data is available */}
                  {groupCategories &&
                    groupCategories.length > 0 &&
                    !isGroupCategoriesLoading && (
                      <>
                        <Select
                          value={parentCategory}
                          onChange={(e) => setParentCategory(e.target.value)}
                          placeholder="Select parent category"
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          bg={inputBg}
                          size="lg"
                          borderRadius="md"
                          _hover={{ borderColor: "teal.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}
                        >
                          {groupCategories.map((category) => (
                            <option
                              key={category.category_id}
                              value={category.category_id}
                            >
                              {category.name}
                            </option>
                          ))}
                        </Select>
                         <FormHelperText mt={2} color={textColorSecondary}>
                           Organize this category under an existing group
                         </FormHelperText>
                      </>
                    )}

                  {/* Show message if no group categories are available */}
                  {groupCategories &&
                    groupCategories.length === 0 &&
                    !isGroupCategoriesLoading &&
                    !isGroupCategoriesError && (
                       <Box
                         bg={bgInfo}
                         border="2px solid"
                         borderColor={borderColorInfo}
                         borderRadius="md"
                         p={4}
                       >
                         <Text
                           color={textColorInfo}
                           fontSize="sm"
                           fontWeight="medium"
                         >
                           No group categories available. This category will be
                           created at the root level.
                         </Text>
                      </Box>
                    )}
                </FormControl>
              </Box>
            )}
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={createCategoryMutation.isPending}
              isDisabled={!categoryName || isGroupCategoriesError}
              loadingText="Creating..."
              leftIcon={<CheckCircle />}
              _hover={{
                transform: createCategoryMutation.isPending
                  ? "none"
                  : "translateY(-2px)",
                boxShadow: createCategoryMutation.isPending ? "none" : "lg",
              }}
              transition="all 0.2s"
            >
              Create Category
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="md"
              isDisabled={createCategoryMutation.isPending}
              leftIcon={<X />}
               borderWidth="2px"
               borderColor={buttonBorderColor}
               color={textColorTertiary}
               _hover={{
                 bg: buttonHoverBg,
                 borderColor: buttonHoverBorderColor,
               }}
            >
              Cancel
            </Button>
          </Box>
        </ModalBody>

        {/* Desktop-only footer */}
        <ModalFooter
          display={{ base: "none", sm: "flex" }}
          px={8}
          py={6}
          bg={cardBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={createCategoryMutation.isPending}
            isDisabled={!categoryName || isGroupCategoriesError}
            loadingText="Creating..."
            leftIcon={<CheckCircle />}
            _hover={{
              transform: createCategoryMutation.isPending
                ? "none"
                : "translateY(-2px)",
              boxShadow: createCategoryMutation.isPending ? "none" : "lg",
            }}
            transition="all 0.2s"
          >
            Create Category
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            isDisabled={createCategoryMutation.isPending}
            leftIcon={<X />}
            px={6}
            py={3}
            borderRadius="md"
             borderWidth="2px"
             borderColor={buttonBorderColor}
             color={textColorTertiary}
             _hover={{
               bg: buttonHoverBg,
               borderColor: buttonHoverBorderColor,
             }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateCategoryModal;
