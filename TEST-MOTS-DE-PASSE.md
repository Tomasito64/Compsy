# Essai de protection des formations

Cette expérience est limitée à la branche `V2`. Aucun changement du site publié, des PDF ou du workflow OVH. Le serveur d'aperçu écoute uniquement sur cet ordinateur.

Le site public reste consultable. Dans cet aperçu, seuls les PDF du dossier `site` demandent un identifiant et un mot de passe, y compris via leurs liens directs. La page Formations, ses titres et descriptions restent accessibles sans connexion.

## Essayer sous PowerShell

Depuis le dépôt, avec Node.js installé :

```powershell
$env:PREVIEW_USER = 'stagiaire'
$credential = Get-Credential -UserName $env:PREVIEW_USER -Message 'Choisir un mot de passe temporaire pour cet essai local'
$env:PREVIEW_PASSWORD = $credential.GetNetworkCredential().Password
node preview-auth.mjs
```

Ouvrir http://127.0.0.1:8766/formations.html : les présentations sont publiques. Cliquer sur un PDF, puis saisir les identifiants choisis. Une page de connexion affiche les champs Identifiant et Mot de passe. Une session locale d’une heure autorise ensuite les téléchargements. Arrêter le serveur avec Ctrl+C, puis effacer la variable : `Remove-Item Env:PREVIEW_PASSWORD`. Fermer la fenêtre privée utilisée pour l'essai pour effacer le cookie de session.

Tests automatisés : `node --test preview-auth.test.mjs`.

## Limites de l'essai

- Aucun identifiant réel ni mot de passe de production n'est enregistré dans Git.
- Le code du serveur est local : il ne suffit pas de le copier sur l'hébergement statique pour protéger OVH.
- Les PDF restent publics dans GitHub, son historique et la production. Cet essai valide le parcours d'accès, pas la confidentialité des documents déjà publiés.
- Pour une mise en service réelle, prévoir un environnement de préproduction HTTPS séparé, une protection côté serveur et un stockage privé des documents et des identifiants.
- Ne pas modifier le workflow de production ni fusionner cette expérience dans `main` pour essayer l'accès.

## Circuit de travail convenu

V2 est la branche de test du propriétaire. Préparer et vérifier les modifications sur V2, puis demander sa validation explicite avant toute fusion ou publication sur main. Ne pas utiliser la branche nommée test pour ce projet.
