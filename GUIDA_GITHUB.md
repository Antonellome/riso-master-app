# Guida completa per caricare il progetto su GitHub

## Metodo consigliato: Solo interfaccia web (senza terminale)

### Passo 1: Scarica il progetto
1. Nell'interfaccia di Rork, clicca sul pulsante **"Download"**
2. Salva il file ZIP sul tuo computer
3. Estrai tutti i file in una cartella

### Passo 2: Crea la repository su GitHub
1. Vai su [https://github.com/new](https://github.com/new)
2. Inserisci il nome della repository (es. `riso-master-app`)
3. Scegli **Privato** o **Pubblico**
4. **IMPORTANTE**: NON selezionare nessuna di queste opzioni:
   - ❌ "Add a README file"
   - ❌ "Add .gitignore"
   - ❌ "Choose a license"
5. Clicca su **"Create repository"**

### Passo 3: Carica i file
1. Nella pagina della repository appena creata, cerca il link **"uploading an existing file"** e cliccalo
2. Trascina TUTTI i file e le cartelle dalla cartella estratta nell'area di upload
   - Oppure clicca su "choose your files" e seleziona tutto
3. Aspetta che l'upload sia completato (potrebbe richiedere qualche minuto)
4. In basso, scrivi un messaggio di commit: `Initial commit - RISO Master App`
5. Clicca su **"Commit changes"**

### Passo 4: Verifica
Controlla che tutti questi file e cartelle siano presenti:
- ✅ Cartella `app/` (con sottocartelle)
- ✅ Cartella `contexts/`
- ✅ Cartella `utils/`
- ✅ Cartella `assets/`
- ✅ File `package.json`
- ✅ File `app.json`
- ✅ File `tsconfig.json`
- ✅ File `.gitignore`
- ✅ File `README.md`
- ✅ File `CONTRIBUTING.md`
- ✅ File `LICENSE`

### Fatto! ✅
La tua repository è pronta. Ora puoi:
- Vedere i file su GitHub
- Modificare file singoli direttamente su GitHub
- Scaricare una copia in qualsiasi momento
- Condividere il link con collaboratori

---

## Come modificare i file dopo il caricamento

### Metodo 1: Modifica singolo file su GitHub
1. Vai nella repository su GitHub
2. Naviga fino al file da modificare
3. Clicca sull'icona matita ✏️ in alto a destra
4. Fai le modifiche
5. Scorri in basso
6. Scrivi un messaggio descrittivo (es. "Corretto calcolo ore")
7. Clicca su **"Commit changes"**

### Metodo 2: Sostituisci file esistenti
1. Vai nella repository su GitHub
2. Naviga nella cartella che contiene il file
3. Clicca su **"Add file"** → **"Upload files"**
4. Trascina il file aggiornato (sovrascriverà quello esistente)
5. Scrivi un messaggio di commit
6. Clicca su **"Commit changes"**

---

## Metodo alternativo: Usa Git da terminale (solo se sei sviluppatore)

Se hai dimestichezza con il terminale, puoi usare Git:

### Prima volta (setup iniziale)
```bash
# Nella cartella del progetto
git init
git add .
git commit -m "Initial commit - RISO Master App"
git remote add origin https://github.com/TUO_USERNAME/riso-master-app.git
git branch -M main
git push -u origin main
```

### Modifiche successive
```bash
# Verifica i file modificati
git status

# Aggiungi tutti i file modificati
git add .

# Oppure aggiungi solo file specifici
git add path/to/file.tsx

# Crea un commit
git commit -m "Descrizione delle modifiche"

# Carica su GitHub
git push origin main
```

### Scarica modifiche da GitHub
```bash
git pull origin main
```

---

## Risoluzione problemi comuni

### Non vedo il pulsante "uploading an existing file"
- Assicurati di aver creato una repository vuota (senza README, .gitignore o license)
- Se la repository ha già file, usa "Add file" → "Upload files" invece

### Upload troppo lento
- L'upload potrebbe richiedere qualche minuto per progetti grandi
- Assicurati di avere una buona connessione internet
- La cartella `node_modules/` NON deve essere caricata (è già esclusa da .gitignore)

### File mancanti dopo l'upload
- GitHub non mostra file nascosti nella visualizzazione normale
- File come `.gitignore` sono presenti ma potresti non vederli subito
- Clicca sulla lista file e cerca manualmente

### Messaggio "files changed" dopo ogni commit
- È normale, ogni modifica crea un nuovo commit
- Puoi vedere la cronologia dei commit nella tab "Commits"

---

## Sincronizzazione con Rork

- ✅ Le modifiche fatte su GitHub vengono automaticamente sincronizzate con Rork
- ✅ Le modifiche fatte su Rork vengono automaticamente committate su GitHub
- ⚠️ Aspetta qualche secondo dopo ogni modifica per la sincronizzazione

---

## Collaborazione

### Aggiungere collaboratori
1. Vai nelle impostazioni della repository
2. Clicca su "Collaborators"
3. Clicca su "Add people"
4. Cerca l'username GitHub del collaboratore
5. Seleziona i permessi (Read, Write, Admin)
6. Invia l'invito

### Proteggere il branch main
1. Vai in Settings → Branches
2. Clicca "Add rule"
3. In "Branch name pattern" scrivi `main`
4. Seleziona:
   - ✅ "Require pull request reviews before merging"
   - ✅ "Require status checks to pass before merging"
5. Salva

---

## Backup

È sempre una buona idea avere una copia locale:
1. Vai nella repository su GitHub
2. Clicca sul pulsante verde **"Code"**
3. Clicca su **"Download ZIP"**
4. Salva il file ZIP sul tuo computer

---

## Link utili

- [GitHub Help](https://docs.github.com)
- [Rork Documentation](https://rork.com/docs)
- [Expo Documentation](https://docs.expo.dev)

---

## Domande frequenti

**Q: Devo caricare la cartella node_modules/?**
A: No! È già esclusa dal file .gitignore. Le dipendenze vengono installate con `bun install`.

**Q: Posso usare GitHub Desktop invece del terminale?**
A: Sì! Scarica GitHub Desktop, clona la repository e usa l'interfaccia grafica per commit e push.

**Q: Come faccio a tornare a una versione precedente?**
A: Vai nella tab "Commits", trova il commit precedente, clicca sui tre puntini e seleziona "Revert".

**Q: Posso rendere privata una repository pubblica?**
A: Sì, vai in Settings → General → Change repository visibility.
