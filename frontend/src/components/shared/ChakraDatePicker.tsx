import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Input, NativeSelect, IconButton } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

interface ChakraDatePickerProps {
  selected: Date | null;
   
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  minDate?: Date | null;
  shouldCloseOnSelect?: boolean;
  "data-testid"?: string;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toSmartLabel = (date: Date | null): string => {
  if (!date) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays > 0 && diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });

  const opts: Intl.DateTimeFormatOptions =
    date.getFullYear() === today.getFullYear()
      ? { weekday: "short", month: "short", day: "numeric" }
      : { weekday: "short", month: "short", day: "numeric", year: "numeric" };

  return date.toLocaleDateString("en-US", opts);
};

const CustomInput = React.forwardRef<
  HTMLInputElement,
  { value?: string; onClick?: () => void; "data-testid"?: string; displayValue?: string }
>(({ value, onClick, "data-testid": testId, displayValue }, ref) => (
  <Input
    onClick={onClick}
    ref={ref}
    value={displayValue ?? value}
    readOnly
    data-testid={testId}
  />
));
CustomInput.displayName = "CustomInput";

const ChakraDatePicker: React.FC<ChakraDatePickerProps> = ({
  selected,
  onChange,
  placeholderText,
  minDate = null,
  shouldCloseOnSelect = true,
  "data-testid": testId,
}) => {
  const renderCustomHeader = (params: any) => {
    const {
      date,
      changeYear,
      changeMonth,
      decreaseMonth,
      increaseMonth,
      prevMonthButtonDisabled,
      nextMonthButtonDisabled,
    } = params;
    const years = Array.from({ length: 200 }, (_, i) => new Date().getFullYear() - 100 + i);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    return (
      <div
        style={{
          margin: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <IconButton
          aria-label="Previous Month"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          size="sm"
          variant="ghost"><LuChevronLeft /></IconButton>
        <NativeSelect.Root size="sm" minWidth="80px" mx={1}>
          <NativeSelect.Field
            value={new Date(date).getFullYear()}
            onChange={({ target: { value } }) => changeYear(Number(value))}>
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <NativeSelect.Root size="sm" minWidth="70px" mx={1}>
          <NativeSelect.Field
            value={months[new Date(date).getMonth()]}
            onChange={({ target: { value } }) =>
              changeMonth(months.indexOf(value))
            }>
            {months.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <IconButton
          aria-label="Next Month"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          size="sm"
          variant="ghost"><LuChevronRight /></IconButton>
      </div>
    );
  };

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="yyyy/MM/dd"
      customInput={<CustomInput data-testid={testId} displayValue={toSmartLabel(selected)} />}
      showPopperArrow={false}
      popperPlacement="bottom-start"
      popperModifiers={
        {
          offset: {
            enabled: true,
            offset: "5px, 10px",
          },
          preventOverflow: {
            enabled: true,
            escapeWithReference: false,
            boundariesElement: "viewport",
          },
        } as any
      }
      placeholderText={placeholderText}
      minDate={minDate === null ? undefined : minDate}
      shouldCloseOnSelect={shouldCloseOnSelect}
      renderCustomHeader={renderCustomHeader}
    />
  );
};

export default ChakraDatePicker;
