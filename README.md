# Portfolio de Marcella Chanhoun

Site : https://marcella-chanhoun.netlify.app
Tableau de bord : https://marcella-chanhoun.netlify.app/admin/

## Comment ça marche

```
Tableau de bord (/admin/)
   │  « Enregistrer » : un commit sur GitHub (contenu.json + images)
   ▼
Dépôt GitHub ──► Netlify met le site à jour (1 à 2 min)
   │
   └──► Le robot GitHub (Actions) refait portfolio.pdf (3 à 4 min)
```

| Fichier | Rôle |
|---|---|
| `contenu.json` | **Tout le texte du portfolio.** Modifié par le tableau de bord. |
| `index.html` | Structure fixe : menu et titres des sections. |
| `css/style.css` | Apparence du site, et de la version PDF (règles `.mode-pdf`). |
| `js/site.js` | Lit `contenu.json` et remplit la page. Un champ vide n'est pas affiché. |
| `admin/` | Le tableau de bord. |
| `scripts/generer-pdf.mjs` | Ouvre le site dans un navigateur et fabrique `portfolio.pdf`. |
| `.github/workflows/pdf.yml` | Lance le script à chaque modification du dépôt. |
| `img/`, `cv/` | Images et CV (envoyés depuis le tableau de bord). |

## Mise en ligne (une seule fois)

### 1. Le dépôt GitHub
1. Sur GitHub, créer un dépôt nommé **`portfolio`** (public ou privé).
2. Dans le dossier du portfolio :
   ```bash
   git init
   git add .
   git commit -m "Portfolio avec tableau de bord"
   git branch -M main
   git remote add origin https://github.com/peace042005/portfolio.git
   git push -u origin main
   ```
3. Onglet **Actions** du dépôt : le robot « Générer le PDF du portfolio » doit passer au vert.
   S'il échoue avec une erreur de permission : **Settings → Actions → General → Workflow permissions →
   Read and write permissions**, puis relancer avec **Run workflow**.

### 2. Netlify
1. Sur https://app.netlify.com : **Add new site → Import an existing project → GitHub** → dépôt `portfolio`.
2. Build command : **vide**. Publish directory : **`.`**
3. **Site configuration → Change site name** : `marcella-chanhoun`.

### 3. Le jeton d'accès pour le tableau de bord
1. GitHub → photo de profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Nom : `Tableau de bord portfolio`. Expiration : 90 jours (on en recrée un ensuite).
3. **Repository access → Only select repositories → `portfolio`**.
4. **Permissions → Repository permissions → Contents → Read and write**. Rien d'autre.
5. Copier le jeton (`github_pat_…`) et le garder dans un gestionnaire de mots de passe.

Ne jamais mettre ce jeton dans le code, dans un fichier du dépôt ou dans un message.
S'il fuit : le supprimer sur la même page GitHub, il ne fonctionne plus immédiatement.

### 4. Le formulaire de contact
Le premier message envoyé depuis le site déclenche un e-mail de FormSubmit à l'adresse de contact :
cliquer sur le lien d'activation. Les messages suivants arrivent directement.

## Utiliser le tableau de bord
1. Ouvrir `/admin/`, coller le jeton. Il reste dans l'onglet et disparaît à sa fermeture.
2. Choisir une section à gauche, modifier : l'aperçu à droite se met à jour en direct.
3. **Enregistrer**. Le site est à jour 1 à 2 minutes après, le PDF 3 à 4 minutes après.

Une image envoyée est automatiquement réduite (1600 px maximum) et convertie en JPEG.
Un nouveau CV remplace l'ancien sous le même nom, donc les liens existants restent valables.

## Tester en local
```bash
npx http-server -p 8080 .          # puis ouvrir http://localhost:8080
```
Fabriquer le PDF en local (dans un second terminal) :
```bash
npm install --no-save playwright@1.56.0
npx playwright install chromium
node scripts/generer-pdf.mjs
```
