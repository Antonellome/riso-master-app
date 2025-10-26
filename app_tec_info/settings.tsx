// app_tec_info/settings.tsx
// CODICE APP TECNICI PER RIFERIMENTO
// Questo file serve come riferimento per le variabili e conteggi dell'app tecnici

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Settings, User, Clock, Database, Upload, DollarSign, Ship, MapPin, Users, LogOut } from 'lucide-react-native';

interface HourlyRate {
  type: string;
  rate: number;
}

interface WorkSettings {
  defaultStartTime: string;
  defaultEndTime: string;
  defaultPauseMinutes: number;
  hourlyRates: HourlyRate[];
}

interface UserSettings {
  name: string;
  company: string;
}

interface SyncSettings {
  enabled: boolean;
  serverUrl: string;
  userId: string;
  apiKey: string;
  autoSync: boolean;
}

export default function SettingsScreen() {
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: '',
    company: ''
  });
  const [workSettings, setWorkSettings] = useState<WorkSettings>({
    defaultStartTime: '08:00',
    defaultEndTime: '17:00',
    defaultPauseMinutes: 60,
    hourlyRates: [
      { type: 'Ordinario', rate: 15 },
      { type: 'Straordinario', rate: 20 },
      { type: 'Festivo', rate: 25 },
    ]
  });
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    enabled: false,
    serverUrl: '',
    userId: '',
    apiKey: '',
    autoSync: false,
  });

  const handleSaveUserSettings = () => {
    Alert.alert('Successo', 'Impostazioni utente salvate');
  };

  const handleSaveWorkSettings = () => {
    Alert.alert('Successo', 'Impostazioni lavoro salvate');
  };

  const handleSaveSyncSettings = () => {
    Alert.alert('Successo', 'Impostazioni sincronizzazione salvate');
  };

  const handleClearData = () => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Cancella',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Completato', 'Tutti i dati sono stati cancellati');
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      Alert.alert('Successo', 'Dati esportati con successo');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile esportare i dati');
    }
  };

  const handleImport = async () => {
    try {
      Alert.alert('Successo', 'Dati importati con successo');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile importare i dati');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: () => {
            console.log('Logout');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Impostazioni',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sezione Utente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Dati Utente</Text>
          </View>
          
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={userSettings.name}
            onChangeText={(text) => setUserSettings({ ...userSettings, name: text })}
            placeholder="Inserisci il tuo nome"
          />

          <Text style={styles.label}>Azienda</Text>
          <TextInput
            style={styles.input}
            value={userSettings.company}
            onChangeText={(text) => setUserSettings({ ...userSettings, company: text })}
            placeholder="Inserisci nome azienda"
          />

          <TouchableOpacity style={styles.button} onPress={handleSaveUserSettings}>
            <Text style={styles.buttonText}>Salva Dati Utente</Text>
          </TouchableOpacity>
        </View>

        {/* Sezione Orari di Lavoro */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Orari di Lavoro</Text>
          </View>

          <Text style={styles.label}>Ora Inizio Predefinita</Text>
          <TextInput
            style={styles.input}
            value={workSettings.defaultStartTime}
            onChangeText={(text) => setWorkSettings({ ...workSettings, defaultStartTime: text })}
            placeholder="08:00"
          />

          <Text style={styles.label}>Ora Fine Predefinita</Text>
          <TextInput
            style={styles.input}
            value={workSettings.defaultEndTime}
            onChangeText={(text) => setWorkSettings({ ...workSettings, defaultEndTime: text })}
            placeholder="17:00"
          />

          <Text style={styles.label}>Pausa Predefinita (minuti)</Text>
          <TextInput
            style={styles.input}
            value={String(workSettings.defaultPauseMinutes)}
            onChangeText={(text) => setWorkSettings({ ...workSettings, defaultPauseMinutes: parseInt(text) || 0 })}
            keyboardType="numeric"
            placeholder="60"
          />

          <TouchableOpacity style={styles.button} onPress={handleSaveWorkSettings}>
            <Text style={styles.buttonText}>Salva Orari</Text>
          </TouchableOpacity>
        </View>

        {/* Sezione Tariffe Orarie */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Tariffe Orarie</Text>
          </View>

          {workSettings.hourlyRates.map((rate: HourlyRate, index: number) => (
            <View key={rate.type} style={styles.rateRow}>
              <Text style={styles.rateLabel}>{rate.type}</Text>
              <TextInput
                style={styles.rateInput}
                value={String(rate.rate)}
                onChangeText={(text) => {
                  const newRates = [...workSettings.hourlyRates];
                  newRates[index] = { ...rate, rate: parseFloat(text) || 0 };
                  setWorkSettings({ ...workSettings, hourlyRates: newRates });
                }}
                keyboardType="numeric"
                placeholder="0.00"
              />
              <Text style={styles.rateCurrency}>€/h</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={handleSaveWorkSettings}>
            <Text style={styles.buttonText}>Salva Tariffe</Text>
          </TouchableOpacity>
        </View>

        {/* Sezione Sincronizzazione */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Upload size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Sincronizzazione</Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Abilita Sincronizzazione</Text>
            <Switch
              value={syncSettings.enabled}
              onValueChange={(value) => setSyncSettings({ ...syncSettings, enabled: value })}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={syncSettings.enabled ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          {syncSettings.enabled && (
            <>
              <Text style={styles.label}>URL Server</Text>
              <TextInput
                style={styles.input}
                value={syncSettings.serverUrl}
                onChangeText={(text) => setSyncSettings({ ...syncSettings, serverUrl: text })}
                placeholder="https://api.example.com"
                autoCapitalize="none"
              />

              <Text style={styles.label}>User ID</Text>
              <TextInput
                style={styles.input}
                value={syncSettings.userId}
                onChangeText={(text) => setSyncSettings({ ...syncSettings, userId: text })}
                placeholder="Il tuo User ID"
                autoCapitalize="none"
              />

              <Text style={styles.label}>API Key</Text>
              <TextInput
                style={styles.input}
                value={syncSettings.apiKey}
                onChangeText={(text) => setSyncSettings({ ...syncSettings, apiKey: text })}
                placeholder="La tua API Key"
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Sincronizzazione Automatica</Text>
                <Switch
                  value={syncSettings.autoSync}
                  onValueChange={(value) => setSyncSettings({ ...syncSettings, autoSync: value })}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={syncSettings.autoSync ? '#2563eb' : '#f3f4f6'}
                />
              </View>
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSaveSyncSettings}>
            <Text style={styles.buttonText}>Salva Sincronizzazione</Text>
          </TouchableOpacity>
        </View>

        {/* Sezione Gestione Dati */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Gestione Dati</Text>
          </View>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleExport}>
            <Text style={styles.secondaryButtonText}>Esporta Dati</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleImport}>
            <Text style={styles.secondaryButtonText}>Importa Dati</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearData}>
            <Text style={styles.buttonText}>Cancella Tutti i Dati</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <LogOut size={20} color="#fff" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Esci</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  logoutButton: {
    backgroundColor: '#6b7280',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  rateLabel: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
  },
  rateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    width: 100,
    textAlign: 'right',
    marginRight: 8,
  },
  rateCurrency: {
    fontSize: 14,
    color: '#6b7280',
    width: 40,
  },
});
