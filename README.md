# Compsy

Site vitrine statique pour **Thomas Salanova** autour de la psychologie du travail, de la formation, du conseil et de l'analyse de donnees.

## Structure du depot

- `site/` : source actuellement deployee en production
- `docs/` : copie annexe du site, encore presente dans le depot mais non utilisee pour la production OVH
- `site astrig/` : dossier annexe avec un `index.html` isole
- `site/assets/` et `docs/assets/` : logos et PDF telechargeables
- `README.md` : documentation du projet

## Pages principales

Le site actuellement deployee en production dans `site/` contient notamment :

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

- les URLs `https://example.com/...` dans les balises `canonical` et `og:url`
- l'endpoint Formspree dans `site/contact.html`
- les eventuelles informations de contact a ajuster

## Deploiement

Le deploiement de production se fait via le workflow GitHub Actions `.github/workflows/deploy-ovh-sftp.yml`.

- branche cible : `main`
- dossier publie : `site/`
- cible OVH : `/home/cierifrssr/thomas`
- domaine : `https://thomas-salanova.fr`

## Workflow Git

- `main` = production
- `V2` = branche de travail / preparation

Flux recommande :

1. travailler sur `V2`
2. merger `V2` dans `main` quand c'est pret
3. pousser `main` pour declencher le deploiement

## Observations

- `docs/` et `site/` partagent une grande partie des fichiers, mais certaines pages HTML ne sont pas identiques
- le point d'entree principal du site en production est `site/index.html`, qui redirige vers `site/accueil.html`
- l'ancienne URL `site/acceuil.html` est conservee temporairement comme redirection de compatibilite
