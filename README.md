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

## Tests (preview local)

Verifier le site en local avant de publier :

```powershell
cd C:\Users\thoma\Compsy\site
python -m http.server 8000
```

Puis ouvrir : `http://localhost:8000`

Astuce (1 commande) :

```powershell
.\preview.ps1
```

## Mise en production (OVH mutualise via SFTP)

Deploiement automatique via GitHub Actions (workflow `.github/workflows/deploy-ovh-sftp.yml`).

- Branche de deploiement : `main`
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

## Workflow Git (dev -> prod)

- `V2` = branche de travail (developpement)
- `main` = production (site en ligne)

Etapes typiques :

1. Travailler sur `V2`, puis `git add`, `git commit`, `git push`
2. Quand c'est pret pour la prod : `git checkout main`
3. `git merge V2`
4. `git push` (declenche le deploiement)

Pour voir ce qui va changer en prod :

```powershell
git log --oneline main..V2
git diff main..V2
```

