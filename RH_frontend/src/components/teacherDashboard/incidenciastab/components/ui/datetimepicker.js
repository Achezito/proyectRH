// teacherDashboard/incidenciastab/components/ui/DatePickerWeb.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";

const DatePickerWeb = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  locale = "es",
}) => {
  const handleDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    onChange(
      { type: "set", nativeEvent: { timestamp: selectedDate.getTime() } },
      selectedDate
    );
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const minDate = minimumDate ? formatDateForInput(minimumDate) : "";
  const maxDate = maximumDate ? formatDateForInput(maximumDate) : "";
  const selectedDate = formatDateForInput(value);

  return (
    <View style={styles.container}>
      <input
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        min={minDate}
        max={maxDate}
        style={styles.dateInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  dateInput: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
});

export default DatePickerWeb;
