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
interface FormStoreProps {
  ledgerId: string;
  store: string;
  // eslint-disable-next-line no-unused-vars
  setStore: (store: string) => void;
  borderColor: string;
}

// Define interface for API response error
interface ApiErrorResponse {
  detail?: string;
}

const FormStore: React.FC<FormStoreProps> = ({
  ledgerId,
  store,
  setStore,
  borderColor,
}) => {
  const toast = useToast();
  const [storeSuggestions, setStoreSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const storeSuggestionsBoxBgColor = useColorModeValue("gray.50", "gray.700");
  const storeSuggestionsBoxItemBgColor = useColorModeValue(
    "gray.100",
    "gray.600"
  );
  const storeSuggestionsBoxItemHighlightBgColor = useColorModeValue(
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

  const fetchStoreSuggestions = useCallback(
    async (search_text: string) => {
      if (search_text.length >= 3) {
        try {
          const response = await api.get(
            `/ledger/${ledgerId}/transaction/store/suggestions`,
            {
              params: { search_text },
            }
          );
          setStoreSuggestions(Array.from(new Set(response.data)));
        } catch (error) {
          const apiError = error as AxiosError<ApiErrorResponse>;
          toast({
            description:
              apiError.response?.data?.detail ||
              "Failed to fetch store suggestions.",
            status: "error",
            ...toastDefaults,
          });
        }
      } else {
        setStoreSuggestions([]);
      }
    },
    [ledgerId, toast, setStoreSuggestions]
  );

  const debouncedFetchStoreSuggestions = useMemo(
    () => debounce(fetchStoreSuggestions, 500),
    [fetchStoreSuggestions]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (storeSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < storeSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : storeSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < storeSuggestions.length) {
          setStore(storeSuggestions[highlightedIndex]);
          setStoreSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setStoreSuggestions([]);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        if (highlightedIndex >= 0 && highlightedIndex < storeSuggestions.length) {
          setStore(storeSuggestions[highlightedIndex]);
          setStoreSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  return (
    <FormControl mb={4}>
      <FormLabel fontSize="sm" fontWeight="medium">
        Store
      </FormLabel>
        <Popover
          isOpen={storeSuggestions.length > 0}
          onClose={() => {
            setStoreSuggestions([]);
            setHighlightedIndex(-1);
          }}
          placement="bottom-start"
          matchWidth
          closeOnBlur={false}
          returnFocusOnClose={false}
        >
          <PopoverTrigger>
            <Input
              value={store}
              onChange={(e) => {
                setStore(e.target.value);
                debouncedFetchStoreSuggestions(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => {
                handleKeyDown(e);
                e.stopPropagation();
              }}
              placeholder="Store name (optional)"
              borderColor={borderColor}
            />
          </PopoverTrigger>
        <PopoverContent
          borderColor={borderColor}
          bg={storeSuggestionsBoxBgColor}
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
            {storeSuggestions.map((storeSuggestion, index) => (
              <Box
                key={index}
                p={2}
                cursor="pointer"
                borderRadius="md"
                bg={index === highlightedIndex ? storeSuggestionsBoxItemHighlightBgColor : "transparent"}
                _hover={{
                  bg: storeSuggestionsBoxItemBgColor,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setStore(storeSuggestion);
                  setStoreSuggestions([]);
                  setHighlightedIndex(-1);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {storeSuggestion}
              </Box>
            ))}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </FormControl>
  );
};

export default FormStore;