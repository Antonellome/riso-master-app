import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  FlatList,
  Share,
  Platform,
} from "react-native";
import {
  User,
  Lock,
  RefreshCw,
  Database,
  Ship,
  MapPin,
  Users,
  Trash2,
  Plus,
  ChevronRight,
  Save,
  X,
  Send,
  ArrowLeft,
  ChevronDown,
  Tag,
} from "lucide-react-native";
import { useReports } from "@/contexts/ReportContext";

import Colors from "@/constants/colors";

type ManagementType = "technicians" | "ships" | "locations" | "categories";

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addShip,
    updateShip,
    deleteShip,
    addLocation,
    updateLocation,
    deleteLocation,
    clearAllData,
    syncWithTechnicians,
  } = useReports();

  const [showManagementModal, setShowManagementModal] = useState<boolean>(false);
  const [managementType, setManagementType] = useState<ManagementType>("technicians");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>("");
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    type: ManagementType;
  } | null>(null);
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<Set<string>>(new Set());
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<string | null>(null);

  const handleSaveBasicInfo = () => {
    Alert.alert("Successo", "Informazioni salvate");
  };

  const handleSaveSync = () => {
    Alert.alert("Successo", "Impostazioni sincronizzazione salvate");
  };

  const handleSync = async () => {
    if (!settings.syncEnabled) {
      Alert.alert("Errore", "Sincronizzazione non abilitata");
      return;
    }

    if (!settings.syncUrl) {
      Alert.alert("Errore", "URL Server non configurato");
      return;
    }

    Alert.alert(
      "Sincronizzazione",
      "Avviare la sincronizzazione con i dispositivi tecnici?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Sincronizza",
          onPress: async () => {
            try {
              await syncWithTechnicians();
              updateSettings({ lastSyncAt: new Date().toISOString() });
              Alert.alert("Successo", "Sincronizzazione completata");
            } catch {
              Alert.alert("Errore", "Impossibile completare la sincronizzazione");
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Conferma",
      "Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Cancella",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Alert.alert("Completato", "Tutti i dati sono stati cancellati");
          },
        },
      ]
    );
  };

  const openManagementModal = (type: ManagementType) => {
    setManagementType(type);
    setShowManagementModal(true);
  };

  const generateUserId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert("Errore", "Inserisci un nome valido");
      return;
    }

    switch (managementType) {
      case "technicians":
        addTechnician({ name: newItemName.trim(), active: true, userId: generateUserId() });
        break;
      case "ships":
        addShip({ name: newItemName.trim(), active: true });
        break;
      case "locations":
        addLocation({ name: newItemName.trim(), active: true });
        break;
      case "categories":
        if (!(settings.technicianCategories || []).includes(newItemName.trim())) {
          updateSettings({ technicianCategories: [...(settings.technicianCategories || []), newItemName.trim()] });
        }
        break;
    }

    setNewItemName("");
    setShowAddModal(false);
    Alert.alert("Successo", "Elemento aggiunto");
  };

  const handleEditItem = (id: string, name: string) => {
    setEditingItem({ id, name, type: managementType });
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.name.trim()) {
      Alert.alert("Errore", "Inserisci un nome valido");
      return;
    }

    switch (editingItem.type) {
      case "technicians":
        updateTechnician(editingItem.id, { name: editingItem.name.trim() });
        break;
      case "ships":
        updateShip(editingItem.id, { name: editingItem.name.trim() });
        break;
      case "locations":
        updateLocation(editingItem.id, { name: editingItem.name.trim() });
        break;
    }

    setEditingItem(null);
    Alert.alert("Successo", "Elemento modificato");
  };

  const handleToggleActive = (id: string, active: boolean) => {
    switch (managementType) {
      case "technicians":
        updateTechnician(id, { active: !active });
        break;
      case "ships":
        updateShip(id, { active: !active });
        break;
      case "locations":
        updateLocation(id, { active: !active });
        break;
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert("Conferma", `Eliminare "${name}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => {
          switch (managementType) {
            case "technicians":
              deleteTechnician(id);
              break;
            case "ships":
              deleteShip(id);
              break;
            case "locations":
              deleteLocation(id);
              break;
            case "categories":
              const updatedCategories = (settings.technicianCategories || []).filter(c => c !== id);
              updateSettings({ technicianCategories: updatedCategories });
              break;
          }
          Alert.alert("Successo", "Elemento eliminato");
        },
      },
    ]);
  };

  const getManagementData = (): { id: string; name: string; active: boolean; userId?: string; category?: string }[] => {
    switch (managementType) {
      case "technicians":
        return settings.technicians || [];
      case "ships":
        return settings.ships || [];
      case "locations":
        return settings.locations || [];
      case "categories":
        return (settings.technicianCategories || []).map(cat => ({ id: cat, name: cat, active: true }));
    }
  };

  const getManagementTitle = () => {
    switch (managementType) {
      case "technicians":
        return "Gestione Tecnici";
      case "ships":
        return "Gestione Navi";
      case "locations":
        return "Gestione Luoghi";
      case "categories":
        return "Gestione Categorie Tecnici";
    }
  };

  const toggleTechnicianSelection = (id: string) => {
    const newSelection = new Set(selectedTechnicianIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTechnicianIds(newSelection);
  };

  const handleSendConfiguration = async () => {
    if (selectedTechnicianIds.size === 0) {
      Alert.alert("Errore", "Seleziona almeno un tecnico");
      return;
    }

    if (!settings.syncEnabled || !settings.syncUrl || !settings.syncApiKey) {
      Alert.alert(
        "Errore",
        "Configura prima le impostazioni di sincronizzazione (URL Server e API Key)"
      );
      return;
    }

    const selectedTechs = settings.technicians.filter(tech => 
      selectedTechnicianIds.has(tech.id)
    );

    const configData = selectedTechs.map(tech => ({
      technicianName: tech.name,
      userId: tech.userId,
      syncUrl: settings.syncUrl,
      apiKey: settings.syncApiKey,
      companyName: settings.companyName,
      masterUserName: settings.masterUserName,
    }));

    const configText = JSON.stringify(configData, null, 2);
    const fileName = `RISO_Config_${new Date().toISOString().split('T')[0]}.json`;

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([configText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("Successo", "File di configurazione scaricato");
      } else {
        await Share.share({
          message: configText,
          title: "Configurazione R.I.S.O. App",
        });
      }
      setSelectedTechnicianIds(new Set());
    } catch {
      Alert.alert("Errore", "Impossibile inviare la configurazione");
    }
  };

  const closeManagementModal = () => {
    setShowManagementModal(false);
    setSelectedTechnicianIds(new Set());
    setEditingItem(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Informazioni Utente Master</Text>
          </View>

          <Text style={styles.label}>Nome e Cognome</Text>
          <TextInput
            style={styles.input}
            value={settings.masterUserName}
            onChangeText={(text) => updateSettings({ masterUserName: text })}
            placeholder="Inserisci nome e cognome"
          />

          <Text style={styles.label}>Nome Ditta</Text>
          <TextInput
            style={styles.input}
            value={settings.companyName}
            onChangeText={(text) => updateSettings({ companyName: text })}
            placeholder="Inserisci nome ditta"
          />

          <TouchableOpacity style={styles.button} onPress={handleSaveBasicInfo}>
            <Save size={20} color="#fff" />
            <Text style={styles.buttonText}>Salva Informazioni</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Sicurezza</Text>
          </View>

          <Text style={styles.label}>Codice Sicurezza App</Text>
          <TextInput
            style={styles.input}
            value={settings.securityCode}
            onChangeText={(text) => updateSettings({ securityCode: text })}
            placeholder="Inserisci codice sicurezza"
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleSaveBasicInfo}>
            <Save size={20} color="#fff" />
            <Text style={styles.buttonText}>Salva Codice</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RefreshCw size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Sincronizzazione</Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Abilita Sincronizzazione</Text>
            <Switch
              value={settings.syncEnabled}
              onValueChange={(value) => updateSettings({ syncEnabled: value })}
              trackColor={{ false: "#9ca3af", true: "#93c5fd" }}
              thumbColor={settings.syncEnabled ? Colors.primary : "#ffffff"}
              ios_backgroundColor="#9ca3af"
            />
          </View>

          {settings.syncEnabled && (
            <>
              <Text style={styles.label}>URL Server</Text>
              <TextInput
                style={styles.input}
                value={settings.syncUrl}
                onChangeText={(text) => updateSettings({ syncUrl: text })}
                placeholder="https://api.example.com"
                autoCapitalize="none"
              />

              <Text style={styles.label}>API Key</Text>
              <TextInput
                style={styles.input}
                value={settings.syncApiKey}
                onChangeText={(text) => updateSettings({ syncApiKey: text })}
                placeholder="La tua API Key"
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Sincronizzazione Automatica</Text>
                <Switch
                  value={settings.autoSync}
                  onValueChange={(value) => updateSettings({ autoSync: value })}
                  trackColor={{ false: "#9ca3af", true: "#93c5fd" }}
                  thumbColor={settings.autoSync ? Colors.primary : "#ffffff"}
                  ios_backgroundColor="#9ca3af"
                />
              </View>

              {settings.lastSyncAt && (
                <Text style={styles.infoText}>
                  Ultima sincronizzazione:{" "}
                  {new Date(settings.lastSyncAt).toLocaleString("it-IT")}
                </Text>
              )}

              <TouchableOpacity style={styles.button} onPress={handleSaveSync}>
                <Save size={20} color="#fff" />
                <Text style={styles.buttonText}>Salva Impostazioni</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.syncButton]}
                onPress={handleSync}
              >
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.buttonText}>Sincronizza Ora</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Archiviazione Dati</Text>
          </View>

          <View style={styles.storageOptions}>
            <TouchableOpacity
              style={[
                styles.storageOption,
                settings.dataStorage === "device" && styles.storageOptionActive,
              ]}
              onPress={() => updateSettings({ dataStorage: "device" })}
            >
              <Text
                style={[
                  styles.storageOptionText,
                  settings.dataStorage === "device" &&
                    styles.storageOptionTextActive,
                ]}
              >
                Dispositivo (Default)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.storageOption,
                settings.dataStorage === "cloud" && styles.storageOptionActive,
              ]}
              onPress={() => updateSettings({ dataStorage: "cloud" })}
            >
              <Text
                style={[
                  styles.storageOptionText,
                  settings.dataStorage === "cloud" && styles.storageOptionTextActive,
                ]}
              >
                Cloud
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Gestione Database</Text>
          </View>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => openManagementModal("technicians")}
          >
            <View style={styles.managementButtonLeft}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.managementButtonText}>Gestione Tecnici</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => openManagementModal("ships")}
          >
            <View style={styles.managementButtonLeft}>
              <Ship size={20} color={Colors.primary} />
              <Text style={styles.managementButtonText}>Gestione Navi</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => openManagementModal("locations")}
          >
            <View style={styles.managementButtonLeft}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.managementButtonText}>Gestione Luoghi</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => openManagementModal("categories")}
          >
            <View style={styles.managementButtonLeft}>
              <Tag size={20} color={Colors.primary} />
              <Text style={styles.managementButtonText}>Gestione Categorie Tecnici</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Trash2 size={20} color="#fff" />
            <Text style={styles.buttonText}>Cancella Tutti i Dati</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showManagementModal}
        animationType="slide"
        onRequestClose={closeManagementModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={closeManagementModal}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{getManagementTitle()}</Text>
            <TouchableOpacity onPress={closeManagementModal}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={getManagementData()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                {editingItem?.id === item.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editingItem.name}
                      onChangeText={(text) =>
                        setEditingItem({ ...editingItem, name: text })
                      }
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.editSaveButton}
                      onPress={handleSaveEdit}
                    >
                      <Save size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editCancelButton}
                      onPress={() => setEditingItem(null)}
                    >
                      <X size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {managementType === "technicians" && (
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleTechnicianSelection(item.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedTechnicianIds.has(item.id) &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {selectedTechnicianIds.has(item.id) && (
                            <View style={styles.checkboxInner} />
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.listItemLeft}
                      onPress={() => handleEditItem(item.id, item.name)}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          !item.active && styles.listItemTextInactive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {managementType === "technicians" && "userId" in item && (
                        <Text style={styles.userIdText}>Codice: {item.userId}</Text>
                      )}
                      {managementType === "technicians" && (
                        <View style={styles.categorySelector}>
                          <TouchableOpacity
                            style={styles.categoryButton}
                            onPress={() => setShowCategoryDropdown(showCategoryDropdown === item.id ? null : item.id)}
                          >
                            <Text style={styles.categoryButtonText}>
                              {"category" in item && item.category ? item.category : "Seleziona categoria"}
                            </Text>
                            <ChevronDown size={16} color={Colors.textSecondary} />
                          </TouchableOpacity>
                          {showCategoryDropdown === item.id && Array.isArray(settings.technicianCategories) && settings.technicianCategories.length > 0 && (
                            <View style={styles.categoryDropdown}>
                              {settings.technicianCategories.map((cat) => (
                                <TouchableOpacity
                                  key={cat}
                                  style={styles.categoryOption}
                                  onPress={() => {
                                    updateTechnician(item.id, { category: cat });
                                    setShowCategoryDropdown(null);
                                  }}
                                >
                                  <Text style={styles.categoryOptionText}>{cat}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.listItemRight}>
                      {managementType !== "categories" && (
                        <Switch
                          value={item.active}
                          onValueChange={() => handleToggleActive(item.id, item.active)}
                          trackColor={{ false: "#9ca3af", true: "#93c5fd" }}
                          thumbColor={item.active ? Colors.primary : "#ffffff"}
                          ios_backgroundColor="#9ca3af"
                        />
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item.id, item.name)}
                      >
                        <Trash2 size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          />

          <View style={styles.modalFooter}>
            {managementType === "technicians" && selectedTechnicianIds.size > 0 && (
              <TouchableOpacity
                style={styles.sendConfigButton}
                onPress={handleSendConfiguration}
              >
                <Send size={20} color="#fff" />
                <Text style={styles.sendConfigButtonText}>
                  Invia Configurazione ({selectedTechnicianIds.size})
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={24} color="#fff" />
              <Text style={styles.addButtonText}>Aggiungi Nuovo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <Text style={styles.addModalTitle}>Aggiungi Nuovo</Text>
            <TextInput
              style={styles.addModalInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Inserisci nome"
              autoFocus
            />
            <View style={styles.addModalButtons}>
              <TouchableOpacity
                style={styles.addModalCancelButton}
                onPress={() => {
                  setNewItemName("");
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.addModalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addModalConfirmButton}
                onPress={handleAddItem}
              >
                <Text style={styles.addModalConfirmText}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
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
  button: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  syncButton: {
    backgroundColor: "#10B981",
  },
  dangerButton: {
    backgroundColor: "#dc2626",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic" as const,
  },
  storageOptions: {
    flexDirection: "row",
    gap: 12,
  },
  storageOption: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  storageOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EEF2FF",
  },
  storageOptionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  storageOptionTextActive: {
    color: Colors.primary,
  },
  managementButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginBottom: 12,
  },
  managementButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  managementButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
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
  listContainer: {
    padding: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  listItemTextInactive: {
    color: Colors.textLight,
    textDecorationLine: "line-through" as const,
  },
  listItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  editContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  editSaveButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 8,
  },
  editCancelButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  checkboxContainer: {
    marginRight: 12,
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
  userIdText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: "monospace" as const,
  },
  modalFooter: {
    padding: 16,
    gap: 12,
  },
  sendConfigButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  sendConfigButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  addModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  addModalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  addModalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
    color: Colors.text,
    marginBottom: 16,
  },
  addModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  addModalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addModalCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  addModalConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  addModalConfirmText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  categorySelector: {
    marginTop: 8,
    position: "relative" as const,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  categoryDropdown: {
    position: "absolute" as const,
    top: 36,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  categoryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
});
