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
interface FormLocationProps {
  ledgerId: string;
  location: string;
  // eslint-disable-next-line no-unused-vars
  setLocation: (location: string) => void;
  borderColor: string;
}

// Define interface for API response error
interface ApiErrorResponse {
  detail?: string;
}

const FormLocation: React.FC<FormLocationProps> = ({
  ledgerId,
  location,
  setLocation,
  borderColor,
}) => {
  const toast = useToast();
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const locationSuggestionsBoxBgColor = useColorModeValue("gray.50", "gray.700");
  const locationSuggestionsBoxItemBgColor = useColorModeValue(
    "gray.100",
    "gray.600"
  );
  const locationSuggestionsBoxItemHighlightBgColor = useColorModeValue(
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

  const fetchLocationSuggestions = useCallback(
    async (search_text: string) => {
      if (search_text.length >= 3) {
        try {
          const response = await api.get(
            `/ledger/${ledgerId}/transaction/location/suggestions`,
            {
              params: { search_text },
            }
          );
          setLocationSuggestions(Array.from(new Set(response.data)));
        } catch (error) {
          const apiError = error as AxiosError<ApiErrorResponse>;
          toast({
            description:
              apiError.response?.data?.detail ||
              "Failed to fetch location suggestions.",
            status: "error",
            ...toastDefaults,
          });
        }
      } else {
        setLocationSuggestions([]);
      }
    },
    [ledgerId, toast, setLocationSuggestions]
  );

  const debouncedFetchLocationSuggestions = useMemo(
    () => debounce(fetchLocationSuggestions, 500),
    [fetchLocationSuggestions]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (locationSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < locationSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < locationSuggestions.length) {
          setLocation(locationSuggestions[highlightedIndex]);
          setLocationSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setLocationSuggestions([]);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        if (highlightedIndex >= 0 && highlightedIndex < locationSuggestions.length) {
          setLocation(locationSuggestions[highlightedIndex]);
          setLocationSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  return (
    <FormControl mb={4}>
      <FormLabel fontSize="sm" fontWeight="medium">
        Location
      </FormLabel>
        <Popover
          isOpen={locationSuggestions.length > 0}
          onClose={() => {
            setLocationSuggestions([]);
            setHighlightedIndex(-1);
          }}
          placement="bottom-start"
          matchWidth
          closeOnBlur={false}
          returnFocusOnClose={false}
        >
          <PopoverTrigger>
            <Input
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                debouncedFetchLocationSuggestions(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => {
                handleKeyDown(e);
                e.stopPropagation();
              }}
              placeholder="Location (optional)"
              borderColor={borderColor}
            />
          </PopoverTrigger>
        <PopoverContent
          borderColor={borderColor}
          bg={locationSuggestionsBoxBgColor}
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
            {locationSuggestions.map((locationSuggestion, index) => (
              <Box
                key={index}
                p={2}
                cursor="pointer"
                borderRadius="md"
                bg={index === highlightedIndex ? locationSuggestionsBoxItemHighlightBgColor : "transparent"}
                _hover={{
                  bg: locationSuggestionsBoxItemBgColor,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setLocation(locationSuggestion);
                  setLocationSuggestions([]);
                  setHighlightedIndex(-1);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {locationSuggestion}
              </Box>
            ))}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </FormControl>
  );
};

export default FormLocation;