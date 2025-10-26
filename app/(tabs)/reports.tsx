import { useReports, Report, MasterSettings } from "@/contexts/ReportContext";
import Colors from "@/constants/colors";
import {
  Anchor,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MapPin,
  Search,
  Share2,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ReportPeriod = "daily" | "monthly";

export default function ReportsScreen() {
  const { reports, isLoading, settings, updateReport } = useReports();
  
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number }>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [selectedShipName, setSelectedShipName] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const [showTechnicianPicker, setShowTechnicianPicker] = useState<boolean>(false);
  const [showShipPicker, setShowShipPicker] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (reportPeriod === "daily") {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter((r) => r.date === dateStr);
    } else {
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.date);
        return (
          reportDate.getFullYear() === selectedMonth.year &&
          reportDate.getMonth() === selectedMonth.month
        );
      });
    }

    if (selectedTechnicianId) {
      const selectedTech = settings.technicians.find(t => t.id === selectedTechnicianId);
      if (selectedTech) {
        filtered = filtered.filter((r) => 
          r.userId === selectedTech.userId || 
          r.technicians.some(t => t.id === selectedTechnicianId || t.name === selectedTech.name)
        );
      }
    }

    if (selectedShipName) {
      filtered = filtered.filter((r) => r.ship === selectedShipName);
    }

    if (selectedLocation) {
      filtered = filtered.filter((r) => r.location === selectedLocation);
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [reports, reportPeriod, selectedDate, selectedMonth, selectedTechnicianId, selectedShipName, selectedLocation, settings.technicians]);

  const availableShips = useMemo(() => {
    let filtered = reports;

    if (reportPeriod === "daily") {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter((r) => r.date === dateStr);
    } else {
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.date);
        return (
          reportDate.getFullYear() === selectedMonth.year &&
          reportDate.getMonth() === selectedMonth.month
        );
      });
    }

    if (selectedTechnicianId) {
      const selectedTech = settings.technicians.find(t => t.id === selectedTechnicianId);
      if (selectedTech) {
        filtered = filtered.filter((r) => 
          r.userId === selectedTech.userId || 
          r.technicians.some(t => t.id === selectedTechnicianId || t.name === selectedTech.name)
        );
      }
    }

    return Array.from(new Set(filtered.map((r) => r.ship))).sort();
  }, [reports, reportPeriod, selectedDate, selectedMonth, selectedTechnicianId, settings.technicians]);

  const availableLocations = useMemo(() => {
    let filtered = reports;

    if (reportPeriod === "daily") {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter((r) => r.date === dateStr);
    } else {
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.date);
        return (
          reportDate.getFullYear() === selectedMonth.year &&
          reportDate.getMonth() === selectedMonth.month
        );
      });
    }

    if (selectedTechnicianId) {
      const selectedTech = settings.technicians.find(t => t.id === selectedTechnicianId);
      if (selectedTech) {
        filtered = filtered.filter((r) => 
          r.userId === selectedTech.userId || 
          r.technicians.some(t => t.id === selectedTechnicianId || t.name === selectedTech.name)
        );
      }
    }

    if (selectedShipName) {
      filtered = filtered.filter((r) => r.ship === selectedShipName);
    }

    return Array.from(new Set(filtered.map((r) => r.location))).sort();
  }, [reports, reportPeriod, selectedDate, selectedMonth, selectedTechnicianId, selectedShipName, settings.technicians]);

  const calculateTotalHours = () => {
    const absenceTypes = ['Ferie', 'Permesso', 'Malattia', '104'];
    const workReports = filteredReports.filter(r => !absenceTypes.includes(r.shiftType));
    
    let totalHours = 0;
    workReports.forEach(report => {
      report.technicians.forEach(tech => {
        const [startHour, startMin] = tech.startTime.split(':').map(Number);
        const [endHour, endMin] = tech.endTime.split(':').map(Number);
        
        let startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;
        
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60;
        }
        
        const techMinutes = endMinutes - startMinutes;
        const techHours = Math.max(0, techMinutes / 60);
        totalHours += techHours;
      });
    });
    
    return totalHours;
  };
  
  const totalHours = calculateTotalHours();
  const uniqueShips = new Set(
    filteredReports
      .map((r) => r.ship)
      .filter((ship) => ship && ship !== '-')
  );
  const uniqueLocations = new Set(
    filteredReports
      .map((r) => r.location)
      .filter((loc) => loc && loc !== '-')
  );

  const handleClearFilters = () => {
    setSelectedTechnicianId(null);
    setSelectedShipName(null);
    setSelectedLocation(null);
  };

  const hasActiveFilters = selectedTechnicianId || selectedShipName || selectedLocation;

  const renderCalendarModal = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
            isToday && !isSelected && styles.calendarDayToday,
          ]}
          onPress={() => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isToday && !isSelected && styles.calendarDayTextToday,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                <ChevronLeft size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {selectedDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                <ChevronRight size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekDays}>
              {["D", "L", "M", "M", "G", "V", "S"].map((day, i) => (
                <View key={i} style={styles.calendarWeekDay}>
                  <Text style={styles.calendarWeekDayText}>{day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.calendarGrid}>{days}</View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderMonthPicker = () => {
    const months = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
    ];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    return (
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Seleziona Mese</Text>
            <ScrollView style={styles.pickerScroll}>
              {years.map((year) => (
                <View key={year}>
                  <Text style={styles.yearLabel}>{year}</Text>
                  {months.map((monthName, idx) => (
                    <TouchableOpacity
                      key={`${year}-${idx}`}
                      style={[
                        styles.pickerItem,
                        selectedMonth.year === year &&
                          selectedMonth.month === idx &&
                          styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedMonth({ month: idx, year });
                        setShowMonthPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMonth.year === year &&
                            selectedMonth.month === idx &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {monthName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: string[],
    selectedItem: string | null,
    onSelect: (item: string | null) => void
  ) => {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <ScrollView style={styles.pickerScroll}>
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedItem === null && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  onSelect(null);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedItem === null && styles.pickerItemTextSelected,
                  ]}
                >
                  Tutti
                </Text>
              </TouchableOpacity>
              {items.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.pickerItem,
                    selectedItem === item && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedItem === item && styles.pickerItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const selectedTechnician = selectedTechnicianId
    ? settings.technicians.find((t) => t.id === selectedTechnicianId)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchSection}>
          <View style={styles.searchHeader}>
            <Search size={20} color={Colors.primary} />
            <Text style={styles.searchTitle}>Ricerca Report</Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilters}
              >
                <X size={16} color={Colors.textSecondary} />
                <Text style={styles.clearButtonText}>Cancella</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                reportPeriod === "daily" && styles.periodButtonActive,
              ]}
              onPress={() => setReportPeriod("daily")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  reportPeriod === "daily" && styles.periodButtonTextActive,
                ]}
              >
                Giornalieri
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                reportPeriod === "monthly" && styles.periodButtonActive,
              ]}
              onPress={() => setReportPeriod("monthly")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  reportPeriod === "monthly" && styles.periodButtonTextActive,
                ]}
              >
                Mensili
              </Text>
            </TouchableOpacity>
          </View>

          {reportPeriod === "daily" ? (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowCalendar(true)}
            >
              <Calendar size={18} color={Colors.text} />
              <Text style={styles.filterButtonText}>
                {selectedDate.toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
              <ChevronDown size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowMonthPicker(true)}
            >
              <Calendar size={18} color={Colors.text} />
              <Text style={styles.filterButtonText}>
                {new Date(selectedMonth.year, selectedMonth.month).toLocaleDateString("it-IT", {
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
              <ChevronDown size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}

          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedTechnicianId && styles.filterChipActive]}
              onPress={() => setShowTechnicianPicker(true)}
            >
              <Text style={[styles.filterChipText, selectedTechnicianId && styles.filterChipTextActive]}>
                {selectedTechnician ? selectedTechnician.name : "Tecnico"}
              </Text>
              <ChevronDown size={14} color={selectedTechnicianId ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedShipName && styles.filterChipActive]}
              onPress={() => setShowShipPicker(true)}
            >
              <Text style={[styles.filterChipText, selectedShipName && styles.filterChipTextActive]}>
                {selectedShipName || "Nave"}
              </Text>
              <ChevronDown size={14} color={selectedShipName ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedLocation && styles.filterChipActive]}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={[styles.filterChipText, selectedLocation && styles.filterChipTextActive]}>
                {selectedLocation || "Luogo"}
              </Text>
              <ChevronDown size={14} color={selectedLocation ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Clock size={24} color={Colors.primary} />
            </View>
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Ore Totali</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Anchor size={24} color={Colors.primary} />
            </View>
            <Text style={styles.summaryValue}>{uniqueShips.size}</Text>
            <Text style={styles.summaryLabel}>Navi</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <MapPin size={24} color={Colors.primary} />
            </View>
            <Text style={styles.summaryValue}>{uniqueLocations.size}</Text>
            <Text style={styles.summaryLabel}>Luoghi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {reportPeriod === "daily" ? "Rapporti Giornalieri" : "Rapporti Mensili"} ({filteredReports.length})
          </Text>
          {filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.textLight} />
              <Text style={styles.emptyStateText}>
                Nessun rapporto per questo mese
              </Text>
            </View>
          ) : (
            <View style={styles.reportsList}>
              {filteredReports.map((report) => {
                  const date = new Date(report.date);
                  const dateStr = date.toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  const start = new Date(`2000-01-01T${report.startTime}`);
                  const end = new Date(`2000-01-01T${report.endTime}`);
                  const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60) - (report.pauseMinutes / 60));

                  const getShiftTypeBadgeColor = (shiftType: string) => {
                    switch (shiftType) {
                      case "Ordinaria": return { bg: "#dbeafe", text: "#1e40af" };
                      case "Straordinaria": return { bg: "#fed7aa", text: "#c2410c" };
                      case "Festiva": return { bg: "#fde68a", text: "#92400e" };
                      case "Ferie": return { bg: "#d1fae5", text: "#065f46" };
                      case "Permesso": return { bg: "#e0e7ff", text: "#3730a3" };
                      case "Malattia": return { bg: "#fecaca", text: "#991b1b" };
                      case "104": return { bg: "#e9d5ff", text: "#6b21a8" };
                      default: return { bg: "#e5e7eb", text: "#374151" };
                    }
                  };

                  const badgeColors = getShiftTypeBadgeColor(report.shiftType);

                  return (
                    <TouchableOpacity 
                      key={report.id} 
                      style={styles.reportCard}
                      onPress={() => setSelectedReport(report)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.reportHeader}>
                        <View style={styles.reportHeaderLeft}>
                          <Text style={styles.reportDate}>{dateStr}</Text>
                          <View
                            style={[
                              styles.workTypeBadge,
                              { backgroundColor: badgeColors.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.workTypeBadgeText,
                                { color: badgeColors.text },
                              ]}
                            >
                              {report.shiftType}
                            </Text>
                          </View>
                        </View>

                      </View>
                      <Text style={styles.reportShipName}>
                        {report.ship}
                      </Text>
                      {report.technicians.length > 0 && (
                        <Text style={styles.reportTechnicianName}>
                          Tecnici: {report.technicians.map(t => t.name).join(", ")}
                        </Text>
                      )}
                      <View style={styles.reportFooter}>
                        <View style={styles.reportInfoItem}>
                          <Clock size={14} color={Colors.textSecondary} />
                          <Text style={styles.reportInfoText}>
                            {hours.toFixed(1)}h
                          </Text>
                        </View>
                        <View style={styles.reportInfoItem}>
                          <MapPin size={14} color={Colors.textSecondary} />
                          <Text style={styles.reportInfoText}>
                            {report.location}
                          </Text>
                        </View>
                        <View style={styles.reportInfoItem}>
                          <Clock size={14} color={Colors.textSecondary} />
                          <Text style={styles.reportInfoText}>
                            {report.startTime} - {report.endTime}
                          </Text>
                        </View>
                      </View>
                      {report.description && (
                        <Text style={styles.reportNotes}>{report.description}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedReport !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.reportDetailModalOverlay}>
          <View style={styles.reportDetailModalContent}>
            <View style={styles.reportDetailModalHeader}>
              <Text style={styles.reportDetailModalTitle}>Dettaglio Report</Text>
              <TouchableOpacity
                onPress={() => setSelectedReport(null)}
                style={styles.reportDetailModalCloseButton}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.reportDetailModalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Data</Text>
                  <Text style={styles.reportDetailValue}>
                    {new Date(selectedReport.date).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Tipo Giornata</Text>
                  <Text style={styles.reportDetailValue}>{selectedReport.shiftType}</Text>
                </View>

                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Nave</Text>
                  <Text style={styles.reportDetailValue}>{selectedReport.ship}</Text>
                </View>

                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Luogo</Text>
                  <Text style={styles.reportDetailValue}>{selectedReport.location}</Text>
                </View>

                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Orario</Text>
                  <Text style={styles.reportDetailValue}>
                    {selectedReport.startTime} - {selectedReport.endTime}
                  </Text>
                </View>

                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Pausa</Text>
                  <Text style={styles.reportDetailValue}>{selectedReport.pauseMinutes} minuti</Text>
                </View>

                {selectedReport.technicians.length > 0 && (
                  <View style={styles.reportDetailSection}>
                    <Text style={styles.reportDetailLabel}>Tecnici</Text>
                    {selectedReport.technicians.map((tech, idx) => (
                      <View key={idx} style={styles.technicianDetailItem}>
                        <Text style={styles.reportDetailValue}>{tech.name}</Text>
                        <Text style={styles.reportDetailSubValue}>
                          {tech.startTime} - {tech.endTime}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedReport.description && (
                  <View style={styles.reportDetailSection}>
                    <Text style={styles.reportDetailLabel}>Descrizione</Text>
                    <Text style={styles.reportDetailValue}>{selectedReport.description}</Text>
                  </View>
                )}

                {selectedReport.materials && (
                  <View style={styles.reportDetailSection}>
                    <Text style={styles.reportDetailLabel}>Materiali</Text>
                    <Text style={styles.reportDetailValue}>{selectedReport.materials}</Text>
                  </View>
                )}

                {selectedReport.workDone && (
                  <View style={styles.reportDetailSection}>
                    <Text style={styles.reportDetailLabel}>Lavoro Svolto</Text>
                    <Text style={styles.reportDetailValue}>{selectedReport.workDone}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {selectedReport && (
              <View style={styles.reportModalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => {
                    setEditingReport(selectedReport);
                    setShowEditModal(true);
                    setSelectedReport(null);
                  }}
                >
                  <Edit3 size={18} color={Colors.primary} />
                  <Text style={styles.actionButtonTextSecondary}>Modifica</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    alert('Condividi come PDF o XLSX - Funzione in sviluppo');
                  }}
                >
                  <Share2 size={18} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Condividi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {renderCalendarModal()}
      {renderMonthPicker()}
      {renderPicker(
        showTechnicianPicker,
        () => setShowTechnicianPicker(false),
        "Seleziona Tecnico",
        settings.technicians.filter((t) => t.active).map((t) => t.name),
        selectedTechnician?.name || null,
        (name) => {
          if (name === null) {
            setSelectedTechnicianId(null);
          } else {
            const tech = settings.technicians.find((t) => t.name === name);
            setSelectedTechnicianId(tech ? tech.id : null);
          }
          setSelectedShipName(null);
          setSelectedLocation(null);
        }
      )}
      {renderPicker(
        showShipPicker,
        () => setShowShipPicker(false),
        "Seleziona Nave",
        availableShips,
        selectedShipName,
        (ship) => {
          setSelectedShipName(ship);
          setSelectedLocation(null);
        }
      )}
      {renderPicker(
        showLocationPicker,
        () => setShowLocationPicker(false),
        "Seleziona Luogo",
        availableLocations,
        selectedLocation,
        setSelectedLocation
      )}

      <EditReportModal
        visible={showEditModal}
        report={editingReport}
        onClose={() => {
          setShowEditModal(false);
          setEditingReport(null);
        }}
        onSave={(updatedReport) => {
          if (editingReport) {
            updateReport(editingReport.id, updatedReport);
            Alert.alert("Successo", "Report modificato con successo");
            setShowEditModal(false);
            setEditingReport(null);
          }
        }}
        settings={settings}
      />
    </View>
  );
}

interface EditReportModalProps {
  visible: boolean;
  report: Report | null;
  onClose: () => void;
  onSave: (updates: Partial<Report>) => void;
  settings: MasterSettings;
}

function EditReportModal({ visible, report, onClose, onSave, settings }: EditReportModalProps) {
  const [date, setDate] = useState<string>("");
  const [shiftType, setShiftType] = useState<string>("Ordinaria");
  const [ship, setShip] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [pauseMinutes, setPauseMinutes] = useState<string>("60");
  const [description, setDescription] = useState<string>("");
  const [materials, setMaterials] = useState<string>("");
  const [workDone, setWorkDone] = useState<string>("");

  const [showShiftTypePicker, setShowShiftTypePicker] = useState<boolean>(false);
  const [showShipPicker, setShowShipPicker] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);

  const shiftTypes = ["Ordinaria", "Straordinaria", "Festiva", "Ferie", "Permesso", "Malattia", "104"];

  useEffect(() => {
    if (report) {
      setDate(report.date);
      setShiftType(report.shiftType);
      setShip(report.ship);
      setLocation(report.location);
      setStartTime(report.startTime);
      setEndTime(report.endTime);
      setPauseMinutes(report.pauseMinutes.toString());
      setDescription(report.description || "");
      setMaterials(report.materials || "");
      setWorkDone(report.workDone || "");
    }
  }, [report]);

  const handleSave = () => {
    if (!ship.trim() || !location.trim()) {
      Alert.alert("Errore", "Compila tutti i campi obbligatori");
      return;
    }

    onSave({
      date,
      shiftType: shiftType as any,
      ship,
      location,
      startTime,
      endTime,
      pauseMinutes: parseInt(pauseMinutes) || 60,
      description,
      materials,
      workDone,
    });
  };

  if (!report) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Modifica Report</Text>
              <TouchableOpacity onPress={onClose} style={styles.editModalCloseButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Data</Text>
                <TextInput
                  style={styles.formInput}
                  value={new Date(date).toLocaleDateString("it-IT")}
                  editable={false}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Tipo Giornata *</Text>
                <TouchableOpacity
                  style={styles.formPickerButton}
                  onPress={() => setShowShiftTypePicker(true)}
                >
                  <Text style={styles.formPickerButtonText}>{shiftType}</Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Nave *</Text>
                <TouchableOpacity
                  style={styles.formPickerButton}
                  onPress={() => setShowShipPicker(true)}
                >
                  <Text style={styles.formPickerButtonText}>{ship || "Seleziona nave"}</Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Luogo *</Text>
                <TouchableOpacity
                  style={styles.formPickerButton}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Text style={styles.formPickerButtonText}>{location || "Seleziona luogo"}</Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalfSection}>
                  <Text style={styles.formLabel}>Ora Inizio</Text>
                  <TextInput
                    style={styles.formInput}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="08:00"
                  />
                </View>
                <View style={styles.formHalfSection}>
                  <Text style={styles.formLabel}>Ora Fine</Text>
                  <TextInput
                    style={styles.formInput}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="17:00"
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Pausa (minuti)</Text>
                <TextInput
                  style={styles.formInput}
                  value={pauseMinutes}
                  onChangeText={setPauseMinutes}
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Descrizione</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Descrizione attività..."
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Materiali</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={materials}
                  onChangeText={setMaterials}
                  multiline
                  numberOfLines={3}
                  placeholder="Materiali utilizzati..."
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Lavoro Svolto</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={workDone}
                  onChangeText={setWorkDone}
                  multiline
                  numberOfLines={3}
                  placeholder="Lavoro svolto..."
                />
              </View>
            </ScrollView>

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={onClose}
              >
                <Text style={styles.actionButtonTextSecondary}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Text style={styles.actionButtonText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showShiftTypePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowShiftTypePicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Seleziona Tipo Giornata</Text>
            <ScrollView style={styles.pickerScroll}>
              {shiftTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerItem,
                    shiftType === type && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setShiftType(type);
                    setShowShiftTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      shiftType === type && styles.pickerItemTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showShipPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowShipPicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Seleziona Nave</Text>
            <ScrollView style={styles.pickerScroll}>
              {settings.ships
                .filter((s) => s.active)
                .map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.pickerItem,
                      ship === s.name && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setShip(s.name);
                      setShowShipPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        ship === s.name && styles.pickerItemTextSelected,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showLocationPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationPicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Seleziona Luogo</Text>
            <ScrollView style={styles.pickerScroll}>
              {settings.locations
                .filter((l) => l.active)
                .map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={[
                      styles.pickerItem,
                      location === l.name && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setLocation(l.name);
                      setShowLocationPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        location === l.name && styles.pickerItemTextSelected,
                      ]}
                    >
                      {l.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchSection: {
    gap: 12,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    flex: 1,
    textTransform: "capitalize",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  summarySection: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIconContainer: {
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reportHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  workTypeBadge: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  workTypeBadgeExtraordinary: {
    backgroundColor: "#F59E0B",
  },
  workTypeBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  workTypeBadgeTextExtraordinary: {
    color: "#FFFFFF",
  },

  reportShipName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  reportTechnicianName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  reportFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  technicianBanner: {
    backgroundColor: "#EEF2FF",
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  technicianBannerText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  reportInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reportInfoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reportNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    textTransform: "capitalize",
  },
  calendarWeekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    alignItems: "center",
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  calendarDayTextToday: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  pickerModalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 300,
    maxHeight: "70%",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  yearLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
    paddingLeft: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerItemTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  reportDetailModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  reportDetailModalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 40,
  },
  reportDetailModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reportDetailModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  reportDetailModalCloseButton: {
    padding: 4,
  },
  reportDetailModalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  reportDetailSection: {
    marginBottom: 20,
  },
  reportDetailLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  reportDetailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  reportDetailSubValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  technicianDetailItem: {
    marginBottom: 12,
  },
  reportModalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: "#EEF2FF",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  actionButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  editModalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
    paddingBottom: 40,
  },
  editModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  editModalCloseButton: {
    padding: 4,
  },
  editModalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  editModalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  formSection: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  formHalfSection: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  formPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  formPickerButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
  },
});
