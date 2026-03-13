import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { toastDefaults } from "./utils";

interface TagItem {
  tag_id?: string;
  name: string;
}

interface FormTagsProps {
  tags: (TagItem | string)[];
  // eslint-disable-next-line no-unused-vars
  setTags: (tags: TagItem[]) => void;
  borderColor: string;
  buttonColorScheme: string;
  onShouldBlockSubmit?: (shouldBlock: boolean) => void;
}

interface ApiErrorResponse {
  detail?: string;
}

const FormTags: React.FC<FormTagsProps> = ({
  tags,
  setTags,
  borderColor,
  onShouldBlockSubmit,
}) => {
  const toast = useToast();
  const [tagSuggestions, setTagSuggestions] = useState<TagItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [tagInput, setTagInput] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const onShouldBlockSubmitRef = useRef(onShouldBlockSubmit);
  onShouldBlockSubmitRef.current = onShouldBlockSubmit;

  const bgColor = useColorModeValue("white", "gray.800");
  const borderDropdownColor = useColorModeValue("gray.100", "gray.700");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const chipBg = useColorModeValue("teal.50", "teal.900");
  const chipBorder = useColorModeValue("teal.200", "teal.700");
  const chipTextColor = useColorModeValue("teal.700", "teal.200");
  const chipRemoveColor = useColorModeValue("teal.500", "teal.400");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");

  const notifyBlockSubmit = (shouldBlock: boolean) => {
    onShouldBlockSubmitRef.current?.(shouldBlock);
  };

  // eslint-disable-next-line no-unused-vars
  const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: Parameters<F>) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const fetchTagSuggestions = useCallback(
    async (query: string): Promise<void> => {
      if (query.length >= 3) {
        try {
          const response = await api.get(`/tags/search?query=${query}`);
          setTagSuggestions(response.data);
          if (response.data.length > 0) {
            setIsOpen(true);
            onShouldBlockSubmitRef.current?.(true);
          }
        } catch (error) {
          const apiError = error as AxiosError<ApiErrorResponse>;
          toast({
            description:
              apiError.response?.data?.detail || "Failed to fetch tag suggestions.",
            status: "error",
            ...toastDefaults,
          });
        }
      } else {
        setTagSuggestions([]);
        setIsOpen(false);
        // Still block if input has text
        onShouldBlockSubmitRef.current?.(query.length > 0);
      }
    },
    [toast]
  );

  const debouncedFetchTagSuggestions = useMemo(
    () => debounce(fetchTagSuggestions, 500),
    [fetchTagSuggestions]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTagSuggestions([]);
        setIsOpen(false);
        setHighlightedIndex(-1);
        // Keep blocking if input still has text
        onShouldBlockSubmitRef.current?.(tagInput.length > 0);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tagInput]);

  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll("[data-suggestion-item]");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const normalizedTags: TagItem[] =
    tags?.map((tag) => {
      if (typeof tag === "string") return { name: tag };
      return tag as TagItem;
    }) || [];

  const addTag = (tag: TagItem): void => {
    if (!normalizedTags.some((t) => t.name.toLowerCase() === tag.name.toLowerCase())) {
      setTags([...normalizedTags, tag]);
    }
    setTagInput("");
    setTagSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    notifyBlockSubmit(false);
  };

  const removeTag = (tagName: string): void => {
    setTags(normalizedTags.filter((tag) => tag.name !== tagName));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    // Always block Enter from bubbling when there's active input or suggestions
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      if (isOpen && highlightedIndex >= 0 && highlightedIndex < tagSuggestions.length) {
        addTag(tagSuggestions[highlightedIndex]);
        return;
      }

      if (isOpen) {
        // Close dropdown without selecting
        setTagSuggestions([]);
        setIsOpen(false);
        setHighlightedIndex(-1);
        notifyBlockSubmit(tagInput.length > 0);
        return;
      }

      // No dropdown — add new tag from input text
      const newTagName = tagInput.trim();
      if (newTagName) {
        addTag({ name: newTagName });
      }
      return;
    }

    if (!isOpen || tagSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < tagSuggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : tagSuggestions.length - 1));
        break;
      case "Escape":
        e.preventDefault();
        setTagSuggestions([]);
        setIsOpen(false);
        setHighlightedIndex(-1);
        notifyBlockSubmit(tagInput.length > 0);
        break;
      case "Tab":
        if (highlightedIndex >= 0 && highlightedIndex < tagSuggestions.length) {
          addTag(tagSuggestions[highlightedIndex]);
        } else {
          setTagSuggestions([]);
          setIsOpen(false);
        }
        break;
    }
  };

  return (
    <FormControl>
      <FormLabel fontWeight="semibold" mb={2}>
        Tags
      </FormLabel>
      <Box ref={containerRef}>
        {/* Selected tag chips — above the input */}
        {normalizedTags.length > 0 && (
          <HStack spacing={2} mb={2} flexWrap="wrap">
            {normalizedTags.map((tag, index) => (
              <HStack
                key={tag.tag_id || `tag-${index}`}
                spacing={1.5}
                px={3}
                py={1}
                bg={chipBg}
                border="1px solid"
                borderColor={chipBorder}
                borderRadius="full"
                fontSize="sm"
                fontWeight="medium"
                color={chipTextColor}
              >
                <Text>{tag.name}</Text>
                <Icon
                  as={X}
                  boxSize={3.5}
                  color={chipRemoveColor}
                  cursor="pointer"
                  onClick={() => removeTag(tag.name)}
                  _hover={{ opacity: 0.7 }}
                />
              </HStack>
            ))}
          </HStack>
        )}

        {/* Input — suggestions pop upward so they're visible at bottom of modal */}
        <Box position="relative">
          <Input
            value={tagInput}
            onChange={(e) => {
              const value = e.target.value;
              setTagInput(value);
              debouncedFetchTagSuggestions(value);
              setHighlightedIndex(-1);
              notifyBlockSubmit(value.length > 0);
              if (value.length < 3) {
                setTagSuggestions([]);
                setIsOpen(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type to search or add tags, press Enter to add"
            borderWidth="2px"
            borderColor={borderColor}
            borderRadius="md"
            _hover={{ borderColor: "teal.300" }}
            _focus={{
              borderColor: focusBorderColor,
              boxShadow: `0 0 0 1px ${focusBorderColor}`,
            }}
            autoComplete="off"
          />

          {isOpen && tagSuggestions.length > 0 && (
            <Box
              ref={listRef}
              position="absolute"
              bottom="calc(100% + 4px)"
              left={0}
              right={0}
              zIndex={20}
              bg={bgColor}
              border="1px solid"
              borderColor={borderDropdownColor}
              borderRadius="md"
              boxShadow="lg"
              maxH="200px"
              overflowY="auto"
            >
              {tagSuggestions.map((tag, i) => (
                <Box
                  key={tag.tag_id || i}
                  data-suggestion-item
                  px={4}
                  py={3}
                  cursor="pointer"
                  bg={i === highlightedIndex ? highlightColor : "transparent"}
                  _hover={{ bg: highlightColor }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(tag);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <Text fontSize="sm" color={textColor}>
                    {tag.name}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <FormHelperText mt={2} color={helperTextColor} fontSize="xs">
          Press Enter to add a custom tag or select from suggestions
        </FormHelperText>
      </Box>
    </FormControl>
  );
};

export default FormTags;
