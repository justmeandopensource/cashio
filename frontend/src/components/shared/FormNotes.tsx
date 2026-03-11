import React, { useCallback, useMemo, useState } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  Box,
  useColorModeValue,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { toastDefaults } from "./utils";

// Define props interface
interface FormNotesProps {
  ledgerId: string;
  notes: string;
  // eslint-disable-next-line no-unused-vars
  setNotes: (notes: string) => void;
  borderColor: string;
}

// Define interface for API response error
interface ApiErrorResponse {
  detail?: string;
}

const FormNotes: React.FC<FormNotesProps> = ({
  ledgerId,
  notes,
  setNotes,
  borderColor,
}) => {
  const toast = useToast();
  const [noteSuggestions, setNoteSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const notesSuggestionsBoxBgColor = useColorModeValue("gray.50", "gray.700");
  const notesSuggestionsBoxItemBgColor = useColorModeValue(
    "gray.100",
    "gray.600"
  );
  const notesSuggestionsBoxItemHighlightBgColor = useColorModeValue(
    "teal.100",
    "teal.700"
  );

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

  const fetchNoteSuggestions = useCallback(
    async (search_text: string) => {
      if (search_text.length >= 3) {
        try {
          const response = await api.get(
            `/ledger/${ledgerId}/transaction/notes/suggestions`,
            {
              params: { search_text },
            }
          );
          setNoteSuggestions(Array.from(new Set(response.data)));
        } catch (error) {
          const apiError = error as AxiosError<ApiErrorResponse>;
          toast({
            description:
              apiError.response?.data?.detail ||
              "Failed to fetch note suggestions.",
            status: "error",
            ...toastDefaults,
          });
        }
      } else {
        setNoteSuggestions([]);
      }
    },
    [ledgerId, toast, setNoteSuggestions]
  );

  const debouncedFetchNoteSuggestions = useMemo(
    () => debounce(fetchNoteSuggestions, 500),
    [fetchNoteSuggestions]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (noteSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < noteSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : noteSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < noteSuggestions.length) {
          setNotes(noteSuggestions[highlightedIndex]);
          setNoteSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setNoteSuggestions([]);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        if (highlightedIndex >= 0 && highlightedIndex < noteSuggestions.length) {
          setNotes(noteSuggestions[highlightedIndex]);
          setNoteSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  return (
    <FormControl mb={4}>
      <FormLabel fontSize="sm" fontWeight="medium">
        Notes
      </FormLabel>
        <Popover
          isOpen={noteSuggestions.length > 0}
          onClose={() => {
            setNoteSuggestions([]);
            setHighlightedIndex(-1);
          }}
          placement="bottom-start"
          matchWidth
          closeOnBlur={false}
          returnFocusOnClose={false}
        >
          <PopoverTrigger>
            <Input
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                debouncedFetchNoteSuggestions(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => {
                handleKeyDown(e);
                e.stopPropagation();
              }}
              placeholder="Description (optional)"
              borderColor={borderColor}
            />
          </PopoverTrigger>
        <PopoverContent
          borderColor={borderColor}
          bg={notesSuggestionsBoxBgColor}
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
            {noteSuggestions.map((note, index) => (
              <Box
                key={index}
                p={2}
                cursor="pointer"
                borderRadius="md"
                bg={index === highlightedIndex ? notesSuggestionsBoxItemHighlightBgColor : "transparent"}
                _hover={{
                  bg: notesSuggestionsBoxItemBgColor,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setNotes(note);
                  setNoteSuggestions([]);
                  setHighlightedIndex(-1);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {note}
              </Box>
            ))}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </FormControl>
  );
};

export default FormNotes;
