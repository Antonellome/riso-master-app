# 📋 INFORMAZIONI APP MASTER R.I.S.O. - PER APP TECNICI

Documento con tutte le specifiche dell'App Master per garantire compatibilità con App Tecnici.

---

## 🎨 PALETTE COLORI APP MASTER

```typescript
export const Colors = {
  primary: "#2563eb",         // Blu primario
  background: "#f9fafb",      // Grigio chiaro sfondo
  cardBackground: "#ffffff",  // Bianco card
  text: "#111827",           // Grigio scuro testo
  textSecondary: "#6b7280",  // Grigio medio
  textLight: "#9ca3af",      // Grigio chiaro
  border: "#e5e7eb",         // Grigio bordi
  success: "#10b981",        // Verde successo
  warning: "#f59e0b",        // Arancione warning
  error: "#ef4444",          // Rosso errore
  info: "#3b82f6",          // Blu info
};
```

### Colori Badge Tipo Turno
```typescript
const shiftTypeColors = {
  "Ordinaria": { bg: "#eff6ff", text: "#2563eb" },      // Blu
  "Straordinaria": { bg: "#fef3c7", text: "#d97706" },  // Giallo
  "Festiva": { bg: "#fee2e2", text: "#dc2626" },        // Rosso
  "Ferie": { bg: "#d1fae5", text: "#059669" },          // Verde
  "Permesso": { bg: "#e0e7ff", text: "#6366f1" },       // Indaco
  "Malattia": { bg: "#fce7f3", text: "#db2777" },       // Rosa
  "104": { bg: "#dbeafe", text: "#0284c7" },            // Azzurro
};
```

---

## 📊 STRUTTURA DATI COMPLETA

### Report (Rapportino)
```typescript
export interface Report {
  id: string;                    // Timestamp o UUID
  userId?: string;               // ID tecnico proprietario
  date: string;                  // ISO 8601: "2025-01-16"
  shiftType: ShiftType;          // Tipo turno
  startTime: string;             // "08:00"
  endTime: string;               // "17:00"
  pauseMinutes: number;          // 60 (minuti)
  ship: string;                  // "MSC Magnifica"
  location: string;              // "Porto di Genova"
  description: string;           // Descrizione lavoro
  materials: string;             // Materiali usati
  workDone: string;              // Lavoro svolto
  technicians: ReportTechnician[]; // Array tecnici
  createdAt: number;             // 1737043200000 (Unix timestamp)
  updatedAt: number;             // 1737043200000 (Unix timestamp)
  version?: number;              // Versione per conflict resolution
  syncedAt?: number;             // Timestamp ultima sincronizzazione
  deviceId?: string;             // ID dispositivo origine
}

export type ShiftType = 
  | "Ordinaria" 
  | "Straordinaria" 
  | "Festiva" 
  | "Ferie" 
  | "Permesso" 
  | "Malattia" 
  | "104";

export interface ReportTechnician {
  id: string;                    // ID tecnico
  name: string;                  // "Marco Rossi"
  startTime: string;             // "08:00"
  endTime: string;               // "17:00"
}
```

### Notification (Notifica)
```typescript
export interface Notification {
  id: string;                              // UUID univoco
  title: string;                           // "Intervento Urgente"
  message: string;                         // Testo completo notifica
  date: string;                            // ISO 8601: "2025-01-16"
  timestamp: number;                       // 1737043200000
  read?: boolean;                          // Stato lettura (opzionale)
  priority: "low" | "normal" | "high";
  type: "info" | "warning" | "alert";
  
  // IMPORTANTE: Gestione destinatari
  recipients: string[];                    // Array userId destinatari
  recipientCategories: string[];           // Array categorie destinatari
  targetUsers?: string[];                  // ⚠️ CONVERSIONE per app tecnici
  
  createdAt: string;                       // ISO 8601
  createdBy?: string;                      // ID master
  sentAt?: string;                         // Timestamp invio
}
```

**⚠️ NOTA IMPORTANTE - Conversione Notifiche:**

L'App Master usa `recipients` e `recipientCategories`, ma l'App Tecnici usa `targetUsers`.

**Conversione durante la sincronizzazione:**
```typescript
// Nell'App Master, quando si invia la notifica:
const targetUsers: string[] = [];

// 1. Aggiungi destinatari diretti
if (notification.recipients.length > 0) {
  targetUsers.push(...notification.recipients);
}

// 2. Converti categorie → userId
if (notification.recipientCategories.length > 0) {
  notification.recipientCategories.forEach(category => {
    const techsInCategory = settings.technicians
      .filter(t => t.category === category && t.active)
      .map(t => t.userId);
    targetUsers.push(...techsInCategory);
  });
}

// 3. Rimuovi duplicati
const uniqueTargets = Array.from(new Set(targetUsers));

// 4. Se nessun destinatario specificato, invia a tutti
const finalTargetUsers = uniqueTargets.length > 0 ? uniqueTargets : ["all"];
```

### Technician (Tecnico)
```typescript
export interface Technician {
  id: string;                    // ID univoco (generato da master)
  name: string;                  // "Marco Rossi"
  email?: string;                // Email (opzionale)
  phone?: string;                // Telefono (opzionale)
  active: boolean;               // Stato attivo/disattivo
  userId: string;                // Codice univoco (es: "A1B2C3")
  category?: string;             // Categoria (es: "Elettricista")
}
```

### Ship (Nave)
```typescript
export interface Ship {
  id: string;                    // ID univoco
  name: string;                  // "MSC Magnifica"
  active: boolean;               // Stato attivo/disattivo
}
```

### Location (Luogo)
```typescript
export interface Location {
  id: string;                    // ID univoco
  name: string;                  // "Porto di Genova"
  active: boolean;               // Stato attivo/disattivo
}
```

### TechnicianCategory
```typescript
export interface TechnicianCategory {
  category: string;              // "Elettricista"
  technicians: string[];         // ["Marco Rossi", "Luigi Bianchi"]
}
```

---

## 🔄 FLUSSO SINCRONIZZAZIONE

### 1. Notifiche: Master → Tecnici

```typescript
// App Master invia notifica
async function sendNotificationToTechnicians() {
  // 1. Crea notifica nell'app master
  const notification: Notification = {
    id: Date.now().toString(),
    title: "Intervento Urgente",
    message: "Richiesto intervento sulla nave MSC Magnifica",
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    priority: "high",
    type: "alert",
    recipients: ["A1B2C3"],              // User ID specifici
    recipientCategories: ["Elettricista"], // O categorie
    createdAt: new Date().toISOString(),
  };
  
  // 2. Converti a formato app tecnici
  const targetUsers = convertRecipientsToTargetUsers(notification);
  
  // 3. Invia al server sync
  await mockSyncServer.addNotification({
    ...notification,
    targetUsers: targetUsers,
    createdBy: settings.masterUserId || "master",
  });
}
```

### 2. Categorie Tecnici: Master → Tecnici

```typescript
// App Master sincronizza categorie
async function syncTechnicianCategories() {
  const categories: TechnicianCategory[] = settings.technicianCategories.map(category => {
    const techniciansInCategory = settings.technicians
      .filter(t => t.category === category && t.active)
      .map(t => t.name)
      .sort((a, b) => a.localeCompare(b, 'it'));
    
    return {
      category,
      technicians: techniciansInCategory,
    };
  });
  
  await mockSyncServer.setTechnicians(categories);
}
```

### 3. Navi e Luoghi: Master → Tecnici

```typescript
// App Master sincronizza navi e luoghi
async function syncShipsAndLocations() {
  const ships = settings.ships
    .filter(s => s.active)
    .map(s => s.name)
    .sort((a, b) => a.localeCompare(b, 'it'));
  
  const locations = settings.locations
    .filter(l => l.active)
    .map(l => l.name)
    .sort((a, b) => a.localeCompare(b, 'it'));
  
  await mockSyncServer.setShipsAndLocations({
    ships,
    locations,
  });
}
```

### 4. Rapportini: Tecnici → Master

```typescript
// App Master riceve rapportini dai tecnici
async function receiveReportsFromTechnicians() {
  const result = await mockSyncServer.getAllReports();
  
  if (result.success && result.data) {
    // Importa rapportini con gestione conflitti
    importReports(result.data);
  }
}
```

---

## 📡 API MOCKSYNCSERVER

### Gestione Notifiche

```typescript
// Aggiungere notifica (usato da Master)
await mockSyncServer.addNotification({
  id: string,
  title: string,
  message: string,
  date: string,
  timestamp: number,
  priority: "low" | "normal" | "high",
  type: "info" | "warning" | "alert",
  targetUsers: string[],  // ["userId1", "userId2"] o ["all"]
  createdBy: string,
});

// Recuperare notifiche (usato da Tecnici)
const result = await mockSyncServer.getUserNotifications(userId, apiKey);
```

### Gestione Categorie Tecnici

```typescript
// Salvare categorie (usato da Master)
await mockSyncServer.setTechnicians([
  { category: "Elettricista", technicians: ["Marco", "Luigi"] },
  { category: "Meccanico", technicians: ["Paolo", "Andrea"] },
]);

// Recuperare categorie (usato da Tecnici)
const result = await mockSyncServer.getTechnicians();
```

### Gestione Navi e Luoghi

```typescript
// Salvare ships/locations (usato da Master)
await mockSyncServer.setShipsAndLocations({
  ships: ["MSC Magnifica", "Costa Pacifica"],
  locations: ["Porto di Genova", "Porto di Napoli"],
});

// Recuperare ships/locations (usato da Tecnici)
const result = await mockSyncServer.getShipsAndLocations();
```

### Gestione Rapportini

```typescript
// Recuperare tutti i rapportini (usato da Master)
const result = await mockSyncServer.getAllReports();

// Salvare rapportini utente (usato da Tecnici)
await mockSyncServer.syncUserData(userId, apiKey, reports);
```

---

## 🔐 FORMATO FILE CONFIGURAZIONE

### File Generato da Master per Tecnici

```json
{
  "technicianName": "Marco Rossi",
  "technicianId": "tech1",
  "userId": "A1B2C3",
  "syncUrl": "https://api.riso.com",
  "apiKey": "api-key-secret-123456",
  "companyName": "R.I.S.O. Master",
  "masterUserName": "Admin Principale"
}
```

### Campi Essenziali (Minimo)
Se l'app tecnici non supporta tutti i campi:
```json
{
  "syncUrl": "https://api.riso.com",
  "userId": "A1B2C3",
  "apiKey": "api-key-secret-123456",
  "autoSync": false
}
```

---

## 💾 STORAGE KEYS ASYNCSTORAGE

### App Master (Locale)
```
@riso_master_reports          // Rapportini ricevuti dai tecnici
@riso_master_settings         // Impostazioni master
```

### MockSyncServer (Condiviso tra Master e Tecnici)
```
@riso_sync_server_users              // Utenti registrati
@riso_sync_server_reports            // Rapportini di tutti i tecnici
@riso_sync_server_notifications      // Notifiche inviate dal master
@riso_sync_server_technicians        // Categorie tecnici
@riso_sync_server_ships_locations    // Navi e luoghi
```

---

## ⚙️ IMPOSTAZIONI SINCRONIZZAZIONE

```typescript
export interface MasterSettings {
  // Informazioni Base
  companyName: string;          // Nome ditta
  masterUserName: string;       // Nome utente master
  securityCode: string;         // Codice sicurezza app
  
  // Sincronizzazione
  syncEnabled: boolean;         // Sincronizzazione attiva
  syncUrl: string;              // URL server
  syncApiKey: string;           // API Key
  autoSync: boolean;            // Sync automatica
  lastSyncAt?: string;          // Ultima sincronizzazione
  
  // Storage
  dataStorage: 'device' | 'cloud';
  
  // Database
  technicians: Technician[];
  ships: Ship[];
  locations: Location[];
  technicianCategories: string[];
  notifications: Notification[];
  
  // Versioning
  appVersion: string;           // "1.0.0"
  dataSchemaVersion: number;    // 1
  
  // Conflict Resolution
  syncConflictResolution: 'master-wins' | 'technician-wins' | 'manual';
  masterUserId?: string;
}
```

---

## 🎯 STRATEGIA CONFLICT RESOLUTION

### Opzioni Disponibili

1. **master-wins** (Default)
   - Il master sovrascrive sempre i dati dei tecnici
   - Usato quando il master è la fonte di verità

2. **technician-wins**
   - I tecnici sovrascrivono sempre i dati del master
   - Usato quando i tecnici lavorano offline e hanno priorità

3. **manual**
   - L'utente sceglie quale versione tenere
   - Usato quando è necessario controllo totale

### Implementazione

```typescript
// Quando si importano rapportini dai tecnici
function importReports(newReports: Report[]) {
  newReports.forEach(newReport => {
    const existing = reports.find(r => r.id === newReport.id);
    
    if (!existing) {
      // Nuovo rapportino, aggiungi sempre
      reports.push(newReport);
    } else {
      // Conflitto: rapportino esiste già
      switch (settings.syncConflictResolution) {
        case 'master-wins':
          // Non fare nulla, mantieni versione master
          break;
          
        case 'technician-wins':
          // Sovrascrivi con versione tecnico
          reports[index] = { ...newReport, version: existing.version + 1 };
          break;
          
        case 'manual':
          // Mostra UI per scelta manuale
          showConflictResolutionUI(existing, newReport);
          break;
      }
    }
  });
}
```

---

## 📊 VISUALIZZAZIONE REPORT

### Layout Card Rapportino

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────┐  ┌─────────────────────┐│
│ │ 📅 16 gen 2025  │  │ [Ordinaria Badge]   ││
│ └─────────────────┘  └─────────────────────┘│
│                                              │
│ Manutenzione ordinaria impianti elettrici   │
│                                              │
│ 🚢 Nave: MSC Magnifica                      │
│ 📍 Luogo: Porto di Genova                   │
│ 👤 Tecnico: Marco Rossi                     │
│ 🕐 Orario: 08:00 - 17:00 (8.00h)           │
│                                         ✏️  │
└─────────────────────────────────────────────┘
```

### Stile Card
```typescript
const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};
```

---

## 📄 FORMATO EXPORT PDF (Proposto)

```
╔══════════════════════════════════════════════╗
║       Report Giornaliero di [Tecnico]       ║
║       della ditta [Ditta]                   ║
╠══════════════════════════════════════════════╣
║  Data: 16 gennaio 2025                      ║
║  Nave: MSC Magnifica                        ║
║  Luogo: Porto di Genova                     ║
╠══════════════════════════════════════════════╣
║  DESCRIZIONE LAVORO                         ║
║  Manutenzione ordinaria impianti elettrici  ║
║                                              ║
║  MATERIALI UTILIZZATI                       ║
║  Cavi elettrici, connettori, fusibili       ║
║                                              ║
║  LAVORO SVOLTO                              ║
║  Sostituzione impianto cabina 205           ║
╠══════════════════════════════════════════════╣
║  TECNICI PRESENTI                           ║
║  ┌────────────────────────────────────────┐ ║
║  │ Nome      │ Inizio│ Fine │ Ore Totali │ ║
║  ├────────────────────────────────────────┤ ║
║  │ Marco R.  │ 08:00 │17:00 │   8.00h    │ ║
║  └────────────────────────────────────────┘ ║
║                                              ║
║  TOTALE ORE REPORT: 8.00h                   ║
╠══════════════════════════════════════════════╣
║  Generato il 16/01/2025 alle 14:30         ║
╚══════════════════════════════════════════════╝
```

---

## ✅ CHECKLIST COMPATIBILITÀ

### Dati
- [x] Report con userId salvato
- [x] Campo version implementato
- [x] Timestamp Unix millisecondi
- [x] Date ISO 8601 (YYYY-MM-DD)
- [x] Orari formato HH:MM

### Notifiche
- [x] Conversione recipients → targetUsers
- [x] Supporto targetUsers: ["all"]
- [x] Badge notifiche non lette
- [x] Colori priorità corretti

### Sincronizzazione
- [x] Categorie tecnici con ordinamento
- [x] Ships/Locations sincronizzabili
- [x] Conflict resolution configurabile
- [x] File configurazione generato

### MockSyncServer
- [x] API notifiche implementate
- [x] API categorie implementate
- [x] API ships/locations implementate
- [x] Storage condiviso funzionante

---

## 🚀 FLUSSO ONBOARDING TECNICO

1. **Master aggiunge tecnico** nelle impostazioni
   - Nome: "Marco Rossi"
   - Categoria: "Elettricista"
   - Genera userId: "A1B2C3"

2. **Master genera configurazione**
   - Seleziona tecnico
   - Clicca "Invia Configurazione"
   - Scarica file JSON

3. **Tecnico importa configurazione**
   - Apre app tecnici
   - Importa file JSON
   - Campi precompilati automaticamente

4. **Tecnico si sincronizza**
   - Scarica categorie tecnici
   - Scarica navi e luoghi
   - Riceve notifiche

5. **Tecnico crea rapportini**
   - Crea rapportini localmente
   - Sincronizza con master
   - Master riceve e visualizza

---

## 📞 CONTATTI E SUPPORTO

Per domande sulla compatibilità o implementazione:

- Verificare sempre il documento: `TEST_COMUNICAZIONE_APP_TECNICI.md`
- Consultare: `COMPATIBILITA_APP.md`
- Eseguire i test descritti nella documentazione

---

📅 **Data Creazione:** 2025-01-16  
📝 **Versione:** 1.0  
👤 **Autore:** App Master R.I.S.O.  
🔗 **Documento Correlato:** `TEST_COMUNICAZIONE_APP_TECNICI.md`
