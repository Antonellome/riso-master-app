# Guida Deployment GitHub Pages

## Setup automatico

L'app è già configurata per il deployment automatico su GitHub Pages.

## Passi da seguire

### 1. Abilita GitHub Pages

1. Vai sul tuo repository GitHub
2. Clicca su **Settings** (Impostazioni)
3. Nel menu laterale, clicca su **Pages**
4. In "Build and deployment":
   - **Source**: Seleziona **GitHub Actions**
5. Salva

### 2. Fai il push del codice

```bash
git add .
git commit -m "Setup GitHub Pages"
git push origin main
```

### 3. Verifica il deployment

1. Vai alla tab **Actions** del repository
2. Vedrai il workflow "Deploy to GitHub Pages" in esecuzione
3. Dopo qualche minuto, l'app sarà disponibile su:
   `https://[tuo-username].github.io/[nome-repo]/`

## Note importanti

- Il deploy avviene automaticamente ad ogni push su `main`
- La build impiega circa 2-5 minuti
- Assicurati di aver abilitato GitHub Pages nelle impostazioni del repository
- L'URL finale sarà del tipo: `https://tuo-username.github.io/nome-repository/`

## Risoluzione problemi

### Schermata bianca

Se vedi una schermata bianca:

1. Verifica che GitHub Pages sia abilitato con source "GitHub Actions"
2. Controlla che il workflow sia completato con successo nella tab Actions
3. Aspetta qualche minuto dopo il completamento del workflow
4. Prova a fare un hard refresh (Ctrl+F5 o Cmd+Shift+R)

### Build fallita

Se il build fallisce:

1. Controlla i log nella tab Actions
2. Verifica che tutte le dipendenze siano installabili
3. Testa localmente con: `bunx expo export --platform web`
