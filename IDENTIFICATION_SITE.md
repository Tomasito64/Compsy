# Identification Du Site

## Objectif

Pour que le site soit bien identifie, il faut agir sur 3 axes :

- etre techniquement trouvable par Google
- etre compréhensible par Google
- etre credible pour les visiteurs et les moteurs

## Priorites

### 1. Verifier l'indexation de base

Le site doit avoir :

- un `robots.txt` correct
- un `sitemap.xml` correct
- des balises `title` et `meta description` propres sur chaque page
- des URLs coherentes
- un domaine canonique stable

Une bonne partie de ces points a deja ete corrigee sur `site/`. Il faut maintenant verifier que la version en ligne correspond bien a ce qui a ete pousse sur `V2`.

### 2. Connecter le site a Google Search Console

C'est l'etape la plus importante si tu veux que le site soit vraiment bien identifie.

Etapes :

1. Aller sur Google Search Console
2. Ajouter la propriete `https://thomas-salanova.fr`
3. Valider que tu es bien proprietaire du domaine
4. Soumettre le sitemap :
   `https://thomas-salanova.fr/sitemap.xml`

Cela permettra a Google :

- de decouvrir tes pages plus vite
- de signaler les erreurs d'indexation
- de montrer quelles pages apparaissent dans les resultats

### 3. Soigner les titres et descriptions de chaque page

Chaque page doit repondre clairement a :

- qui tu es
- ce que tu fais
- pour qui
- dans quel contexte

Les pages `prestations`, `parcours`, `ressources` et `contact` doivent avoir :

- un titre unique
- une description claire
- un contenu bien structure avec `h1`, `h2`, etc.

### 4. Avoir du contenu qui correspond aux recherches reelles

Google identifie mieux un site quand il voit clairement les sujets traites.

Pour ce site, les expressions importantes sont probablement :

- psychologue du travail
- psychologie sociale du travail
- RPS
- QVCT
- accompagnement organisationnel
- formation managers
- analyse de donnees RH
- sante au travail
- Bordeaux

Ces termes doivent apparaitre naturellement dans les pages importantes, surtout :

- accueil
- prestations
- parcours
- contact

Il faut les integrer de maniere claire et precise, sans surcharger artificiellement le texte.

### 5. Travailler la page contact et la confiance

Pour etre bien identifie localement et professionnellement, il faut afficher clairement :

- ton nom
- ton activite
- ta zone d'intervention
- un moyen de contact fiable
- ton LinkedIn
- eventuellement un numero SIRET ou des mentions legales si tu en as

Cela aide a la fois Google et les visiteurs.

### 6. Ajouter des preuves de legitimite

Google comprend mieux un site lorsqu'il est relie a des elements credibles et verifiables.

Elements utiles :

- lien vers ton LinkedIn
- articles publies
- publications scientifiques
- blog ou contenus reguliers
- noms d'organisations avec lesquelles tu as travaille, si tu peux les citer

### 7. Publier du contenu dans le temps

Un site statique peut etre identifie, mais il progressera mieux avec du contenu regulier.

Le plus utile serait d'ajouter progressivement :

- quelques articles de fond
- des pages plus ciblees par sujet
- des contenus sur RPS, QVCT, management, donnees RH, biais cognitifs, etc.

Exemples de pages utiles :

- `Diagnostic RPS et QVCT`
- `Formation des managers`
- `Accompagnement du changement`
- `Analyse des donnees RH`
- `Psychologie du travail a Bordeaux`

### 8. Verifier les bases de performance

Le site doit aussi etre :

- rapide
- lisible sur mobile
- sans erreurs de navigation
- sans liens casses

Comme le site est statique, il part avec un avantage.

## Ordre recommande

1. Creer et configurer Google Search Console
2. Soumettre `https://thomas-salanova.fr/sitemap.xml`
3. Verifier que les pages principales ont les bons titres et descriptions
4. Ajouter une ou deux pages tres ciblees sur les prestations cles
5. Publier regulierement un peu de contenu utile

## Note pratique

Le dossier de production du site est actuellement `site/`, et la branche de deploiement est `V2`.
