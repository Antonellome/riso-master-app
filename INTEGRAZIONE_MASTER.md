# 📋 GUIDA ALL'INTEGRAZIONE RISO APP ↔ RISO MASTER

## 🎯 Panoramica

Questa guida spiega come integrare RISO Master con le app RISO dei tecnici per sincronizzare dati, notifiche e configurazioni.

---

## 🔄 Come Funziona la Sincronizzazione

### Storage Condiviso
- **RISO App** (tecnici): Salva i dati localmente e li invia allo storage condiviso
- **RISO Master**: Legge dallo storage condiviso per visualizzare tutti i report
- **MockSyncServer**: Gestisce lo storage condiviso tra tutte le app

### Flusso dei Dati
```
RISO App Tecnico 1 ──┐
                      │
RISO App Tecnico 2 ──┼──→ MockSyncServer (Storage Condiviso) ←── RISO Master
                      │
RISO App Tecnico N ──┘
```

---

## 📱 CONFIGURAZIONE RISO MASTER

### 1. Abilitare la Sincronizzazione

1. Apri **RISO Master**
2. Vai su **Impostazioni** → **Sincronizzazione**
3. Attiva **"Abilita Sincronizzazione"**
4. Configura:
   - **URL Server**: `https://sync.riso.app` (o personalizzato)
   - **API Key**: Una chiave condivisa tra Master e App tecnici
   - **Sincronizzazione Automatica**: (opzionale) Attiva per sync automatica

### 2. Gestire i Tecnici

1. Vai su **Impostazioni** → **Gestione Database** → **Gestione Tecnici**
2. Aggiungi i tecnici che useranno RISO App
3. Ogni tecnico avrà un **Codice Univoco** (es: `TECH01`)
4. Assegna una **Categoria** ad ogni tecnico (es: "Elettricista", "Meccanico")

### 3. Generare File di Configurazione per i Tecnici

**Opzione A: Generazione Manuale**

1. Vai su **Impostazioni** → **Gestione Tecnici**
2. Seleziona uno o più tecnici (spunta le checkbox)
3. Clicca su **"Invia Configurazione"**
4. Il sistema genera un file JSON con le credenziali
5. Invia il file ai tecnici via email/WhatsApp

**Struttura del File di Configurazione:**
```json
[
  {
    "technicianName": "Mario Rossi",
    "userId": "TECH01",
    "syncUrl": "https://sync.riso.app",
    "apiKey": "chiave_condivisa_12345",
    "companyName": "R.I.S.O. Master",
    "masterUserName": "Admin"
  }
]
```

**Opzione B: Generazione Automatica via Codice**

Puoi anche generare file di configurazione programmaticamente:

```typescript
function generateSyncConfig(
  userId: string,
  technicianName: string,
  companyName: string
) {
  const config = {
    serverUrl: "https://sync.riso.app",
    userId: userId,
    apiKey: generateApiKey(), // Funzione per generare una chiave univoca
    technicianName: technicianName,
    companyName: companyName,
    autoSync: true,
  };

  return JSON.stringify(config, null, 2);
}

function generateApiKey() {
  return `key_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

---

## 📲 CONFIGURAZIONE RISO APP (TECNICI)

### Metodo 1: Importare il File di Configurazione

1. Il tecnico riceve il file JSON dalla Master
2. Apre **RISO App** → **Impostazioni** → **Sincronizzazione**
3. Clicca su **"Importa configurazione sync"**
4. Seleziona il file JSON ricevuto
5. La sincronizzazione viene attivata automaticamente

### Metodo 2: Configurazione Manuale

1. Apri **RISO App** → **Impostazioni** → **Sincronizzazione**
2. Attiva **"Sincronizzazione dati"**
3. Compila i campi:
   - **ID Utente**: Il codice univoco del tecnico (es: `TECH01`)
   - **Chiave API**: La chiave condivisa con la Master
   - **URL Server**: (opzionale, usa il valore predefinito)
4. Attiva **"Sincronizzazione automatica"** (opzionale)

---

## 🔧 FUNZIONALITÀ MASTER

### 1. Leggere Report da Tutte le App

```typescript
import { mockSyncServer } from '@/utils/mockSyncServer';

// Leggere tutti i report
const result = await mockSyncServer.getAllReports();
if (result.success && result.data) {
  const allReports = result.data;
  console.log(`📊 Trovati ${allReports.length} report totali`);
}

// Filtrare per tecnico specifico
const reportsTech01 = await mockSyncServer.getAllReports("TECH01");
if (reportsTech01.success && reportsTech01.data) {
  console.log(`📋 Report del tecnico TECH01: ${reportsTech01.data.length}`);
}
```

### 2. Visualizzare Utenti Registrati

```typescript
// Leggere tutti gli utenti sincronizzati
const usersResult = await mockSyncServer.getAllUsers();
if (usersResult.success && usersResult.data) {
  const allTechnicians = usersResult.data;
  allTechnicians.forEach(user => {
    console.log(`👤 ${user.technicianName} (${user.userId})`);
    console.log(`   Ultima sincronizzazione: ${user.lastSync}`);
  });
}
```

### 3. Inviare Notifiche ai Tecnici

**Inviare a Tutti:**
```typescript
await mockSyncServer.addNotification({
  id: Date.now().toString(),
  title: "Riunione Importante",
  message: "Riunione domani alle 9:00 in sede",
  date: "2025-01-15",
  timestamp: Date.now(),
  priority: "high",
  type: "alert",
  targetUsers: ["all"],
  createdBy: "master",
});
```

**Inviare a Tecnici Specifici:**
```typescript
await mockSyncServer.addNotification({
  id: Date.now().toString(),
  title: "Intervento Urgente",
  message: "Nave MSC Magnifica - Guasto elettrico",
  date: "2025-01-15",
  timestamp: Date.now(),
  priority: "high",
  type: "alert",
  targetUsers: ["TECH01", "TECH02"],
  createdBy: "master",
});
```

**Inviare per Categoria:**
```typescript
// Prima recupera i tecnici della categoria
const elettricisti = settings.technicians
  .filter(t => t.category === "Elettricista" && t.active)
  .map(t => t.userId);

await mockSyncServer.addNotification({
  id: Date.now().toString(),
  title: "Aggiornamento Procedure",
  message: "Nuove procedure di sicurezza elettrica",
  date: "2025-01-15",
  timestamp: Date.now(),
  priority: "normal",
  type: "info",
  targetUsers: elettricisti,
  createdBy: "master",
});
```

### 4. Aggiornare Liste Centralizzate

**Tecnici:**
```typescript
const technicianCategories = [
  {
    category: "Elettricisti",
    technicians: ["Mario Rossi", "Luigi Verdi"],
  },
  {
    category: "Meccanici",
    technicians: ["Paolo Bianchi", "Anna Neri"],
  },
];

await mockSyncServer.setTechnicians(technicianCategories);
```

**Navi e Località:**
```typescript
await mockSyncServer.setShipsAndLocations({
  ships: ["MSC Magnifica", "Costa Pacifica", "Carnival Dream"],
  locations: ["Porto di Genova", "Porto di Civitavecchia", "Porto di Napoli"],
});
```

### 5. Sincronizzazione Completa

Il metodo `syncWithTechnicians()` già implementato nel context fa tutto automaticamente:

```typescript
// Sincronizza notifiche, tecnici, navi e località
await syncWithTechnicians();
```

Questo metodo:
- ✅ Invia tutte le notifiche non inviate
- ✅ Sincronizza categorie tecnici
- ✅ Sincronizza navi e località
- ✅ Aggiorna il timestamp dell'ultima sincronizzazione

---

## 🗂️ STRUTTURA STORAGE CONDIVISO

Lo storage condiviso (`mockSyncServer.ts`) gestisce:

### Reports
```typescript
{
  reports: [
    {
      id: "1234567890",
      date: "2025-01-15",
      ship: "MSC Magnifica",
      location: "Porto di Genova",
      shiftType: "Ordinaria",
      userId: "TECH01",
      syncedAt: 1705324800000,
      // ... altri campi report
    }
  ]
}
```

### Users
```typescript
{
  users: [
    {
      userId: "TECH01",
      technicianName: "Mario Rossi",
      companyName: "R.I.S.O. Master",
      lastSync: "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Notifications
```typescript
{
  notifications: [
    {
      id: "1234567890",
      title: "Riunione",
      message: "Riunione domani alle 9:00",
      date: "2025-01-15",
      timestamp: 1705324800000,
      priority: "high",
      type: "alert",
      targetUsers: ["all"],
      createdBy: "master"
    }
  ]
}
```

### Technicians
```typescript
{
  technicians: [
    {
      category: "Elettricisti",
      technicians: ["Mario Rossi", "Luigi Verdi"]
    }
  ]
}
```

### Ships and Locations
```typescript
{
  shipsAndLocations: {
    ships: ["MSC Magnifica", "Costa Pacifica"],
    locations: ["Porto di Genova", "Porto di Civitavecchia"]
  }
}
```

---

## ✅ CHECKLIST INTEGRAZIONE

### Setup Iniziale Master
- [ ] Abilitare sincronizzazione in Impostazioni
- [ ] Configurare URL Server e API Key
- [ ] Creare lista tecnici con codici univoci
- [ ] Assegnare categorie ai tecnici
- [ ] Configurare lista navi
- [ ] Configurare lista località

### Distribuzione alle App
- [ ] Generare file di configurazione per ogni tecnico
- [ ] Inviare file ai tecnici (email/WhatsApp)
- [ ] Verificare che ogni tecnico importi la configurazione
- [ ] Testare prima sincronizzazione

### Test Funzionalità
- [ ] Creare un report da RISO App
- [ ] Verificare che appaia su RISO Master
- [ ] Inviare una notifica da Master
- [ ] Verificare ricezione su RISO App
- [ ] Testare aggiornamento liste centralizzate

---

## 🔍 DEBUGGING

### Verificare Storage Condiviso
```typescript
// Controllare lo stato dello storage
const storage = await AsyncStorage.getItem("@riso_sync_storage");
console.log("📦 Storage:", JSON.parse(storage || "{}"));
```

### Log di Sincronizzazione
Il sistema già include log dettagliati:
- ✅ `Notifica "..." inviata a N tecnici`
- ✅ `N categorie tecnici sincronizzate`
- ✅ `N navi e N luoghi sincronizzati`
- ❌ `Errore durante la sincronizzazione: ...`

---

## 🚀 ESEMPIO COMPLETO

```typescript
import { mockSyncServer } from '@/utils/mockSyncServer';

async function masterExample() {
  // 1. Leggere tutti i report
  const reportsResult = await mockSyncServer.getAllReports();
  console.log(`📊 Report totali: ${reportsResult.data?.length || 0}`);

  // 2. Leggere tutti gli utenti
  const usersResult = await mockSyncServer.getAllUsers();
  console.log(`👥 Utenti registrati: ${usersResult.data?.length || 0}`);

  // 3. Inviare notifica
  await mockSyncServer.addNotification({
    id: Date.now().toString(),
    title: "Test Notifica",
    message: "Questa è una notifica di test",
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    priority: "normal",
    type: "info",
    targetUsers: ["all"],
    createdBy: "master",
  });

  // 4. Aggiornare tecnici
  await mockSyncServer.setTechnicians([
    { category: "Elettricisti", technicians: ["Mario", "Luigi"] },
    { category: "Meccanici", technicians: ["Paolo", "Anna"] },
  ]);

  // 5. Aggiornare navi e località
  await mockSyncServer.setShipsAndLocations({
    ships: ["Nave Alpha", "Nave Beta"],
    locations: ["Porto A", "Porto B"],
  });

  console.log("✅ Sincronizzazione completata!");
}
```

---

## 📞 SUPPORTO

Per problemi o domande sull'integrazione:
1. Verificare i log di console per errori
2. Controllare che sincronizzazione sia abilitata su entrambe le app
3. Verificare che URL Server e API Key siano identici
4. Controllare che i codici tecnici (userId) siano corretti

---

## 🔐 SICUREZZA

### Raccomandazioni
- ✅ Usa HTTPS per URL Server in produzione
- ✅ Genera API Key complesse e univoche
- ✅ Non condividere API Key pubblicamente
- ✅ Cambia API Key periodicamente
- ✅ Mantieni aggiornato il codice tecnici

### Generazione API Key Sicure
```typescript
function generateSecureApiKey(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}${random2}`;
}
```

---

## 📊 STATISTICHE E MONITORAGGIO

### Visualizzare Report per Tecnico
```typescript
const techReports = await mockSyncServer.getAllReports("TECH01");
console.log(`Tecnico TECH01 ha ${techReports.data?.length} report`);
```

### Ultima Sincronizzazione
```typescript
const users = await mockSyncServer.getAllUsers();
users.data?.forEach(user => {
  const lastSync = user.lastSync 
    ? new Date(user.lastSync).toLocaleString('it-IT')
    : 'Mai sincronizzato';
  console.log(`${user.technicianName}: ${lastSync}`);
});
```

---

**Fine della Guida di Integrazione** 🎉
