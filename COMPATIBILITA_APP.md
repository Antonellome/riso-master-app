# 📱 Migliorie e Compatibilità R.I.S.O. Master ↔ R.I.S.O. App

## 🎯 Migliorie Eseguite

### 1. **Sistema di Versionamento Report**
- ✅ Aggiunto campo `version` ai report per tracciare le modifiche
- ✅ Aggiunto campo `modifiedAt` per timestamp delle modifiche
- ✅ Aggiunto campo `deviceId` per identificare il dispositivo di origine
- ✅ Sistema di risoluzione conflitti configurabile:
  - `master-wins`: Il master prevale sempre
  - `technician-wins`: L'app tecnico prevale sempre  
  - `manual`: Versione più recente prevale (timestamp + versione)

### 2. **Gestione Sincronizzazione Avanzata**
- ✅ Funzione `importReports()` migliorata con merge intelligente
- ✅ Controllo versione e timestamp per evitare perdita dati
- ✅ Log dettagliati durante sincronizzazione
- ✅ Schema dati versionato (`dataSchemaVersion`) per compatibilità future

### 3. **Configurazione Tecnici Migliorata**
- ✅ Generazione automatica User ID univoco (6 caratteri casuali)
- ✅ Selezione multipla tecnici per invio configurazione
- ✅ Export file JSON con configurazione completa:
  - URL Server
  - API Key
  - User ID univoco
  - Nome azienda
  - Nome utente master
- ✅ Supporto download file su web e share su mobile

### 4. **Gestione Categorie Tecnici**
- ✅ Menu dedicato per gestione categorie
- ✅ Assegnazione categoria a ogni tecnico tramite dropdown
- ✅ Sincronizzazione categorie su tutte le app tecnici
- ✅ Filtro notifiche per categoria

### 5. **Sistema Notifiche Robusto**
- ✅ Invio immediato o durante sincronizzazione
- ✅ Selezione destinatari per nome o categoria
- ✅ Tracking stato invio (inviato/in attesa)
- ✅ Validazione completa prima invio
- ✅ Safe navigation per prevenire crash (`settings.notifications || []`)

### 6. **Menu Report con Filtri Avanzati**
- ✅ Filtro giornaliero/mensile
- ✅ Filtri cascading: Tecnico → Nave → Luogo
- ✅ Menu tendina dinamici basati su selezioni precedenti
- ✅ Riepilogo ore, navi e luoghi
- ✅ Badge visivi per tipo lavoro (ordinario/straordinario)

### 7. **Miglioramenti Stabilità**
- ✅ Controlli null/undefined su array e oggetti
- ✅ Safe navigation operators (`?.`, `|| []`)
- ✅ Validazione dati prima sincronizzazione
- ✅ Gestione errori migliorata con try-catch

---

## 🔄 Formato Scambio Dati

### Struttura Report (JSON)
```json
{
  "id": "1699876543210",
  "technicianId": "tech1",
  "technicianName": "Marco Rossi",
  "date": "2025-01-16",
  "hours": 8.5,
  "shiftType": "full_day",
  "workType": "ordinary",
  "shipName": "MSC Magnifica",
  "location": "Porto di Genova",
  "startTime": "08:00",
  "endTime": "17:00",
  "breakMinutes": 30,
  "notes": "Manutenzione motori completata",
  "createdAt": "2025-01-16T08:00:00.000Z",
  "syncedAt": "2025-01-16T18:00:00.000Z",
  "version": 1,
  "deviceId": "master-001",
  "modifiedAt": "2025-01-16T17:30:00.000Z"
}
```

### Struttura Configurazione Tecnico (JSON)
```json
{
  "technicianName": "Marco Rossi",
  "technicianId": "tech1",
  "userId": "A1B2C3",
  "syncUrl": "https://api.riso-sync.com/v1",
  "apiKey": "sk_live_xxxxxxxxxxxxx",
  "companyName": "R.I.S.O. Master",
  "masterUserName": "Admin Master"
}
```

### Struttura Notifica (JSON)
```json
{
  "id": "1699876543211",
  "title": "Riunione Urgente",
  "date": "2025-01-16",
  "message": "Riunione domani alle ore 10:00 in sede",
  "recipients": ["tech1", "tech2"],
  "recipientCategories": ["Elettricista"],
  "createdAt": "2025-01-16T09:00:00.000Z",
  "sentAt": "2025-01-16T09:05:00.000Z"
}

```

---

## ⚠️ Requisiti per Compatibilità Ottimale

### 1. **Campi Obbligatori App Tecnici**
L'app tecnici deve includere nei report inviati:
```typescript
interface TechnicianReport {
  id: string;              // ID univoco
  technicianId: string;    // ID tecnico assegnato dal master
  date: string;            // Formato ISO: "YYYY-MM-DD"
  hours: number;           // Ore lavorate
  workType: "ordinary" | "extraordinary" | "festiva" | "ferie" | "permesso" | "malattia" | "104";
  shipName: string;        // Nome nave (deve corrispondere al master)
  location: string;        // Luogo (deve corrispondere al master)
  createdAt: string;       // ISO timestamp
  version: number;         // Versione report (inizia da 1)
  modifiedAt: string;      // ISO timestamp ultima modifica
}
```

### 2. **Endpoint Sincronizzazione Richiesti**
```
POST /sync/reports          - Invio report da tecnico a master
GET  /sync/config           - Download configurazione master
GET  /sync/master-data      - Download navi, luoghi, notifiche
POST /sync/acknowledge      - Conferma ricezione notifiche
```

### 3. **Gestione Conflitti**
- Se `version` tecnico > `version` master → Accetta aggiornamento
- Se `version` uguale → Confronta `modifiedAt`
- Se configurato `master-wins` → Master ignora modifiche tecnico
- Se configurato `technician-wins` → Master accetta sempre

### 4. **Sincronizzazione Dati Master → Tecnici**
Il master deve inviare ai tecnici:
- ✅ Lista navi attive (`ships` con `active: true`)
- ✅ Lista luoghi attivi (`locations` con `active: true`)
- ✅ Lista altri tecnici (`technicians` per visibilità squadra)
- ✅ Notifiche pendenti (`notifications` senza `sentAt`)
- ✅ Categorie tecnici (`technicianCategories`)

### 5. **Formato Tariffe Orarie (da App Tecnici)**
L'app tecnici usa queste tariffe che potrebbero essere sincronizzate:
```typescript
interface HourlyRate {
  type: "Ordinario" | "Straordinario" | "Festivo";
  rate: number;  // Euro per ora
}
```

---

## 🔐 Sicurezza e Autenticazione

### User ID Univoco
- 6 caratteri alfanumerici casuali (es: `A1B2C3`)
- Generato automaticamente alla creazione tecnico
- Usato per autenticazione nelle API

### API Key
- Configurata nel master e inviata tramite file configurazione
- Deve essere inclusa in header HTTP: `Authorization: Bearer {apiKey}`
- Validata dal server sync per ogni richiesta

### Codice Sicurezza App
- PIN/Password per accesso app master
- Non sincronizzato con app tecnici
- Locale al dispositivo master

---

## 📊 Statistiche e Report

### Dati Calcolati dal Master
Il master calcola automaticamente:
- ✅ Ore totali per tecnico/periodo
- ✅ Numero navi visitate
- ✅ Numero luoghi visitati
- ✅ Presenze/Assenze giornaliere
- ✅ Ripartizione per tipo lavoro

### Dati che l'App Tecnici deve Fornire
- Ore lavorate per giorno
- Orari inizio/fine/pausa
- Tipo lavoro (ordinario/straordinario/ferie/ecc.)
- Nave/Luogo lavorazione
- Note giornaliere

---

## 🚀 Raccomandazioni per Implementazione

### 1. **Batch Sync**
- Non sincronizzare report uno a uno
- Raggruppare in batch da 50-100 report
- Include timestamp ultimo sync per delta updates

### 2. **Offline First**
- App tecnici deve funzionare offline
- Coda locale report da sincronizzare
- Sync automatico quando torna online

### 3. **Error Handling**
```typescript
try {
  await syncReports(reports);
} catch (error) {
  // Salvare in coda retry
  // Notificare utente
  // Log per debugging
}
```

### 4. **Validazione Dati**
Prima di sincronizzare, validare:
- Campi obbligatori presenti
- Date in formato corretto
- Ore > 0 e < 24
- Nave/Luogo esistono nel master
- Tecnico ID valido

### 5. **Compression**
Per risparmiare banda su mobile:
```typescript
const compressed = await gzip(JSON.stringify(reports));
// Invia compressed con header: Content-Encoding: gzip
```

---

## 🔧 Domande per Ottimizzazione

Per migliorare ulteriormente la compatibilità:

1. **Gestione Foto/Allegati**
   - L'app tecnici deve poter allegare foto ai report?
   - Serve sincronizzazione foto o solo metadati?

2. **Firma Digitale**
   - Servono firme per approvazione report?
   - Chi deve firmare (tecnico/master/cliente)?

3. **Geo-localizzazione**
   - Tracciare posizione GPS durante check-in?
   - Validare che tecnico sia effettivamente sul posto?

4. **Modalità Offline**
   - Quanti giorni di dati devono rimanere accessibili offline?
   - Cache navi/luoghi quanto deve durare?

5. **Multi-tenant**
   - Un tecnico può lavorare per più aziende?
   - Un master può gestire più sedi/filiali?

6. **Backup e Recovery**
   - Serve backup automatico su cloud?
   - Procedura recovery in caso perdita dati?

7. **Reportistica Avanzata**
   - Export Excel/PDF necessario?
   - Grafici e statistiche avanzate?

8. **Gestione Turni**
   - Pianificazione turni futuri?
   - Alert quando tecnico non compila rapportino?

---

## 📞 Supporto Tecnico

Per implementare la sincronizzazione lato server o app tecnici, fornire:
- ✅ Formato JSON esatto report app tecnici
- ✅ URL endpoint API disponibili
- ✅ Metodo autenticazione preferito
- ✅ Frequenza sincronizzazione desiderata
- ✅ Gestione conflitti preferita

---

**Versione Master App**: 1.0.0  
**Schema Dati**: v1  
**Data Documento**: 2025-01-16
