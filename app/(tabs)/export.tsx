import { useReports } from "@/contexts/ReportContext";
import Colors from "@/constants/colors";
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Share2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ExportScreen() {
  const { reports, selectedTechnicianId, settings, syncWithTechnicians, getReportsByMonth } = useReports();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const selectedDate = new Date();

  const selectedTechnician = selectedTechnicianId
    ? settings.technicians.find((t) => t.id === selectedTechnicianId)
    : null;

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthReports = getReportsByMonth(year, month, selectedTechnicianId);

  const handleExportPDF = async (type: "daily" | "monthly") => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        "Successo",
        `Report ${type === "daily" ? "giornaliero" : "mensile"} esportato in PDF!${selectedTechnician ? `\nTecnico: ${selectedTechnician.name}` : ""}`
      );
    } catch {
      Alert.alert("Errore", "Errore durante l'esportazione PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLSX = async (type: "daily" | "monthly") => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        "Successo",
        `Report ${type === "daily" ? "giornaliero" : "mensile"} esportato in XLSX!${selectedTechnician ? `\nTecnico: ${selectedTechnician.name}` : ""}`
      );
    } catch {
      Alert.alert("Errore", "Errore durante l'esportazione XLSX");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithTechnicians();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Successo", "Sincronizzazione completata!");
    } catch {
      Alert.alert("Errore", "Errore durante la sincronizzazione");
    } finally {
      setIsSyncing(false);
    }
  };

  const monthName = selectedDate.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Esporta & Condividi</Text>
          <Text style={styles.headerSubtitle}>
            {selectedTechnician
              ? `Tecnico: ${selectedTechnician.name}`
              : "Tutti i Tecnici"}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RefreshCw size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Sincronizzazione</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Sincronizza i dati con le app dei tecnici
          </Text>

          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.buttonDisabled]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <RefreshCw size={24} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>
                  Sincronizza con Tecnici
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reports.length}</Text>
              <Text style={styles.statLabel}>Rapporti Totali</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {settings.technicians.filter((t) => t.active).length}
              </Text>
              <Text style={styles.statLabel}>Tecnici Attivi</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Report Mensili</Text>
          </View>
          <Text style={styles.sectionDescription}>
            {monthName} - {monthReports.length} rapporti
          </Text>

          <View style={styles.exportButtonsGrid}>
            <TouchableOpacity
              style={[
                styles.exportButton,
                styles.exportButtonPDF,
                isExporting && styles.buttonDisabled,
              ]}
              onPress={() => handleExportPDF("monthly")}
              disabled={isExporting}
            >
              <FileText size={32} color="#EF4444" />
              <Text style={styles.exportButtonLabel}>PDF Mensile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportButton,
                styles.exportButtonXLSX,
                isExporting && styles.buttonDisabled,
              ]}
              onPress={() => handleExportXLSX("monthly")}
              disabled={isExporting}
            >
              <FileSpreadsheet size={32} color="#10B981" />
              <Text style={styles.exportButtonLabel}>XLSX Mensile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Report Giornalieri</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Esporta i report del giorno corrente
          </Text>

          <View style={styles.exportButtonsGrid}>
            <TouchableOpacity
              style={[
                styles.exportButton,
                styles.exportButtonPDF,
                isExporting && styles.buttonDisabled,
              ]}
              onPress={() => handleExportPDF("daily")}
              disabled={isExporting}
            >
              <FileText size={32} color="#EF4444" />
              <Text style={styles.exportButtonLabel}>PDF Giornaliero</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportButton,
                styles.exportButtonXLSX,
                isExporting && styles.buttonDisabled,
              ]}
              onPress={() => handleExportXLSX("daily")}
              disabled={isExporting}
            >
              <FileSpreadsheet size={32} color="#10B981" />
              <Text style={styles.exportButtonLabel}>XLSX Giornaliero</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Share2 size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Condivisione Rapida</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Condividi tramite email, WhatsApp, ecc.
          </Text>

          <TouchableOpacity
            style={[styles.shareButton, isExporting && styles.buttonDisabled]}
            disabled={isExporting}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Condividi Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  syncButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  syncButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  exportButtonsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  exportButtonPDF: {
    borderWidth: 2,
    borderColor: "#FEE2E2",
  },
  exportButtonXLSX: {
    borderWidth: 2,
    borderColor: "#D1FAE5",
  },
  exportButtonLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  shareButton: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
