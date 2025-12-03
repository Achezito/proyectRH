// src/components/DatePickerModal.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react-native";

const DatePickerModal = ({
  visible,
  onClose,
  onDateSelect,
  initialDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [manualDate, setManualDate] = useState(formatDateForInput(initialDate));

  // Formatear fecha para input
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Parsear fecha desde input
  function parseDateFromInput(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // Generar días del mes
  const generateDays = () => {
    const days = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Días del mes anterior (para completar la primera semana)
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, day),
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({
        day: i,
        isCurrentMonth: true,
        date,
        isSelected: date.toDateString() === selectedDate.toDateString(),
      });
    }

    // Días del próximo mes (para completar la última semana)
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = days.length + 1; i <= totalCells; i++) {
      const day = i - days.length;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, day),
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDaySelect = (date) => {
    setSelectedDate(date);
    setManualDate(formatDateForInput(date));
  };

  const handleManualDateChange = (text) => {
    setManualDate(text);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      try {
        const date = parseDateFromInput(text);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          setCurrentMonth(date.getMonth());
          setCurrentYear(date.getFullYear());
        }
      } catch (error) {
        console.error("Fecha inválida:", error);
      }
    }
  };

  const handleConfirm = () => {
    onDateSelect(selectedDate);
    onClose();
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setManualDate(formatDateForInput(today));
  };

  const days = generateDays();
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Selector de mes/año */}
          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={handlePrevMonth}
              >
                <ChevronLeft size={24} color="#374151" />
              </TouchableOpacity>

              <View style={styles.monthDisplay}>
                <Text style={styles.monthText}>{monthNames[currentMonth]}</Text>
                <Text style={styles.yearText}>{currentYear}</Text>
              </View>

              <TouchableOpacity
                style={styles.monthButton}
                onPress={handleNextMonth}
              >
                <ChevronRight size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Input manual para fecha (útil en web) */}
            <View style={styles.manualInputContainer}>
              <Text style={styles.manualInputLabel}>
                O ingresa la fecha manualmente:
              </Text>
              <TextInput
                style={styles.manualInput}
                value={manualDate}
                onChangeText={handleManualDateChange}
                placeholder="AAAA-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Días de la semana */}
            <View style={styles.weekDays}>
              {dayNames.map((day) => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendario */}
            <View style={styles.calendarGrid}>
              {days.map((dayInfo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !dayInfo.isCurrentMonth && styles.dayCellOtherMonth,
                    dayInfo.isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => handleDaySelect(dayInfo.date)}
                  disabled={!dayInfo.isCurrentMonth}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !dayInfo.isCurrentMonth && styles.dayTextOtherMonth,
                      dayInfo.isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {dayInfo.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fecha seleccionada */}
            <View style={styles.selectedDateContainer}>
              <Calendar size={20} color="#059669" />
              <Text style={styles.selectedDateText}>
                {selectedDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
              <Text style={styles.todayButtonText}>Hoy</Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Seleccionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: Platform.OS === "web" ? 400 : "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  monthDisplay: {
    alignItems: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  yearText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  manualInputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  manualInputLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  weekDays: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
  },
  dayCell: {
    width: "14.28%", // 100% / 7 días
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellOtherMonth: {
    opacity: 0.4,
  },
  dayCellSelected: {
    backgroundColor: "#ef4444",
  },
  dayText: {
    fontSize: 14,
    color: "#374151",
  },
  dayTextOtherMonth: {
    color: "#9ca3af",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#f0fdf4",
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedDateText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  todayButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignSelf: "center",
  },
  todayButtonText: {
    color: "#374151",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end", // Cambiar de 'center' a 'flex-end'
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%", // Reducir de '80%' a '70%'
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16, // Reducir padding
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18, // Reducir tamaño
    fontWeight: "bold",
    color: "#1f2937",
  },
  // Cambiar calendarGrid
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12, // Reducir padding
  },
  dayCell: {
    width: "14.28%",
    height: 40, // Añadir altura fija en lugar de aspectRatio
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginVertical: 2,
  },
  modalFooter: {
    padding: 16, // Reducir padding
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  // Añadir scroll si es necesario
  modalScroll: {
    maxHeight: 400, // Altura máxima para el contenido
  },
});

export default DatePickerModal;
