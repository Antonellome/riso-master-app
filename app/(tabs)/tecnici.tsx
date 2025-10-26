import { useReports } from "@/contexts/ReportContext";
import Colors from "@/constants/colors";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, User } from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DateFilterType = 'today' | 'calendar' | 'month';

export default function TecniciScreen() {
  const { reports, isLoading, settings } = useReports();
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [showTechnicianPicker, setShowTechnicianPicker] = useState<boolean>(false);

  const attendanceSummary = useMemo(() => {
    let filteredReports = reports;

    if (dateFilterType === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filteredReports = reports.filter(r => r.date === today);
    } else if (dateFilterType === 'calendar') {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filteredReports = reports.filter(r => r.date === dateStr);
    } else if (dateFilterType === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      filteredReports = reports.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }

    if (selectedTechnicianId) {
      const selectedTech = settings.technicians.find(t => t.id === selectedTechnicianId);
      if (selectedTech) {
        filteredReports = filteredReports.filter((r) => 
          r.userId === selectedTech.userId || 
          r.technicians.some(t => t.id === selectedTechnicianId || t.name === selectedTech.name)
        );
      }
    }

    if (selectedTechnicianId) {
      const daysWithWork = new Set<string>();
      const daysWithAbsence = new Map<string, string>();
      const absenceTypes = ['Ferie', 'Permesso', 'Malattia', '104'];

      filteredReports.forEach(report => {
        const isAbsence = absenceTypes.includes(report.shiftType);
        
        if (isAbsence) {
          if (!daysWithAbsence.has(report.date)) {
            daysWithAbsence.set(report.date, report.shiftType);
          }
        } else {
          daysWithWork.add(report.date);
        }
      });

      const absenceCounts: Record<string, number> = {
        Malattia: 0,
        Ferie: 0,
        Permesso: 0,
        '104': 0,
      };

      daysWithAbsence.forEach((shiftType) => {
        if (absenceCounts[shiftType] !== undefined) {
          absenceCounts[shiftType]++;
        }
      });

      const festivoDays = filteredReports.filter(r => r.shiftType === 'Festiva').length;
      const totalDaysWithData = daysWithWork.size + daysWithAbsence.size;
      let totalPossibleDays = 0;

      if (dateFilterType === 'today' || dateFilterType === 'calendar') {
        totalPossibleDays = 1;
      } else if (dateFilterType === 'month') {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        totalPossibleDays = new Date(year, month + 1, 0).getDate();
      }

      const assenti = Math.max(0, totalPossibleDays - totalDaysWithData);

      return {
        presenti: daysWithWork.size,
        assenti,
        malattia: absenceCounts.Malattia,
        ferie: absenceCounts.Ferie,
        festivo: festivoDays,
        '104': absenceCounts['104'],
        permesso: absenceCounts.Permesso,
      };
    }

    const workTypeCounts: Record<string, Set<string>> = {
      Ordinaria: new Set(),
      Straordinaria: new Set(),
      Festiva: new Set(),
      Ferie: new Set(),
      Permesso: new Set(),
      Malattia: new Set(),
      '104': new Set(),
    };

    const techniciansWithReports = new Set<string>();

    filteredReports.forEach(report => {
      if (workTypeCounts[report.shiftType]) {
        const absenceTypes = ['Ferie', 'Permesso', 'Malattia', '104'];
        const isAbsence = absenceTypes.includes(report.shiftType);
        
        if (isAbsence) {
          if (report.userId) {
            const reportCreator = settings.technicians.find(t => t.userId === report.userId);
            if (reportCreator) {
              workTypeCounts[report.shiftType].add(reportCreator.id);
              techniciansWithReports.add(reportCreator.id);
            }
          }
        } else {
          const allTechsInReport = new Set<string>();
          
          if (report.userId) {
            const reportCreator = settings.technicians.find(t => t.userId === report.userId);
            if (reportCreator) {
              allTechsInReport.add(reportCreator.id);
              techniciansWithReports.add(reportCreator.id);
            }
          }
          
          report.technicians.forEach(tech => {
            allTechsInReport.add(tech.id);
            techniciansWithReports.add(tech.id);
          });
          
          allTechsInReport.forEach(id => {
            workTypeCounts[report.shiftType].add(id);
          });
        }
      }
    });

    const presentiTechnicians = new Set<string>();
    workTypeCounts.Ordinaria.forEach(id => presentiTechnicians.add(id));
    workTypeCounts.Straordinaria.forEach(id => presentiTechnicians.add(id));
    workTypeCounts.Festiva.forEach(id => presentiTechnicians.add(id));

    const assentiConMotivoTechnicians = new Set<string>();
    workTypeCounts.Ferie.forEach(id => assentiConMotivoTechnicians.add(id));
    workTypeCounts['104'].forEach(id => assentiConMotivoTechnicians.add(id));
    workTypeCounts.Permesso.forEach(id => assentiConMotivoTechnicians.add(id));
    workTypeCounts.Malattia.forEach(id => assentiConMotivoTechnicians.add(id));

    const activeTechnicians = settings.technicians.filter(t => t.active);
    
    const techniciansWithoutReports = activeTechnicians.filter(
      t => !techniciansWithReports.has(t.id)
    );

    const totalAssenti = assentiConMotivoTechnicians.size + techniciansWithoutReports.length;

    return {
      presenti: presentiTechnicians.size,
      assenti: totalAssenti,
      malattia: workTypeCounts.Malattia.size,
      ferie: workTypeCounts.Ferie.size,
      festivo: workTypeCounts.Festiva.size,
      '104': workTypeCounts['104'].size,
      permesso: workTypeCounts.Permesso.size,
    };
  }, [reports, dateFilterType, selectedDate, selectedTechnicianId, settings.technicians]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riepilogo Presenti</Text>
          
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, dateFilterType === 'today' && styles.filterButtonActive]}
              onPress={() => {
                setDateFilterType('today');
                setSelectedDate(new Date());
              }}
            >
              <Text style={[styles.filterButtonText, dateFilterType === 'today' && styles.filterButtonTextActive]}>Oggi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, dateFilterType === 'calendar' && styles.filterButtonActive]}
              onPress={() => {
                setDateFilterType('calendar');
                setCalendarMonth(selectedDate);
                setShowCalendar(true);
              }}
            >
              <Calendar size={16} color={dateFilterType === 'calendar' ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.filterButtonText, dateFilterType === 'calendar' && styles.filterButtonTextActive]}>
                {dateFilterType === 'calendar' ? selectedDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Scegli Data'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.technicianFilterContainer}>
            <TouchableOpacity
              style={[styles.technicianFilterButton, selectedTechnicianId && styles.technicianFilterButtonActive]}
              onPress={() => setShowTechnicianPicker(true)}
            >
              <User size={16} color={selectedTechnicianId ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.technicianFilterButtonText, selectedTechnicianId && styles.technicianFilterButtonTextActive]}>
                {selectedTechnicianId
                  ? settings.technicians.find(t => t.id === selectedTechnicianId)?.name || 'Tutti i tecnici'
                  : 'Tutti i tecnici'}
              </Text>
              <ChevronDown size={16} color={selectedTechnicianId ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {reports.length === 0 || (dateFilterType === 'today' && attendanceSummary.presenti === 0 && attendanceSummary.assenti === 0) || 
           (dateFilterType !== 'today' && attendanceSummary.presenti === 0 && attendanceSummary.assenti === 0) ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>⚠️ Nessun dato per la ricerca richiesta!</Text>
            </View>
          ) : (
            <>
              <View style={styles.attendanceGrid}>
                <View style={[styles.attendanceCard, styles.attendanceCardLarge]}>
                  <Text style={styles.attendanceValue}>{attendanceSummary.presenti}</Text>
                  <Text style={styles.attendanceLabel}>Presenti</Text>
                </View>
                <View style={[styles.attendanceCard, styles.attendanceCardLarge]}>
                  <Text style={styles.attendanceValue}>{attendanceSummary.assenti}</Text>
                  <Text style={styles.attendanceLabel}>Assenti</Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailValue}>{attendanceSummary.malattia}</Text>
                  <Text style={styles.detailLabel}>Malattia</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailValue}>{attendanceSummary.ferie}</Text>
                  <Text style={styles.detailLabel}>Ferie</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailValue}>{attendanceSummary.festivo}</Text>
                  <Text style={styles.detailLabel}>Festivo</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailValue}>{attendanceSummary['104']}</Text>
                  <Text style={styles.detailLabel}>104</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailValue}>{attendanceSummary.permesso}</Text>
                  <Text style={styles.detailLabel}>Permesso</Text>
                </View>
              </View>
            </>
          )}


        </View>
      </ScrollView>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.calendarModal}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(calendarMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCalendarMonth(newMonth);
                  }}
                  style={styles.calendarNavButton}
                >
                  <ChevronLeft size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>
                  {calendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(calendarMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCalendarMonth(newMonth);
                  }}
                  style={styles.calendarNavButton}
                >
                  <ChevronRight size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarWeekDays}>
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
                  <Text key={i} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {(() => {
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
                  
                  const days = [];
                  
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
                  }
                  
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const isSelected = selectedDate.toISOString().split('T')[0] === date.toISOString().split('T')[0];
                    const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
                    
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
                  
                  return days;
                })()}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showTechnicianPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTechnicianPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTechnicianPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerModal}>
              <Text style={styles.pickerTitle}>Seleziona Tecnico</Text>
              <ScrollView style={styles.pickerScroll}>
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    selectedTechnicianId === null && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedTechnicianId(null);
                    setShowTechnicianPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedTechnicianId === null && styles.pickerItemTextSelected,
                    ]}
                  >
                    Tutti i tecnici
                  </Text>
                </TouchableOpacity>
                {settings.technicians
                  .filter(t => t.active)
                  .sort((a, b) => a.name.localeCompare(b.name, 'it'))
                  .map((tech) => (
                    <TouchableOpacity
                      key={tech.id}
                      style={[
                        styles.pickerItem,
                        selectedTechnicianId === tech.id && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedTechnicianId(tech.id);
                        setShowTechnicianPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedTechnicianId === tech.id && styles.pickerItemTextSelected,
                        ]}
                      >
                        {tech.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: "#EEF2FF",
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.primary,
  },
  attendanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  attendanceCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    minWidth: "30%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  attendanceCardLarge: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 24,
  },
  attendanceValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  detailCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    minWidth: "18%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarModal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    textTransform: "capitalize",
  },
  calendarWeekDays: {
    flexDirection: "row",
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
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
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  calendarDayTextToday: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  technicianFilterContainer: {
    marginTop: 12,
  },
  technicianFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  technicianFilterButtonActive: {
    backgroundColor: "#EEF2FF",
    borderColor: Colors.primary,
  },
  technicianFilterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  technicianFilterButtonTextActive: {
    color: Colors.primary,
  },
  pickerModal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: 320,
    maxHeight: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
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
  noDataContainer: {
    marginTop: 24,
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#FFD700",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#D97706",
    textAlign: "center",
  },
});
