import React, { useCallback, useMemo, useRef, useState } from "react";
import { useColorModeValue } from "../../../components/ui/color-mode";
import { Input, Box, Text, Popover, Field } from "@chakra-ui/react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { notify } from "@/components/shared/notify";

interface FormMutualFundSuggestionFieldProps {
  ledgerId: string;
  field: "plan" | "owner";
  label: string;
  value: string;
   
  setValue: (value: string) => void;
  placeholder: string;
  helperText?: string;
  borderColor: string;
  inputBg?: string;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

interface ApiErrorResponse {
  detail?: string;
}

const FormMutualFundSuggestionField: React.FC<FormMutualFundSuggestionFieldProps> = ({
  ledgerId,
  field,
  label,
  value,
  setValue,
  placeholder,
  helperText,
  borderColor,
  inputBg,
  onDropdownOpenChange,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const onDropdownOpenChangeRef = useRef(onDropdownOpenChange);
  onDropdownOpenChangeRef.current = onDropdownOpenChange;

  const bgColor = useColorModeValue("white", "gray.800");
  const borderDropdownColor = useColorModeValue("gray.100", "gray.700");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColor = useColorModeValue("gray.700", "gray.200");

  const openDropdown = (open: boolean) => {
    setIsOpen(open);
    onDropdownOpenChangeRef.current?.(open);
  };

   
  const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: Parameters<F>) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const fetchSuggestions = useCallback(
    async (search_text: string) => {
      if (search_text.length >= 3) {
        try {
          const response = await api.get(
            `/ledger/${ledgerId}/mutual-fund/${field}/suggestions`,
            { params: { search_text } }
          );
          const results = Array.from(new Set(response.data as string[]));
          setSuggestions(results);
          if (results.length > 0) {
            setIsOpen(true);
            onDropdownOpenChangeRef.current?.(true);
          }
        } catch (error) {
          const apiError = error as AxiosError<ApiErrorResponse>;
          notify({
            description:
              apiError.response?.data?.detail || `Failed to fetch ${field} suggestions.`,
            status: "error",
          });
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
        onDropdownOpenChangeRef.current?.(false);
      }
    },
    [ledgerId, field]
  );

  const debouncedFetch = useMemo(
    () => debounce(fetchSuggestions, 500),
    [fetchSuggestions]
  );

  const selectSuggestion = (val: string) => {
    setValue(val);
    setSuggestions([]);
    openDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        e.stopPropagation();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectSuggestion(suggestions[highlightedIndex]);
        } else {
          setSuggestions([]);
          openDropdown(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setSuggestions([]);
        openDropdown(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectSuggestion(suggestions[highlightedIndex]);
        } else {
          setSuggestions([]);
          openDropdown(false);
        }
        break;
    }
  };

  return (
    <Field.Root flex={1}>
      <Field.Label fontWeight="semibold" mb={2}>
        {label}
      </Field.Label>
      <Popover.Root
        open={isOpen && suggestions.length > 0}
        autoFocus={false}
        onOpenChange={e => {
          if (!(e.open)) { setSuggestions([]); openDropdown(false); setHighlightedIndex(-1); }
        }}
        positioning={{
          sameWidth: true,
          placement: 'bottom-start'
        }}>
        <Popover.Trigger asChild>
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              debouncedFetch(e.target.value);
              setHighlightedIndex(-1);
              if (e.target.value.length < 3) {
                setSuggestions([]);
                openDropdown(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            borderWidth="2px"
            borderColor={borderColor}
            borderRadius="md"
            bg={inputBg}
            size="lg"
            _hover={{ borderColor: "teal.300" }}
            _focus={{
              borderColor: focusBorderColor,
              boxShadow: `0 0 0 1px ${focusBorderColor}`,
            }}
            autoComplete="off"
          />
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content w="full" p={0}
          bg={bgColor}
          border="1px solid"
          borderColor={borderDropdownColor}
          borderRadius="md"
          boxShadow="lg"
          maxH="200px"
          overflowY="auto"
          _focus={{ outline: "none" }}>{suggestions.map((suggestion, i) => (
            <Box
              key={i}
              px={4}
              py={3}
              cursor="pointer"
              bg={i === highlightedIndex ? highlightColor : "transparent"}
              _hover={{ bg: highlightColor }}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(i)}
            >
              <Text fontSize="sm" color={textColor}>
                {suggestion}
              </Text>
            </Box>
          ))}</Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
      {helperText && (
        <Field.HelperText>{helperText}</Field.HelperText>
      )}
    </Field.Root>
  );
};

export default FormMutualFundSuggestionField;
