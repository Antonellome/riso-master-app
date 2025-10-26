import { useReports, Report, MasterSettings } from "@/contexts/ReportContext";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import {
  Anchor,
  ChevronDown,
  Clock,
  Edit3,
  FileText,
  MapPin,
  Share2,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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

export default function HomeScreen() {
  const router = useRouter();
  const { reports, calculateStats, isLoading, settings, selectedTechnicianId, setSelectedTechnicianId, updateReport } = useReports();
  const [showTechnicianModal, setShowTechnicianModal] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  
  const stats = calculateStats(selectedTechnicianId);
  const selectedTechnician = selectedTechnicianId
    ? settings.technicians.find((t) => t.id === selectedTechnicianId)
    : null;
  const technicianReports = selectedTechnicianId
    ? reports.filter((r) => {
        const selectedTech = settings.technicians.find(t => t.id === selectedTechnicianId);
        if (!selectedTech) return false;
        return r.userId === selectedTech.userId || r.technicians.some(t => t.id === selectedTechnicianId || t.name === selectedTech.name);
      })
    : reports;



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const recentReports = technicianReports
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{settings.companyName}</Text>
          <Text style={styles.subtitle}>Dashboard Report Tecnici</Text>
          
          <TouchableOpacity
            style={styles.technicianSelector}
            onPress={() => setShowTechnicianModal(true)}
          >
            <View style={styles.technicianSelectorLeft}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.technicianSelectorText}>
                {selectedTechnician ? selectedTechnician.name : "Tutti i Tecnici"}
              </Text>
            </View>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIconContainer}>
              <Clock size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>
              {stats.hoursThisMonth.toFixed(1)}h
            </Text>
            <Text style={styles.statLabel}>Ore Mese</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Users size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.techniciansWithReportsToday}/{settings.technicians.filter(t => t.active).length}</Text>
            <Text style={styles.statLabel}>Report Giornalieri</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Anchor size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.shipsThisMonth}</Text>
            <Text style={styles.statLabel}>Navi (Mese)</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MapPin size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.locationsThisMonth}</Text>
            <Text style={styles.statLabel}>Luoghi (Mese)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rapporti Recenti</Text>
            {reports.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/reports")}>
                <Text style={styles.seeAllText}>Vedi tutti</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentReports.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={Colors.textLight} />
              <Text style={styles.emptyStateTitle}>
                Nessun rapporto ancora
              </Text>
              <Text style={styles.emptyStateText}>
                Inizia aggiungendo il tuo primo rapporto
              </Text>
            </View>
          ) : (
            <View style={styles.reportsList}>
              {recentReports.map((report) => {
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
                    <View style={styles.reportLeft}>
                      <Text style={styles.reportDateText}>
                        {formatDate(report.date)}
                      </Text>
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
                    <View style={styles.reportContent}>
                      <Text style={styles.reportShipName}>{report.ship}</Text>
                      <View style={styles.reportDetails}>
                        {report.technicians.length > 0 && (
                          <View style={styles.reportDetailItem}>
                            <Users size={14} color={Colors.textSecondary} />
                            <Text style={styles.reportDetailText}>
                              {report.technicians.length} tecnic{report.technicians.length === 1 ? 'o' : 'i'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.reportDetailItem}>
                          <Clock size={14} color={Colors.textSecondary} />
                          <Text style={styles.reportDetailText}>
                            {hours.toFixed(1)}h
                          </Text>
                        </View>
                        <View style={styles.reportDetailItem}>
                          <MapPin size={14} color={Colors.textSecondary} />
                          <Text style={styles.reportDetailText}>
                            {report.location}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showTechnicianModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTechnicianModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTechnicianModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleziona Tecnico</Text>
            
            <TouchableOpacity
              style={[
                styles.technicianOption,
                !selectedTechnicianId && styles.technicianOptionSelected,
              ]}
              onPress={() => {
                setSelectedTechnicianId(null);
                setShowTechnicianModal(false);
              }}
            >
              <Users size={20} color={!selectedTechnicianId ? Colors.primary : Colors.textSecondary} />
              <Text
                style={[
                  styles.technicianOptionText,
                  !selectedTechnicianId && styles.technicianOptionTextSelected,
                ]}
              >
                Tutti i Tecnici
              </Text>
            </TouchableOpacity>

            {settings.technicians.filter((t) => t.active).map((tech) => (
              <TouchableOpacity
                key={tech.id}
                style={[
                  styles.technicianOption,
                  selectedTechnicianId === tech.id && styles.technicianOptionSelected,
                ]}
                onPress={() => {
                  setSelectedTechnicianId(tech.id);
                  setShowTechnicianModal(false);
                }}
              >
                <Users
                  size={20}
                  color={selectedTechnicianId === tech.id ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.technicianOptionText,
                    selectedTechnicianId === tech.id && styles.technicianOptionTextSelected,
                  ]}
                >
                  {tech.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={selectedReport !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.reportModalHeader}>
              <Text style={styles.reportModalTitle}>Dettaglio Report</Text>
              <TouchableOpacity
                onPress={() => setSelectedReport(null)}
                style={styles.reportModalCloseButton}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.reportModalScroll} showsVerticalScrollIndicator={false}>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  technicianSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  technicianSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  technicianSelectorText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
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
  statCardPrimary: {
    backgroundColor: "#EEF2FF",
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reportLeft: {
    gap: 8,
    minWidth: 90,
  },
  reportDateText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  workTypeBadge: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  workTypeBadgeExtraordinary: {
    backgroundColor: "#F59E0B",
  },
  workTypeBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  workTypeBadgeTextExtraordinary: {
    color: "#FFFFFF",
  },
  reportContent: {
    flex: 1,
  },
  reportShipName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  reportDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  reportDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reportDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  technicianOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  technicianOptionSelected: {
    backgroundColor: "#EEF2FF",
  },
  technicianOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  technicianOptionTextSelected: {
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  reportModalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 40,
  },
  reportModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reportModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  reportModalCloseButton: {
    padding: 4,
  },
  reportModalScroll: {
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
  pickerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: Colors.background,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  pickerItemTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
});
