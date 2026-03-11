import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Input, Select, IconButton } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

interface ChakraDatePickerProps {
  selected: Date | null;
  // eslint-disable-next-line no-unused-vars
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  minDate?: Date | null;
  shouldCloseOnSelect?: boolean;
  "data-testid"?: string;
}

const CustomInput = React.forwardRef<
  HTMLInputElement,
  { value?: string; onClick?: () => void; "data-testid"?: string }
>(({ value, onClick, "data-testid": testId }, ref) => (
  <Input
    onClick={onClick}
    ref={ref}
    value={value}
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
          icon={<ChevronLeftIcon />}
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          size="sm"
          variant="ghost"
        />
        <Select
          value={new Date(date).getFullYear()}
          onChange={({ target: { value } }) => changeYear(Number(value))}
          size="sm"
          minWidth="80px"
          mx={1}
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select
          value={months[new Date(date).getMonth()]}
          onChange={({ target: { value } }) =>
            changeMonth(months.indexOf(value))
          }
          size="sm"
          minWidth="70px"
          mx={1}
        >
          {months.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <IconButton
          aria-label="Next Month"
          icon={<ChevronRightIcon />}
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          size="sm"
          variant="ghost"
        />
      </div>
    );
  };

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="yyyy/MM/dd"
      customInput={<CustomInput data-testid={testId} />}
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
