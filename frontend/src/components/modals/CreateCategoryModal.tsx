import React, { useState, useEffect } from "react";
import { useColorModeValue } from "../ui/color-mode";
import {
  Flex,
  Spinner,
  Input,
  NativeSelect,
  Checkbox,
  Button,
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Field,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { Plus, Check } from "lucide-react";
import { notify } from "@/components/shared/notify";
import { AxiosError } from "axios";
import { useGroupCategories, useCreateCategory } from "@features/categories/hooks";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryType: "income" | "expense";
  parentCategoryId?: string | null;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryType,
  parentCategoryId,
}) => {
  const [categoryName, setCategoryName] = useState<string>("");
  const [isGroupCategory, setIsGroupCategory] = useState<boolean>(false);
  const [parentCategory, setParentCategory] = useState<string>(
    parentCategoryId || "",
  );

  // Modern theme colors - matching CreateAccountModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const textColorError = useColorModeValue("red.700", "red.300");
  const bgError = useColorModeValue("red.50", "red.900");
  const borderColorError = useColorModeValue("red.200", "red.700");
  const spinnerColor = useColorModeValue("teal.500", "teal.300");
  const bgInfo = useColorModeValue("blue.50", "blue.900");
  const borderColorInfo = useColorModeValue("blue.200", "blue.700");
  const textColorInfo = useColorModeValue("blue.700", "blue.300");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = textColorSecondary;
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

  // Update parentCategory state when parentCategoryId prop changes
  useEffect(() => {
    setParentCategory(parentCategoryId || "");
  }, [parentCategoryId]);

  // Fetch group categories when the modal is opened
  const {
    data: groupCategories,
    isLoading: isGroupCategoriesLoading,
    isError: isGroupCategoriesError,
  } = useGroupCategories(categoryType, isOpen && !parentCategoryId);

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
  const createCategoryBase = useCreateCategory();
  const createCategoryMutation = {
    ...createCategoryBase,
    mutate: (payload: { name: string; is_group: boolean; parent_category_id: string | null; type: string }) => {
      createCategoryBase.mutate(payload, {
        onSuccess: () => {
          notify({ description: "Category created successfully.", status: "success" });
          resetForm();
          onClose();
        },
        onError: (error: Error) => {
          const axiosErr = error as AxiosError<{ detail: string }>;
          if (axiosErr.response?.status !== 401) {
            notify({ description: axiosErr.response?.data?.detail || "Failed to create category.", status: "error" });
          }
        },
      });
    },
  };

  // Handle form submission
  const handleSubmit = (): void => {
    if (!categoryName) {
      notify({
        description: "Please enter a category name.",
        status: "warning",
      });
      return;
    }

    const payload = {
      name: categoryName,
      is_group: isGroupCategory,
      parent_category_id: parentCategory || null,
      type: categoryType,
    };

    createCategoryMutation.mutate(payload);
  };

  return (
    <Dialog.Root
      open={isOpen}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slide-in-bottom"
      onOpenChange={e => {
        if (!e.open) {
          onClose();
        }
      }}>
      <Portal>

        <Dialog.Backdrop backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <Dialog.Positioner>
          <Dialog.Content
            bg={bgColor}
            borderRadius={{ base: 0, sm: "xl" }}
            boxShadow="2xl"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
            mx={{ base: 0, sm: 4 }}
            my={{ base: 0, sm: "auto" }}
            maxHeight={{ base: "100%", md: "90vh" }}
            display="flex"
            flexDirection="column">
            {/* Gradient accent line */}
            <Box h="3px" bgGradient="to-r" gradientFrom="brand.400" gradientVia="brand.600" gradientTo="teal.300"  />
            {/* Flat header */}
            <Box
              px={{ base: 4, sm: 8 }}
              py={5}
              borderBottom="1px solid"
              borderColor={modalHeaderBorderColor}
            >
              <HStack gap={3} align="flex-start">
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><Plus /></Icon>

                <Box>
                  <Box
                    fontSize="lg"
                    fontWeight="800"
                    letterSpacing="-0.02em"
                    color={modalTitleColor}
                  >
                    Create {categoryType === "income" ? "Income" : "Expense"}{" "}
                    Category
                  </Box>
                  <Box
                    fontSize="sm"
                    color={modalSubtitleColor}
                  >
                    Add a new {categoryType} category to organize transactions
                  </Box>
                </Box>
              </HStack>
            </Box>

            <Dialog.Body
              px={{ base: 4, sm: 8 }}
              py={{ base: 4, sm: 6 }}
              flex="1"
              display="flex"
              flexDirection="column"
              overflowY="auto"
              overflowX="hidden"
              justifyContent={{ base: "space-between", sm: "flex-start" }}
            >
              <VStack gap={{ base: 5, sm: 6 }} align="stretch" w="100%">
                {/* Category Name Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Field.Root>
                    <Field.Label fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                      Category Name
                      {categoryName && <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>}
                    </Field.Label>
                    <Input
                      placeholder={`e.g., ${categoryType === "income" ? "Salary, Freelance" : "Groceries, Utilities"}`}
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      size="lg"
                      borderRadius="lg"
                      _hover={{ borderColor: "brand.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      autoFocus
                    />
                             <Field.HelperText mt={2} color={textColorSecondary}>
                               Organize this category under an existing group
                             </Field.HelperText>
                  </Field.Root>
                </Box>

                {/* Category Type Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
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
                      <Checkbox.Root
                        onCheckedChange={(e) => setIsGroupCategory(!!e.checked)}
                        colorPalette="brand"
                        size="lg"
                        checked={isGroupCategory}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Root>
                    </HStack>
                  </Box>
                </Box>

                {/* Parent Category Card (only show if not creating under a specific parent) */}
                {!parentCategoryId && (
                  <Box
                    bg={cardBg}
                    p={{ base: 4, sm: 6 }}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Field.Root>
                      <Field.Label fontWeight="semibold" mb={2}>
                        Parent Category (Optional)
                      </Field.Label>

                      {/* Show loading spinner while fetching group categories */}
                      {isGroupCategoriesLoading && (
                        <Flex justify="center" align="center" py={8}>
                          <VStack gap={3}>
                             <Spinner size="md" color={spinnerColor} borderWidth="3px" />
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
                            <NativeSelect.Root size="lg">
                              <NativeSelect.Field
                                value={parentCategory}
                                onChange={(e) => setParentCategory(e.target.value)}
                                placeholder="Select parent category"
                                borderWidth="2px"
                                borderColor={inputBorderColor}
                                bg={inputBg}
                                borderRadius="lg"
                                _hover={{ borderColor: "brand.300" }}
                                _focus={{
                                  borderColor: focusBorderColor,
                                  boxShadow: `0 0 0 1px ${focusBorderColor}`,
                                }}>
                                {groupCategories.map((category) => (
                                  <option
                                    key={category.category_id}
                                    value={category.category_id}
                                  >
                                    {category.name}
                                  </option>
                                ))}
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                             <Field.HelperText mt={2} color={textColorSecondary}>
                               Organize this category under an existing group
                             </Field.HelperText>
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
                    </Field.Root>
                  </Box>
                )}
              </VStack>

              {/* Mobile-only action buttons that stay at bottom */}
              <Box display={{ base: "block", sm: "none" }} mt={6}>
                <Button
                  onClick={handleSubmit}
                  colorPalette="brand"
                  size="lg"
                  width="100%"
                  mb={3}
                  borderRadius="lg"
                  fontWeight="bold"
                  loading={createCategoryMutation.isPending}
                  disabled={!categoryName || isGroupCategoriesError}
                  loadingText="Creating..."
                >
                  Create Category
                </Button>
                <Button
                  variant="ghost"
                  colorPalette="gray"
                  onClick={onClose}
                  size="lg"
                  width="100%"
                  borderRadius="lg"
                  disabled={createCategoryMutation.isPending}
                >
                  Cancel
                </Button>
              </Box>
            </Dialog.Body>

            {/* Desktop-only footer */}
            <Dialog.Footer
              display={{ base: "none", sm: "flex" }}
              px={8}
              py={6}
              bg={footerBg}
              borderTop="1px solid"
              borderColor={borderColor}
            >
              <Button
                colorPalette="brand"
                mr={3}
                onClick={handleSubmit}
                px={8}
                py={3}
                borderRadius="lg"
                fontWeight="bold"
                loading={createCategoryMutation.isPending}
                disabled={!categoryName || isGroupCategoriesError}
                loadingText="Creating..."
              >
                Create Category
              </Button>
              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={onClose}
                disabled={createCategoryMutation.isPending}
                px={6}
                py={3}
                borderRadius="lg"
              >
                Cancel
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default CreateCategoryModal;
