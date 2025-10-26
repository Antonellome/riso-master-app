# Guida per contribuire

## Come caricare modifiche su GitHub

### Metodo 1: Interfaccia Web GitHub (Consigliato per non sviluppatori)

1. **Modifica un singolo file**
   - Naviga fino al file che vuoi modificare su GitHub
   - Clicca sull'icona della matita (✏️) in alto a destra
   - Modifica il contenuto
   - Scorri in basso e clicca "Commit changes"
   - Aggiungi un messaggio descrittivo (es. "Corretto calcolo ore straordinari")
   - Clicca "Commit changes"

2. **Carica nuovi file o sostituisci file esistenti**
   - Nella pagina principale della repository, clicca "Add file" → "Upload files"
   - Trascina i file da caricare
   - Aggiungi un messaggio di commit
   - Clicca "Commit changes"

### Metodo 2: Git da terminale (per sviluppatori)

```bash
# 1. Assicurati di avere le ultime modifiche
git pull origin main

# 2. Fai le tue modifiche ai file

# 3. Controlla quali file hai modificato
git status

# 4. Aggiungi i file modificati
git add .
# oppure aggiungi file specifici:
# git add path/to/file.tsx

# 5. Crea un commit con messaggio descrittivo
git commit -m "Descrizione delle modifiche"

# 6. Carica su GitHub
git push origin main
```

## Convenzioni per i commit

Usa messaggi chiari e descrittivi:

- ✅ "Corretto calcolo ore straordinari nel report mensile"
- ✅ "Aggiunto filtro per tecnici nella schermata report"
- ✅ "Risolto bug nella visualizzazione date"
- ❌ "Fix"
- ❌ "Aggiornamenti vari"
- ❌ "WIP"

## Struttura dei branch (opzionale)

Se vuoi lavorare su funzionalità separate:

```bash
# Crea un nuovo branch
git checkout -b nome-feature

# Lavora sul branch
git add .
git commit -m "Messaggio"
git push origin nome-feature

# Poi su GitHub crea una Pull Request per unire al branch main
```

## Sincronizzazione con Rork

- Le modifiche fatte su GitHub vengono automaticamente sincronizzate con Rork
- Le modifiche fatte su Rork vengono automaticamente committate su GitHub
- Controlla sempre su GitHub che le modifiche siano state sincronizzate correttamente

## Risoluzione conflitti

Se ricevi un errore "conflict" quando provi a fare push:

```bash
# 1. Scarica le modifiche remote
git pull origin main

# 2. Risolvi manualmente i conflitti nei file indicati
# (Cerca le sezioni marcate con <<<<<<< e >>>>>>>)

# 3. Aggiungi i file risolti
git add .

# 4. Completa il merge
git commit -m "Risolti conflitti"

# 5. Carica su GitHub
git push origin main
```

## Test prima di committare

Prima di caricare modifiche importanti:

1. Testa l'app localmente: `bun start`
2. Verifica che non ci siano errori TypeScript
3. Controlla che tutte le funzionalità funzionino correttamente
4. Se possibile, testa su dispositivo reale

## File da NON committare

Il file `.gitignore` è già configurato per escludere:
- `node_modules/` - Dipendenze (vengono installate con `bun install`)
- `.expo/` - Cache Expo
- `*.local` - File di configurazione locale
- `.DS_Store` - File di sistema macOS

Non modificare `.gitignore` a meno che non sia necessario.
