# Compsy - Site vitrine

Site vitrine local pour **Thomas Salanova** (psychologie du travail, conseil, formation, analyse de donnees).

## Contenu

- `site/acceuil.html` : page d'accueil
- `site/prestations.html` : page Prestations
- `site/parcours.html` : page Parcours
- `site/ressources.html` : page Ressources
- `site/blog-vulgarisation.html` : blog vulgarisation
- `site/contact.html` : page Contact + formulaire
- `site/styles.css` : styles globaux

## Ouvrir le site en local

### Methode simple (double clic)

1. Ouvrir le dossier `site`.
2. Double-cliquer sur `acceuil.html`.

### Methode recommandee (serveur local)

> Permet d'eviter certains soucis de chargement et de navigation.

Avec PowerShell :

```powershell
cd C:\Users\thoma\Compsy\site
python -m http.server 8000
```

Ensuite ouvrir : `http://localhost:8000`

Si `python` n'est pas disponible, on peut utiliser :

```powershell
cd C:\Users\thoma\Compsy\site
npx serve .
```

## Personnalisation rapide

- Remplacer `contact@example.com` dans `site/contact.html`
- Remplacer `https://formspree.io/f/xxxxxxxx` par votre endpoint Formspree
- Remplacer `https://example.com/` dans les balises `canonical` et `og:url`

## Deploiement (OVH mutualise via SFTP)

Deploiement automatique via GitHub Actions (workflow `.github/workflows/deploy-ovh-sftp.yml`).

- Branche de deploiement : `V2`
- Dossier deploiement : `site/`
- Cible OVH : `/home/cierifrssr/thomas`
- Domaine : `https://thomas-salanova.fr`

Secrets a configurer dans l'environnement GitHub `production` :

- `SFTP_HOST` = `ftp.cluster120.hosting.ovh.net`
- `SFTP_USER` = `cierifrssr`
- `SFTP_PASSWORD` = (mot de passe SFTP)
- `SFTP_PORT` = `22`

Le workflow utilise `lftp mirror -R --delete` pour synchroniser le contenu et
effectue un smoke check sur `https://thomas-salanova.fr`.

