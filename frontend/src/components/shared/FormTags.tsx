import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Tag,
  TagCloseButton,
  TagLabel,
  useColorModeValue,
  useToast,
  Wrap,
  WrapItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { toastDefaults } from "./utils";

// Define interfaces for the component
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
}

// Define interface for API response error
interface ApiErrorResponse {
  detail?: string;
}

const FormTags: React.FC<FormTagsProps> = ({
  tags,
  setTags,
  borderColor,
  buttonColorScheme,
}) => {
  const toast = useToast();
  const [tagSuggestions, setTagSuggestions] = useState<TagItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const tagsSuggestionsBoxBgColor = useColorModeValue("gray.50", "gray.700");
  const tagsSuggestionsBoxItemBgColor = useColorModeValue(
    "gray.100",
    "gray.600"
  );
  const tagsSuggestionsBoxItemHighlightBgColor = useColorModeValue(
    "teal.100",
    "teal.700"
  );
  const [tagInput, setTagInput] = useState<string>("");

  // eslint-disable-next-line no-unused-vars
  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    delay: number
  ) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return function (this: any, ...args: Parameters<F>) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  // Fetch tag suggestions from the backend
  const fetchTagSuggestions = useCallback(
    async (query: string): Promise<void> => {
      if (query.length >= 3) {
        try {
          const response = await api.get(`/tags/search?query=${query}`);
          setTagSuggestions(response.data);
        } catch (error) {
          const apiError = error as AxiosError<ApiErrorResponse>;
          toast({
            description:
              apiError.response?.data?.detail ||
              "Failed to fetch tag suggestions.",
            status: "error",
            ...toastDefaults,
          });
        }
      } else {
        setTagSuggestions([]);
      }
    },
    [toast, setTagSuggestions]
  );

  const debouncedFetchTagSuggestions = useMemo(
    () => debounce(fetchTagSuggestions, 500),
    [fetchTagSuggestions]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (tagSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < tagSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : tagSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < tagSuggestions.length) {
          addTag(tagSuggestions[highlightedIndex]);
          setTagInput("");
          setTagSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setTagSuggestions([]);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Ensure all tags have a valid name property
  const normalizedTags: TagItem[] =
    tags?.map((tag) => {
      if (typeof tag === "string") {
        return { name: tag };
      }
      return tag as TagItem;
    }) || [];

  // Add a tag to the selected tags list
  const addTag = (tag: TagItem): void => {
    if (
      !normalizedTags.some(
        (t) => t.tag_id === tag.tag_id && t.name === tag.name
      )
    ) {
      setTags([...normalizedTags, tag]);
      setTagInput("");
      setTagSuggestions([]);
    }
  };

  // Remove a tag from the selected tags list
  const removeTag = (tagName: string): void => {
    setTags(normalizedTags.filter((tag) => tag.name !== tagName));
  };

  // Handle Enter key press in the tags input field
  const handleTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLElement>
  ): void => {
    // Handle suggestion navigation first
    handleKeyDown(e);

    // Handle Enter for creating new tag (only if no suggestion is highlighted)
    if (e.key === "Enter" && highlightedIndex === -1) {
      e.preventDefault();
      const newTagName = tagInput.trim();

      if (newTagName) {
        // Check if the tag already exists in the selected tags
        const isTagAlreadyAdded = normalizedTags.some(
          (tag) => tag.name.toLowerCase() === newTagName.toLowerCase()
        );

        if (!isTagAlreadyAdded) {
          // Add the new tag to the selected tags
          const newTag: TagItem = { name: newTagName };
          setTags([...normalizedTags, newTag]);
          setTagInput("");
          setTagSuggestions([]);
        }
      }
    }
  };

  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="medium">
        Tags
      </FormLabel>
      <Box>
        {/* Display selected tags as chips */}
        <Wrap spacing={2} mb={2}>
          {normalizedTags.map((tag, index) => (
            <WrapItem key={tag.tag_id || `tag-${index}`}>
              <Tag
                size="sm"
                borderRadius="full"
                variant="solid"
                colorScheme={buttonColorScheme}
              >
                <TagLabel>{tag.name}</TagLabel>
                <TagCloseButton onClick={() => removeTag(tag.name)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>

        {/* Tag input with suggestions */}
        <Popover
          isOpen={tagSuggestions.length > 0}
          onClose={() => {
            setTagSuggestions([]);
            setHighlightedIndex(-1);
          }}
          placement="bottom-start"
          matchWidth
          closeOnBlur={false}
          returnFocusOnClose={false}
        >
          <PopoverTrigger>
            <Input
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                debouncedFetchTagSuggestions(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => {
                handleKeyDown(e);
                handleTagInputKeyDown(e);
              }}
              placeholder="Add tags (press Enter)"
              borderColor={borderColor}
              size="md"
            />
          </PopoverTrigger>
          <PopoverContent
            borderColor={borderColor}
            bg={tagsSuggestionsBoxBgColor}
            shadow="lg"
            maxH="200px"
            overflowY="auto"
            _focus={{ boxShadow: "none" }}
            autoFocus={false}
            onKeyDown={(e) => {
              handleKeyDown(e);
              e.stopPropagation();
            }}
          >
            <PopoverBody p={1}>
              {tagSuggestions.map((tag, index) => (
                <Box
                  key={tag.tag_id}
                  p={2}
                  cursor="pointer"
                  borderRadius="md"
                  bg={index === highlightedIndex ? tagsSuggestionsBoxItemHighlightBgColor : "transparent"}
                  _hover={{
                    bg: tagsSuggestionsBoxItemBgColor,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(tag);
                    setTagInput("");
                    setTagSuggestions([]);
                    setHighlightedIndex(-1);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {tag.name}
                </Box>
              ))}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>
    </FormControl>
  );
};

export default FormTags;
