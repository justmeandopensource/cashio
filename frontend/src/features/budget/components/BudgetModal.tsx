import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Box,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Icon,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Plus, Pencil, Search, ChevronDown, X, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toastDefaults } from "@/components/shared/utils";
import { AxiosError } from "axios";
import { BudgetItemData } from "./BudgetItem";

interface Category {
  category_id: number;
  name: string;
  type: string;
  is_group: boolean;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerId: string;
  period: string;
  mode: "create" | "edit";
  budget?: BudgetItemData;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  ledgerId,
  period,
  mode,
  budget,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState<string>("");
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(period);
  const [amount, setAmount] = useState<string>("");

  const amountRef = useRef<HTMLInputElement>(null);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.750");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("brand.500", "brand.300");
  const helperTextColor = useColorModeValue("gray.400", "gray.500");
  const highlightColor = useColorModeValue("brand.50", "rgba(53, 169, 163, 0.12)");
  const textColorSecondary = useColorModeValue("gray.400", "gray.500");
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalIconBg = useColorModeValue("brand.50", "rgba(53, 169, 163, 0.12)");
  const modalIconColor = useColorModeValue("brand.500", "brand.400");
  const selectedBorderColor = useColorModeValue("brand.400", "brand.400");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["expenseLeafCategories"],
    queryFn: async () => {
      const response = await api.get("/category/list?type=expense&ignore_group=true");
      return response.data;
    },
    enabled: isOpen && mode === "create",
  });

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const selectedCategory = categories.find((c) => String(c.category_id) === categoryId);

  useEffect(() => {
    if (mode === "edit" && budget) {
      setCategoryId(String(budget.category_id));
      setSelectedPeriod(budget.period);
      setAmount(String(budget.amount));
    } else {
      setCategoryId("");
      setCategorySearch("");
      setIsCategoryOpen(false);
      setHighlightedIndex(-1);
      setSelectedPeriod(period);
      setAmount("");
    }
  }, [isOpen, mode, budget, period]);

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isCategoryOpen) {
          setIsCategoryOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => (total === 0 ? -1 : (prev + 1) % total));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isCategoryOpen && total > 0) {
          setHighlightedIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
        }
        break;
      case "Enter":
        if (isCategoryOpen && highlightedIndex >= 0 && highlightedIndex < total) {
          e.preventDefault();
          const cat = filteredCategories[highlightedIndex];
          setCategoryId(String(cat.category_id));
          setCategorySearch("");
          setIsCategoryOpen(false);
          setHighlightedIndex(-1);
          setTimeout(() => amountRef.current?.focus(), 50);
        }
        break;
      case "Escape":
        setIsCategoryOpen(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        setIsCategoryOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/ledger/${ledgerId}/budgets`, {
        category_id: Number(categoryId),
        period: selectedPeriod,
        amount: Number(amount),
      });
      return response.data;
    },
    onSuccess: () => {
      toast({ description: "Budget created.", status: "success", ...toastDefaults });
      queryClient.invalidateQueries({ queryKey: ["budgets", ledgerId] });
      onClose();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        toast({
          description: error.response?.data?.detail || "Failed to create budget.",
          status: "error",
          ...toastDefaults,
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/ledger/${ledgerId}/budgets/${budget!.budget_id}`, {
        amount: Number(amount),
      });
      return response.data;
    },
    onSuccess: () => {
      toast({ description: "Budget updated.", status: "success", ...toastDefaults });
      queryClient.invalidateQueries({ queryKey: ["budgets", ledgerId] });
      onClose();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        toast({
          description: error.response?.data?.detail || "Failed to update budget.",
          status: "error",
          ...toastDefaults,
        });
      }
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const isSubmitDisabled =
    !amount ||
    Number(amount) <= 0 ||
    (mode === "create" && !categoryId) ||
    isPending;

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast({ description: "Please enter a valid amount.", status: "warning", ...toastDefaults });
      return;
    }
    if (mode === "create" && !categoryId) {
      toast({ description: "Please select a category.", status: "warning", ...toastDefaults });
      return;
    }
    if (mode === "create") {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  };

  const isCreate = mode === "create";

  // Keep ref in sync so the keydown effect never captures a stale handleSubmit
  const handleSubmitRef = useRef<() => void>(() => {});
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCategoryOpen) {
          e.stopPropagation();
          setIsCategoryOpen(false);
          setHighlightedIndex(-1);
          return;
        }
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        if (isCategoryOpen) return;
        if (isSubmitDisabled) return;
        e.preventDefault();
        handleSubmitRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, isCategoryOpen, isSubmitDisabled, onClose]);

  return (
    <Modal isOpen={isOpen} returnFocusOnClose={false} onClose={onClose} size={{ base: "full", sm: "xl" }} motionPreset="slideInBottom">
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.400" />
      <ModalContent
        bg={bgColor}
        borderRadius={{ base: 0, sm: "xl" }}
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: 4 }}
        my={{ base: 0, sm: "auto" }}
        maxHeight={{ base: "100%", md: "90vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Gradient accent line */}
        <Box
          h="3px"
          bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
        />
        {/* Header */}
        <Box px={{ base: 4, sm: 8 }} py={5} borderBottom="1px solid" borderColor={borderColor}>
          <HStack spacing={3} align="center">
            <Box
              p={2}
              borderRadius="xl"
              bg={modalIconBg}
            >
              <Icon as={isCreate ? Plus : Pencil} boxSize={4} color={modalIconColor} />
            </Box>
            <Box>
              <Text fontSize="lg" fontWeight="bold" color={modalTitleColor} letterSpacing="-0.02em">
                {isCreate ? "Add Budget" : "Edit Budget"}
              </Text>
              <Text fontSize="sm" color={textColorSecondary}>
                {isCreate ? "Set a spending limit for a category" : "Update the spending limit"}
              </Text>
            </Box>
          </HStack>
        </Box>

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          display="flex"
          flexDirection="column"
          overflowY="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack spacing={4} align="stretch" w="100%">
            {/* Category */}
            <Box bg={cardBg} p={{ base: 4, sm: 5 }} borderRadius="xl" border="1px solid" borderColor={borderColor}>
              <FormControl>
                <FormLabel fontWeight="semibold" fontSize="sm" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Category
                  {isCreate && categoryId && <Icon as={Check} boxSize={3.5} color="brand.500" />}
                </FormLabel>
                {isCreate ? (
                  <Popover
                    isOpen={isCategoryOpen}
                    onClose={() => { setIsCategoryOpen(false); setHighlightedIndex(-1); }}
                    matchWidth
                    placement="bottom-start"
                    autoFocus={false}
                    returnFocusOnClose={false}
                  >
                    <PopoverTrigger>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none" height="100%">
                          <Icon as={Search} boxSize={4} color={helperTextColor} />
                        </InputLeftElement>
                        <Input
                          value={isCategoryOpen ? categorySearch : (selectedCategory?.name ?? "")}
                          onChange={(e) => {
                            setCategorySearch(e.target.value);
                            setCategoryId("");
                            setHighlightedIndex(-1);
                            setIsCategoryOpen(true);
                          }}
                          onFocus={() => {
                            setCategorySearch("");
                            setHighlightedIndex(-1);
                            setIsCategoryOpen(true);
                          }}
                          onKeyDown={handleCategoryKeyDown}
                          placeholder="Search categories..."
                          borderWidth="2px"
                          borderColor={categoryId ? selectedBorderColor : inputBorderColor}
                          bg={inputBg}
                          borderRadius="lg"
                          _hover={{ borderColor: "brand.300" }}
                          _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
                          autoComplete="off"
                          autoFocus
                        />
                        <InputRightElement height="100%" pr={1}>
                          {categoryId ? (
                            <Icon
                              as={X}
                              boxSize={4}
                              color={helperTextColor}
                              cursor="pointer"
                              onClick={() => {
                                setCategoryId("");
                                setCategorySearch("");
                                setIsCategoryOpen(false);
                                setHighlightedIndex(-1);
                              }}
                            />
                          ) : (
                            <Icon
                              as={ChevronDown}
                              boxSize={4}
                              color={helperTextColor}
                              cursor="pointer"
                              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            />
                          )}
                        </InputRightElement>
                      </InputGroup>
                    </PopoverTrigger>
                    <PopoverContent
                      p={0}
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="xl"
                      boxShadow="0 4px 20px rgba(0,0,0,0.08)"
                      maxH="220px"
                      overflowY="auto"
                      _focus={{ outline: "none" }}
                    >
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat, i) => (
                          <Box
                            key={cat.category_id}
                            px={4}
                            py={2.5}
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            bg={String(cat.category_id) === categoryId || i === highlightedIndex ? highlightColor : "transparent"}
                            _hover={{ bg: highlightColor }}
                            transition="background 0.1s ease"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCategoryId(String(cat.category_id));
                              setCategorySearch("");
                              setIsCategoryOpen(false);
                              setHighlightedIndex(-1);
                              setTimeout(() => amountRef.current?.focus(), 50);
                            }}
                          >
                            <Text fontSize="sm" fontWeight={String(cat.category_id) === categoryId ? "semibold" : "normal"}>
                              {cat.name}
                            </Text>
                            {String(cat.category_id) === categoryId && (
                              <Icon as={Check} boxSize={4} color="brand.500" />
                            )}
                          </Box>
                        ))
                      ) : (
                        <Box px={4} py={5} textAlign="center">
                          <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                        </Box>
                      )}
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Text fontWeight="medium" fontSize="md" color={modalTitleColor}>
                    {budget?.category_name}
                  </Text>
                )}
              </FormControl>
            </Box>

            {/* Period */}
            <Box bg={cardBg} p={{ base: 4, sm: 5 }} borderRadius="xl" border="1px solid" borderColor={borderColor}>
              <FormControl>
                <FormLabel fontWeight="semibold" fontSize="sm" mb={2}>Period</FormLabel>
                {isCreate ? (
                  <Select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    size="lg"
                    borderRadius="lg"
                    _hover={{ borderColor: "brand.300" }}
                    _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                ) : (
                  <Text fontWeight="medium" fontSize="md" color={modalTitleColor} textTransform="capitalize">
                    {budget?.period}
                  </Text>
                )}
              </FormControl>
            </Box>

            {/* Amount */}
            <Box bg={cardBg} p={{ base: 4, sm: 5 }} borderRadius="xl" border="1px solid" borderColor={borderColor}>
              <FormControl>
                <FormLabel fontWeight="semibold" fontSize="sm" mb={2} display="flex" alignItems="center" gap={1.5}>
                  Limit Amount
                  {amount && Number(amount) > 0 && <Icon as={Check} boxSize={3.5} color="brand.500" />}
                </FormLabel>
                <NumberInput value={amount} onChange={(val) => setAmount(val)} min={0.01} precision={2}>
                  <NumberInputField
                    ref={amountRef}
                    placeholder="e.g. 500.00"
                    borderWidth="2px"
                    borderColor={inputBorderColor}
                    bg={inputBg}
                    borderRadius="lg"
                    h="3rem"
                    fontSize="md"
                    _hover={{ borderColor: "brand.300" }}
                    _focus={{ borderColor: focusBorderColor, boxShadow: `0 0 0 1px ${focusBorderColor}` }}
                    autoFocus={mode === "edit"}
                  />
                </NumberInput>
              </FormControl>
            </Box>
          </VStack>

          {/* Mobile buttons */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              isLoading={isPending}
              loadingText={isCreate ? "Creating..." : "Saving..."}
              onClick={handleSubmit}
            >
              {isCreate ? "Add Budget" : "Save Changes"}
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="lg"
              isDisabled={isPending}
            >
              Cancel
            </Button>
          </Box>
        </ModalBody>

        {/* Desktop footer */}
        <ModalFooter
          display={{ base: "none", sm: "flex" }}
          px={8}
          py={5}
          bg={footerBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            px={8}
            borderRadius="lg"
            isLoading={isPending}
            loadingText={isCreate ? "Creating..." : "Saving..."}
          >
            {isCreate ? "Add Budget" : "Save Changes"}
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={isPending}
            px={6}
            borderRadius="lg"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BudgetModal;
