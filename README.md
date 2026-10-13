# Portfolio de Marcella Chanhoun

Site : https://portfolio-marcella-chanhoun.vercel.app
Tableau de bord : https://portfolio-marcella-chanhoun.vercel.app/admin/

## Comment ça marche

```
Tableau de bord (/admin/)
   │  « Enregistrer » : un commit sur GitHub (contenu.json + images)
   ▼
Dépôt GitHub ──► Vercel met le site à jour (moins d'une minute)
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

### 2. Vercel (hébergement gratuit)
1. Sur https://vercel.com : **Sign Up → Continue with GitHub** (offre **Hobby**, gratuite).
2. **Add New… → Project** → importer le dépôt `Portfolio`.
3. **Project Name** : `portfolio-marcella-chanhoun`. **Framework Preset** : `Other`. Ne rien changer d'autre.
4. **Deploy**. Le site est sur https://portfolio-marcella-chanhoun.vercel.app

Les réglages (cache, page admin non indexée) sont dans `vercel.json`.
L'offre gratuite autorise 100 mises en ligne par jour : largement assez.

### 3. Le jeton d'accès pour le tableau de bord
1. GitHub → photo de profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Nom : `Tableau de bord portfolio`. Expiration : 90 jours (on en recrée un ensuite).
3. **Repository access → Only select repositories → `portfolio`**.
4. **Permissions → Repository permissions → Contents → Read and write**. Rien d'autre.
5. Copier le jeton (`github_pat_…`) et le garder dans un gestionnaire de mots de passe.

Ne jamais mettre ce jeton dans le code, dans un fichier du dépôt ou dans un message.
S'il fuit : le supprimer sur la même page GitHub, il ne fonctionne plus immédiatement.

### 4. Le formulaire de contact (Web3Forms, gratuit)
1. Sur https://web3forms.com : saisir son adresse e-mail → **Create Access Key**. La clé arrive par e-mail.
2. Tableau de bord → **Contact** → coller la clé dans **Clé du formulaire (Web3Forms)** → **Enregistrer**.
Les messages arrivent à l'adresse utilisée pour créer la clé. Cette clé n'est pas un secret : elle peut être visible dans le site.

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
