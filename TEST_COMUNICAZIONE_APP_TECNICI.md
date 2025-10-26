# 📡 TEST DI COMUNICAZIONE - APP MASTER ↔️ APP TECNICI

## 🎯 OBIETTIVO
Verificare la compatibilità completa tra App Master e App Tecnici R.I.S.O. attraverso test di sincronizzazione bidirezionale.

---

## ✅ TEST 1: INVIO NOTIFICHE DA MASTER A TECNICI

### Scenario Test
L'App Master deve inviare notifiche all'App Tecnici e verificare che vengano ricevute correttamente.

### Dati Test da Inviare
```json
{
  "id": "notif_test_001",
  "title": "🔧 Test Notifica Urgente",
  "message": "Questo è un messaggio di test per verificare la sincronizzazione. Se lo ricevi, la comunicazione funziona correttamente.",
  "date": "2025-01-16",
  "timestamp": 1737043200000,
  "priority": "high",
  "type": "alert",
  "targetUsers": ["all"],
  "createdBy": "master-test"
}
```

### Domande per App Tecnici
1. ❓ **La notifica viene ricevuta correttamente dall'app tecnici?**
2. ❓ **Il badge con il numero di notifiche non lette si aggiorna automaticamente?**
3. ❓ **La notifica appare nella lista notifiche con la priorità corretta (high = rosso)?**
4. ❓ **Il campo `targetUsers: ["all"]` viene gestito correttamente per inviare a tutti i tecnici?**
5. ❓ **Quando il tecnico legge la notifica, il campo `read` viene aggiornato a `true`?**

### Risultato Atteso
✅ Notifica visibile nell'app tecnici
✅ Badge notifiche non lette incrementato
✅ Colore priorità corretto (rosso per high)
✅ Stato lettura tracciato correttamente

---

## ✅ TEST 2: SINCRONIZZAZIONE CATEGORIE TECNICI

### Scenario Test
L'App Master crea categorie di tecnici e le sincronizza con l'App Tecnici.

### Dati Test da Inviare
```json
[
  {
    "category": "Elettricista",
    "technicians": ["Marco Rossi", "Luigi Bianchi", "Paolo Verdi"]
  },
  {
    "category": "Meccanico",
    "technicians": ["Giovanni Neri", "Andrea Gialli"]
  },
  {
    "category": "Idraulico",
    "technicians": ["Simone Blu", "Matteo Azzurri"]
  }
]
```

### Domande per App Tecnici
1. ❓ **L'app tecnici ha una funzione per scaricare le categorie dal server?**
   - Se sì, come si chiama? Es: `syncTechniciansFromServer()`
   
2. ❓ **Dove vengono salvate le categorie nell'app tecnici?**
   - In `settings.technicianCategories`?
   - In AsyncStorage con quale chiave?

3. ❓ **Le categorie vengono ordinate alfabeticamente dopo il download?**

4. ❓ **Quando crei un nuovo rapportino, i tecnici sono raggruppati per categoria?**

5. ❓ **Se aggiungi un tecnico locale nell'app tecnici, questo sovrascrive la lista sincronizzata dal master?**

### Risultato Atteso
✅ Categorie scaricate e salvate
✅ Tecnici ordinati alfabeticamente per categoria
✅ Selezione tecnici raggruppata per categoria nei rapportini

---

## ✅ TEST 3: RICEZIONE RAPPORTINI DA TECNICI

### Scenario Test
Un tecnico crea un rapportino nell'App Tecnici, lo sincronizza, e l'App Master lo riceve.

### Dati Test che l'App Tecnici Dovrebbe Inviare
```json
{
  "id": "1737043200000",
  "userId": "A1B2C3",
  "date": "2025-01-16",
  "shiftType": "Ordinaria",
  "startTime": "08:00",
  "endTime": "17:00",
  "pauseMinutes": 60,
  "ship": "MSC Magnifica",
  "location": "Porto di Genova",
  "description": "Test sincronizzazione rapportino",
  "materials": "Cavi elettrici, connettori",
  "workDone": "Manutenzione impianto elettrico",
  "technicians": [
    {
      "id": "tech1",
      "name": "Marco Rossi",
      "startTime": "08:00",
      "endTime": "17:00"
    }
  ],
  "createdAt": 1737043200000,
  "updatedAt": 1737043200000
}
```

### Domande per App Tecnici
1. ❓ **Il campo `userId` viene inserito automaticamente in ogni rapportino?**
   - Se sì, viene preso da `settings.sync.userId`?
   - Viene aggiunto al momento della creazione o solo durante la sincronizzazione?

2. ❓ **Quando il tecnico clicca "Sincronizza", quale funzione viene chiamata?**
   - `syncToServer()`?
   - Invia tutti i rapportini o solo quelli non sincronizzati?

3. ❓ **Esiste un campo `syncedAt` o simile per tracciare i rapportini già sincronizzati?**

4. ❓ **Se un rapportino esiste già sul server (stesso ID), come gestisce il conflitto?**
   - Sovrascrive sempre?
   - Usa `updatedAt` per decidere quale versione tenere?

5. ❓ **Il campo `version` esiste nell'interfaccia Report dell'app tecnici?**
   - Se sì, viene incrementato ad ogni modifica?

### Risultato Atteso
✅ App Master riceve il rapportino con userId corretto
✅ Rapportino visualizzato nella tab Reports filtrato per tecnico
✅ Dati completi (ship, location, technicians, ecc.) presenti

---

## ✅ TEST 4: SINCRONIZZAZIONE NAVI E LUOGHI

### Scenario Test
L'App Master sincronizza la lista di navi e luoghi con l'App Tecnici.

### Dati Test da Inviare
```json
{
  "ships": ["MSC Magnifica", "Costa Pacifica", "Carnival Dream"],
  "locations": ["Porto di Genova", "Porto di Civitavecchia", "Porto di Napoli"]
}
```

### Domande per App Tecnici
1. ❓ **L'app tecnici ha una funzione per scaricare navi e luoghi dal server?**
   - ❌ NO: La sincronizzazione non è implementata
   - ✅ SÌ: Nome funzione? Es: `syncShipsAndLocationsFromServer()`

2. ❓ **Se implementata, dove viene salvata la lista?**
   - In `settings.ships` e `settings.locations`?
   - Sovrascrive completamente la lista locale?

3. ❓ **Se NON implementata, preferite:**
   - Tenere gestione manuale nell'app tecnici?
   - Implementare sincronizzazione automatica dal master?

4. ❓ **Quando selezioni nave/luogo in un rapportino, da dove viene la lista?**
   - Da `settings.ships` e `settings.locations`?
   - Autocomplete o dropdown?

### Risultato Atteso
⚠️ DA DECIDERE in base alle risposte dell'app tecnici

---

## ✅ TEST 5: IMPORT FILE CONFIGURAZIONE

### Scenario Test
Il Master genera un file JSON di configurazione, il tecnico lo importa nell'app.

### File Configurazione Test
```json
{
  "technicianName": "Marco Rossi",
  "technicianId": "tech1",
  "userId": "A1B2C3",
  "syncUrl": "https://api.riso-test.com",
  "apiKey": "test-api-key-123456",
  "companyName": "R.I.S.O. Master",
  "masterUserName": "Admin Test"
}
```

### Domande per App Tecnici
1. ❓ **L'app tecnici supporta l'import di questo formato esteso?**
   - Se NO, quali campi sono supportati? Solo `syncUrl`, `userId`, `apiKey`?

2. ❓ **Esiste una funzione per importare il file?**
   - `importSyncConfig(jsonData: string)`?
   - Accetta solo JSON string o anche file upload?

3. ❓ **I campi extra (`technicianName`, `companyName`, ecc.) vengono ignorati o salvati?**

4. ❓ **Dopo l'import, l'utente deve ancora inserire manualmente nome/ditta o vengono precompilati?**

### Risultato Atteso (Formato Minimo)
✅ Import con campi: `syncUrl`, `userId`, `apiKey`, `autoSync`
⚠️ Campi opzionali ignorati se non supportati

---

## ✅ TEST 6: GESTIONE CONFLITTI E VERSIONING

### Scenario Test
Un rapportino viene modificato sia dal tecnico che dal master, causando un conflitto.

### Domande per App Tecnici
1. ❓ **Il campo `version` esiste nell'interfaccia Report?**
   - Se sì, viene incrementato ad ogni modifica?

2. ❓ **Quando scarica rapportini dal server, come gestisce i conflitti?**
   - Sovrascrive sempre con i dati del server?
   - Confronta `updatedAt` e tiene il più recente?
   - Confronta `version` e tiene il numero più alto?

3. ❓ **Esiste una UI per risolvere manualmente i conflitti?**

4. ❓ **Se il tecnico modifica un rapportino già sincronizzato, cosa succede?**
   - Viene risincronizzato automaticamente?
   - Viene marcato come "modificato localmente"?

### Risultato Atteso
⚠️ Implementare strategia conflict resolution:
- **Server-wins**: Il master ha sempre ragione
- **Client-wins**: Il tecnico ha sempre ragione
- **Timestamp-based**: Vince chi ha modificato più recentemente
- **Manual**: L'utente sceglie quale versione tenere

---

## 📋 FORMATO DATI COMPLETO - RIEPILOGO

### Report (Rapportino)
```typescript
interface Report {
  id: string;                    // Timestamp o UUID
  userId?: string;               // ⚠️ VERIFICARE: Salvato o solo durante sync?
  date: string;                  // ISO 8601: "YYYY-MM-DD"
  shiftType: ShiftType;          // Enum tipo turno
  startTime: string;             // "HH:MM"
  endTime: string;               // "HH:MM"
  pauseMinutes: number;          // Minuti pausa
  ship: string;                  // Nome nave
  location: string;              // Nome luogo
  description: string;           // Descrizione lavoro
  materials: string;             // Materiali usati
  workDone: string;              // Lavoro svolto
  technicians: Technician[];     // Array tecnici
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  version?: number;              // ⚠️ VERIFICARE: Esiste?
  syncedAt?: number;             // ⚠️ VERIFICARE: Esiste?
}
```

### Notification (Notifica)
```typescript
interface Notification {
  id: string;                    // UUID
  title: string;                 // Titolo
  message: string;               // Messaggio
  date: string;                  // ISO 8601
  timestamp: number;             // Unix timestamp
  read?: boolean;                // Stato lettura
  priority: "low" | "normal" | "high";
  type: "info" | "warning" | "alert";
  targetUsers: string[];         // Array userId o ["all"]
  createdBy?: string;            // ID master
}
```

### TechnicianCategory
```typescript
interface TechnicianCategory {
  category: string;              // Nome categoria
  technicians: string[];         // Array nomi tecnici
}
```

### ShipsAndLocations
```typescript
interface ShipsAndLocations {
  ships: string[];               // Array nomi navi
  locations: string[];           // Array nomi luoghi
}
```

---

## 🔐 STORAGE KEYS CONDIVISE

### AsyncStorage / localStorage Keys
```typescript
// App Tecnici (locale)
@ore_tecnico_settings
@ore_tecnico_reports
@ore_tecnico_password
@ore_tecnico_notifications

// MockSyncServer (condiviso)
@riso_sync_server_users
@riso_sync_server_reports
@riso_sync_server_notifications
@riso_sync_server_technicians
@riso_sync_server_ships_locations
```

---

## 🎨 DOMANDE AGGIUNTIVE - STILE E VISUALIZZAZIONE

### Visualizzazione Report nella Tab Reports

1. ❓ **Come vengono visualizzati i rapportini nell'app tecnici?**
   - Card con anteprima?
   - Lista con icone?
   - Raggruppati per data?

2. ❓ **Quali informazioni sono visibili senza aprire il dettaglio?**
   - Data, tipo turno, nave?
   - Solo data e descrizione?

3. ❓ **I rapportini sono filtrabili?**
   - Per data (range picker)?
   - Per nave?
   - Per tipo turno?

4. ❓ **Esiste una vista calendario?**

5. ❓ **Colori dei badge tipo turno:**
   ```
   Ordinaria → Blu (#2563eb)
   Straordinaria → Giallo (#d97706)
   Festiva → Rosso (#dc2626)
   Ferie → Verde (#059669)
   Permesso → Indaco (#6366f1)
   Malattia → Rosa (#db2777)
   104 → Azzurro (#0284c7)
   ```
   **Sono questi i colori usati nell'app tecnici?**

### Export PDF/Excel

6. ❓ **L'app tecnici ha funzionalità di export PDF?**
   - Se sì, quale libreria usa? (expo-print, react-native-pdf, ecc.)
   - Formato A4 Portrait?

7. ❓ **L'app tecnici ha funzionalità di export Excel/XLSX?**
   - Se no, è una funzionalità desiderata?

8. ❓ **Se esiste export PDF, quali dati include?**
   - Solo dati rapportino?
   - Include logo ditta?
   - Include firma/timestamp?

---

## 📊 STATISTICHE E DASHBOARD

### Domande Dati Disponibili

1. ❓ **L'app tecnici calcola statistiche?**
   - Ore totali per periodo?
   - Guadagni per tipo turno?
   - Report per nave/luogo?

2. ❓ **Se sì, questi dati sono accessibili dal master?**
   - Tramite sincronizzazione?
   - Tramite API dedicata?

3. ❓ **Il master può vedere le statistiche aggregate di tutti i tecnici?**

---

## 🚀 PIANO TEST ESECUZIONE

### Fase 1: Test Notifiche (Priorità Alta)
1. Master invia notifica test con `targetUsers: ["all"]`
2. Verificare ricezione su app tecnici
3. Verificare badge notifiche non lette
4. Verificare colori priorità

### Fase 2: Test Categorie Tecnici (Priorità Alta)
1. Master crea 3 categorie con tecnici
2. Master sincronizza
3. Tecnico scarica categorie
4. Verificare ordinamento alfabetico

### Fase 3: Test Rapportini (Priorità Alta)
1. Tecnico crea rapportino
2. Tecnico sincronizza
3. Master riceve rapportino
4. Verificare presenza userId

### Fase 4: Test Import Config (Priorità Media)
1. Master genera file JSON
2. Tecnico importa file
3. Verificare campi popolati

### Fase 5: Test Ships/Locations (Priorità Bassa)
1. Decidere strategia (manuale vs automatica)
2. Implementare se necessario
3. Testare sincronizzazione

### Fase 6: Test Conflict Resolution (Priorità Media)
1. Creare conflitto intenzionale
2. Verificare comportamento
3. Decidere strategia migliore

---

## ✅ CHECKLIST FINALE COMPATIBILITÀ

### Formato Dati
- [ ] userId salvato nei rapportini (non solo durante sync)
- [ ] Campo version implementato e incrementato
- [ ] Timestamp in formato Unix (millisecondi)
- [ ] Date in formato ISO 8601 (YYYY-MM-DD)
- [ ] Orari in formato HH:MM

### Sincronizzazione
- [ ] Notifiche con targetUsers: ["all"] supportate
- [ ] Categorie tecnici scaricabili e ordinate
- [ ] Rapportini inviati con userId corretto
- [ ] Ships/Locations sincronizzabili (se richiesto)

### Import/Export
- [ ] Import config JSON (formato minimo o esteso)
- [ ] Export PDF (se implementato)
- [ ] Export Excel (se implementato)

### Conflict Resolution
- [ ] Strategia definita (server-wins/client-wins/timestamp)
- [ ] Campo version o updatedAt usato per decidere

### UI/UX
- [ ] Colori badge tipo turno corretti
- [ ] Visualizzazione rapportini compatibile
- [ ] Badge notifiche non lette funzionante

---

## 📞 PROSSIMI PASSI

1. **App Tecnici:** Rispondere alle domande in questo documento
2. **App Master:** Attendere risposte e adattare implementazione
3. **Eseguire Test Fase 1-6** con dati reali
4. **Documentare Risultati** e creare report finale
5. **Implementare Migliorie** necessarie per piena compatibilità

---

🔗 **Documento Correlato:** `INFORMAZIONI_APP_MASTER_PER_TECNICI.md`

📅 **Data Creazione:** 2025-01-16  
📝 **Versione:** 1.0  
👤 **Autore:** App Master R.I.S.O.
