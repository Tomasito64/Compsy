# Compsy - Site vitrine

Site vitrine local pour **Thomas Salanova** (psychologie du travail, conseil, formation, analyse de donnees).

## Contenu

- `docs/acceuil.html` : page d'accueil
- `docs/prestations.html` : page Prestations
- `docs/parcours.html` : page Parcours
- `docs/ressources.html` : page Ressources
- `docs/blog-vulgarisation.html` : blog vulgarisation
- `docs/contact.html` : page Contact + formulaire
- `docs/styles.css` : styles globaux

## Ouvrir le site en local

### Methode simple (double clic)

1. Ouvrir le dossier `docs`.
2. Double-cliquer sur `acceuil.html`.

### Methode recommandee (serveur local)

> Permet d'eviter certains soucis de chargement et de navigation.

Avec PowerShell :

```powershell
cd C:\Users\thoma\Compsy\docs
python -m http.server 8000
```

Ensuite ouvrir : `http://localhost:8000`

Si `python` n'est pas disponible, on peut utiliser :

```powershell
cd C:\Users\thoma\Compsy\docs
npx serve .
```

## Personnalisation rapide

- Remplacer `contact@example.com` dans `docs/contact.html`
- Remplacer `https://formspree.io/f/xxxxxxxx` par votre endpoint Formspree
- Remplacer `https://example.com/` dans les balises `canonical` et `og:url`

## Deploiement (GitHub Pages)

- Source : branche `main` + dossier `/docs`
- Domaine : `thomas-salanova.fr` (fichier `docs/CNAME`)
- DNS OVH : 
  - A (apex `@`) : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - CNAME `www` : `<ton-github-username>.github.io`

Note : Active "Enforce HTTPS" dans `Settings → Pages` une fois le DNS propagé.

