# Compsy

Site vitrine statique pour **Thomas Salanova** autour de la psychologie du travail, de la formation, du conseil et de l'analyse de donnees.

## Structure du depot

- `docs/` : version publiee du site, prevue pour un deploiement GitHub Pages
- `site/` : seconde copie du site, proche de `docs/` mais pas strictement identique
- `site astrig/` : dossier annexe avec un `index.html` isole
- `docs/assets/` et `site/assets/` : logos et PDF telechargeables
- `README.md` : documentation du projet

## Pages principales

Le site actuellement present dans `docs/` contient notamment :

- `docs/index.html` : redirection vers `docs/accueil.html`
- `docs/accueil.html` : page d'accueil principale
- `docs/prestations.html` : offres et accompagnements
- `docs/parcours.html` : parcours et experiences
- `docs/ressources.html` : ressources
- `docs/blog-vulgarisation.html` : page de blog / vulgarisation
- `docs/articles-scientifiques.html` : publications scientifiques avec telechargement PDF
- `docs/experience-scientifique.html` : experience scientifique
- `docs/projets-data.html` : projets data
- `docs/contact.html` : page contact
- `docs/styles.css` : feuille de style globale
- `docs/robots.txt` et `docs/sitemap.xml` : fichiers SEO

## Ouvrir le site en local

### Methode simple

Ouvrir `docs/accueil.html` directement dans un navigateur.

### Methode recommandee

Depuis PowerShell :

```powershell
cd C:\Users\thoma\Compsy\docs
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

Alternative si `python` n'est pas disponible :

```powershell
cd C:\Users\thoma\Compsy\docs
npx serve .
```

## Points de configuration a finaliser

Plusieurs valeurs du site sont encore des placeholders et doivent etre remplacees avant mise en ligne definitive :

- les URLs `https://example.com/...` dans les balises `canonical`, `og:url`, `robots.txt` et `sitemap.xml`
- l'endpoint Formspree dans `docs/contact.html`
- les eventuelles informations de contact a ajuster

## Deploiement

Le depot est structure de maniere compatible avec **GitHub Pages** via le dossier `docs/`.

- branche cible : `main`
- dossier de publication : `/docs`
- domaine personnalise : `thomas-salanova.fr` via `docs/CNAME`

## Observations

- `docs/` et `site/` partagent une grande partie des fichiers, mais au moins certaines pages HTML ne sont pas identiques
- le point d'entree principal du site en production semble etre `docs/index.html`, qui redirige vers `docs/accueil.html`
- l'ancienne URL `docs/acceuil.html` est conservee temporairement comme redirection de compatibilite

## Limitation de verification

Je n'ai pas pu verifier l'etat Git du depot avec `git status` car le repertoire est actuellement bloque par une erreur de type `dubious ownership` sur cette machine.
