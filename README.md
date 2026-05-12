# Compsy

Site vitrine statique pour **Thomas Salanova** autour de la psychologie du travail, de la formation, du conseil et de l'analyse de donnees.

## Structure du depot

- `site/` : version actuellement deployee par le workflow GitHub Actions vers l'hebergement OVH
- `Document/` : fichiers source PDF recopies ensuite dans les assets du site
- `site/assets/` : logos et PDF telechargeables servis par le site
- `README.md` : documentation du projet

## Pages principales

Le site actuellement present dans `site/` contient notamment :

- `site/index.html` : redirection vers `site/accueil.html`
- `site/accueil.html` : page d'accueil principale
- `site/prestations.html` : offres et accompagnements
- `site/parcours.html` : parcours et experiences
- `site/ressources.html` : ressources
- `site/blog-vulgarisation.html` : page de blog / vulgarisation
- `site/articles-scientifiques.html` : publications scientifiques avec telechargement PDF
- `site/experience-scientifique.html` : experience scientifique
- `site/projets-data.html` : projets data
- `site/contact.html` : page contact
- `site/styles.css` : feuille de style globale
- `site/robots.txt` et `site/sitemap.xml` : fichiers SEO

## Ouvrir le site en local

### Methode simple

Ouvrir `site/accueil.html` directement dans un navigateur.

### Methode recommandee

Depuis PowerShell :

```powershell
cd C:\Users\thoma\Compsy\site
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

Alternative si `python` n'est pas disponible :

```powershell
cd C:\Users\thoma\Compsy\site
npx serve .
```

## Points de configuration a finaliser

Plusieurs valeurs du site sont encore des placeholders et doivent etre remplacees avant mise en ligne definitive :

- les URLs `https://example.com/...` dans les balises `canonical`, `og:url`, `robots.txt` et `sitemap.xml`
- l'endpoint Formspree dans `site/contact.html`
- les eventuelles informations de contact a ajuster

## Deploiement

Le deploiement actif passe par GitHub Actions puis un envoi SFTP vers OVH a partir du dossier `site/`.

- branche cible : `V2`
- dossier publie : `site/`
- domaine cible : `https://thomas-salanova.fr`

## Observations

- `site/` est la source unique du site
- le point d'entree principal du site deploie est `site/index.html`, qui redirige vers `site/accueil.html`
- l'ancienne URL `acceuil.html` est conservee comme redirection de compatibilite
- `Document/` contient les PDF source, recopies ensuite dans `site/assets/Documents/`
