// Fabrique portfolio.pdf à partir du site.
// Utilisé par le robot GitHub (.github/workflows/pdf.yml), mais on peut aussi le lancer à la main :
//   npx http-server -p 8080 .   (dans un terminal)
//   node scripts/generer-pdf.mjs   (dans un autre)
import { chromium } from 'playwright';

const ADRESSE = process.env.ADRESSE_SITE || 'http://localhost:8080/';
const SORTIE = process.env.FICHIER_PDF || 'portfolio.pdf';
// Adresse publique du site : les liens relatifs (ex. le CV) deviennent des liens complets dans le PDF.
const SITE_PUBLIC = process.env.SITE_PUBLIC || 'https://marcella-chanhoun.netlify.app/';

const navigateur = await chromium.launch();
const page = await navigateur.newPage();

// On affiche le site comme à l'écran (et non avec le style « impression » du navigateur),
// pour que le PDF ressemble au site en ligne.
await page.emulateMedia({ media: 'screen' });
await page.goto(ADRESSE, { waitUntil: 'networkidle' });

// Le contenu est ajouté par js/site.js après lecture de contenu.json : on attend qu'il ait fini.
await page.waitForSelector('html[data-pret="oui"]');

// La classe « mode-pdf » permet au CSS du site de masquer ce qui ne sert à rien sur papier
// (formulaire de contact, boutons…) et d'afficher le détail des projets.
await page.evaluate((site) => {
  document.documentElement.classList.add('mode-pdf');
  document.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (!h.startsWith('#') && !/^[a-z]+:/i.test(h)) a.href = new URL(h, site).href;
  });
}, SITE_PUBLIC);

// On attend que les polices et les images soient chargées.
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => {
    img.loading = 'eager';
    return img.complete ? null : new Promise((ok) => { img.onload = img.onerror = ok; });
  }));
});

await page.pdf({
  path: SORTIE,
  format: 'A4',
  printBackground: true,   // garde les couleurs de fond
  scale: 0.72,             // réduit un peu la page pour garder la mise en page « ordinateur »
  margin: { top: '10mm', bottom: '10mm', left: '0', right: '0' },
});

await navigateur.close();
console.log(`PDF créé : ${SORTIE}`);
