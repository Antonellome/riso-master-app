import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import {
  Bell,
  Send,
  Trash2,
  Users,
  Tag,
  X,
  ChevronDown,
  Calendar,
} from "lucide-react-native";
import { useReports } from "@/contexts/ReportContext";
import Colors from "@/constants/colors";

type RecipientType = "individual" | "category";

export default function NotificheScreen() {
  const {
    settings,
    addNotification,
    deleteNotification,
    syncWithTechnicians,
  } = useReports();

  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [recipientType, setRecipientType] = useState<RecipientType>("individual");
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showTechnicianModal, setShowTechnicianModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleToggleTechnician = (id: string) => {
    const newSelection = new Set(selectedTechnicianIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTechnicianIds(newSelection);
  };

  const handleToggleCategory = (category: string) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(category)) {
      newSelection.delete(category);
    } else {
      newSelection.add(category);
    }
    setSelectedCategories(newSelection);
  };

  const handleSendNow = () => {
    if (!validateNotification()) return;

    if (!settings.syncEnabled || !settings.syncUrl) {
      Alert.alert(
        "Errore",
        "Sincronizzazione non abilitata. Configura le impostazioni prima di inviare notifiche."
      );
      return;
    }

    Alert.alert(
      "Conferma Invio",
      "Vuoi inviare questa notifica immediatamente?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Invia",
          onPress: async () => {
            const recipients = Array.from(selectedTechnicianIds);
            const recipientCategories = Array.from(selectedCategories);

            addNotification({
              title: title.trim(),
              date: new Date().toISOString().split("T")[0],
              message: message.trim(),
              recipients,
              recipientCategories,
              priority: "normal",
              type: "info",
              sentAt: new Date().toISOString(),
            });

            await syncWithTechnicians();

            Alert.alert("Successo", "Notifica inviata");
            resetForm();
          },
        },
      ]
    );
  };

  const handleSaveForSync = () => {
    if (!validateNotification()) return;

    const recipients = Array.from(selectedTechnicianIds);
    const recipientCategories = Array.from(selectedCategories);

    addNotification({
      title: title.trim(),
      date: new Date().toISOString().split("T")[0],
      message: message.trim(),
      recipients,
      recipientCategories,
      priority: "normal",
      type: "info",
    });

    Alert.alert("Successo", "Notifica salvata. Verrà inviata durante la prossima sincronizzazione.");
    resetForm();
  };

  const validateNotification = () => {
    if (!title.trim()) {
      Alert.alert("Errore", "Inserisci un titolo per la notifica");
      return false;
    }

    if (!message.trim()) {
      Alert.alert("Errore", "Inserisci un messaggio");
      return false;
    }

    if (selectedTechnicianIds.size === 0 && selectedCategories.size === 0) {
      Alert.alert("Errore", "Seleziona almeno un destinatario o una categoria");
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setSelectedTechnicianIds(new Set());
    setSelectedCategories(new Set());
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert("Conferma", "Eliminare questa notifica?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => {
          deleteNotification(id);
          Alert.alert("Successo", "Notifica eliminata");
        },
      },
    ]);
  };

  const getRecipientNames = (
    recipients: string[],
    recipientCategories: string[]
  ) => {
    const techNames = (settings.technicians || [])
      .filter((t) => recipients.includes(t.id))
      .map((t) => t.name);

    const allNames = [...techNames, ...recipientCategories];

    if (allNames.length === 0) return "Nessun destinatario";
    if (allNames.length === 1) return allNames[0];
    if (allNames.length === 2) return allNames.join(" e ");
    return `${allNames.slice(0, 2).join(", ")} e altri ${allNames.length - 2}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Nuova Notifica</Text>
          </View>

          <View style={styles.recipientTypeContainer}>
            <TouchableOpacity
              style={[
                styles.recipientTypeButton,
                recipientType === "individual" && styles.recipientTypeButtonActive,
              ]}
              onPress={() => setRecipientType("individual")}
            >
              <Users size={18} color={recipientType === "individual" ? Colors.primary : Colors.textSecondary} />
              <Text
                style={[
                  styles.recipientTypeText,
                  recipientType === "individual" && styles.recipientTypeTextActive,
                ]}
              >
                Per Tecnico
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.recipientTypeButton,
                recipientType === "category" && styles.recipientTypeButtonActive,
              ]}
              onPress={() => setRecipientType("category")}
            >
              <Tag size={18} color={recipientType === "category" ? Colors.primary : Colors.textSecondary} />
              <Text
                style={[
                  styles.recipientTypeText,
                  recipientType === "category" && styles.recipientTypeTextActive,
                ]}
              >
                Per Categoria
              </Text>
            </TouchableOpacity>
          </View>

          {recipientType === "individual" ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Destinatari (Tecnici)</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowTechnicianModal(true)}
              >
                <Users size={18} color={Colors.primary} />
                <Text style={styles.selectButtonText}>
                  {selectedTechnicianIds.size === 0
                    ? "Seleziona tecnici"
                    : `${selectedTechnicianIds.size} tecnici selezionati`}
                </Text>
                <ChevronDown size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Destinatari (Categorie)</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Tag size={18} color={Colors.primary} />
                <Text style={styles.selectButtonText}>
                  {selectedCategories.size === 0
                    ? "Seleziona categorie"
                    : `${selectedCategories.size} categorie selezionate`}
                </Text>
                <ChevronDown size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titolo</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titolo della notifica"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.dateLabel}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={styles.label}>Data: {getTodayDate()}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Messaggio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Scrivi il messaggio della notifica..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSendNow}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.buttonText}>Invia Ora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSaveForSync}
            >
              <Bell size={20} color={Colors.primary} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Salva per Sincronizzazione
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Notifiche Salvate</Text>
          </View>

          {(!settings.notifications || settings.notifications.length === 0) ? (
            <View style={styles.emptyState}>
              <Bell size={48} color={Colors.textLight} />
              <Text style={styles.emptyStateText}>Nessuna notifica salvata</Text>
            </View>
          ) : (
            <FlatList
              data={settings.notifications || []}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.notificationCard}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <TouchableOpacity onPress={() => handleDeleteNotification(item.id)}>
                      <Trash2 size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.notificationDate}>
                    {new Date(item.date).toLocaleDateString("it-IT")}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={styles.notificationRecipients}>
                    Destinatari: {getRecipientNames(item.recipients, item.recipientCategories)}
                  </Text>
                  {item.sentAt ? (
                    <View style={styles.sentBadge}>
                      <Text style={styles.sentBadgeText}>
                        Inviato il {new Date(item.sentAt).toLocaleDateString("it-IT")}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>In attesa di sincronizzazione</Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showTechnicianModal}
        animationType="slide"
        onRequestClose={() => setShowTechnicianModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleziona Tecnici</Text>
            <TouchableOpacity onPress={() => setShowTechnicianModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={(settings.technicians || []).filter((t) => t.active)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleToggleTechnician(item.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedTechnicianIds.has(item.id) && styles.checkboxSelected,
                  ]}
                >
                  {selectedTechnicianIds.has(item.id) && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowTechnicianModal(false)}
            >
              <Text style={styles.modalButtonText}>Conferma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleziona Categorie</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={settings.technicianCategories || []}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleToggleCategory(item)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedCategories.has(item) && styles.checkboxSelected,
                  ]}
                >
                  {selectedCategories.has(item) && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalButtonText}>Conferma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  section: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginLeft: 8,
  },
  recipientTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  recipientTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recipientTypeButtonActive: {
    backgroundColor: "#EEF2FF",
    borderColor: Colors.primary,
  },
  recipientTypeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  recipientTypeTextActive: {
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dateLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 12,
  },
  notificationCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationRecipients: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  sentBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  sentBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#16A34A",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#D97706",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
