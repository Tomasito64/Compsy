# Codes par formation — essai V2 uniquement

Les présentations restent publiques. Seuls les PDF référencés dans formations.html demandent le code de leur formation. Les deux supports IRTS EJE partagent un code. Les autres ressources restent publiques.

## Démarrer localement

Dans PowerShell, à la racine du dépôt :

```powershell
$credential = Get-Credential -UserName administrateur -Message 'Choisir le mot de passe administrateur local'
$env:PREVIEW_ADMIN_PASSWORD = $credential.GetNetworkCredential().Password
node preview-auth.mjs
```

Ouvrir http://127.0.0.1:8766/admin, saisir le mot de passe administrateur puis définir un code (8 caractères minimum) pour chaque formation. Sans code défini, ses téléchargements sont fermés. Les participants n’ont pas d’identifiant : ils saisissent uniquement le code transmis.

Un nouveau code révoque immédiatement les accès précédents à cette formation. Les sessions expirent après une heure. Dix échecs déclenchent une temporisation de cinq minutes. Bouton de déconnexion dans l’administration.

Les codes sont stockés sous forme d’empreintes scrypt dans .preview-private/codes.json, hors de site/, exclu de Git. Ne pas publier ce dossier. Il persiste entre les redémarrages ; en conserver une sauvegarde pour garder les codes. PREVIEW_DATA_FILE permet de choisir un autre emplacement privé hors du dossier public. Aucun code réel ne doit être écrit dans ce document ou les tests.

## Vérifier

```powershell
node --test preview-auth.test.mjs
```

Tests : pages publiques, isolation entre formations, accès aux deux PDF d’une formation, protection de l’administration, contrôle CSRF, remplacement et persistance des codes.

## Limite de cette version

Serveur de démonstration local lié à 127.0.0.1, pas un déploiement OVH. main et la production ne sont pas modifiés. Les PDF restent publics sur GitHub et sur le site actuel. Avant production : vérifier l’hébergement, installer la vérification serveur et un stockage privé persistant, retirer les copies publiques concernées et tester HTTPS. Une fusion seule de V2 vers main ne déploie pas cette protection.

Workflow : changements sur V2, validation utilisateur, puis accord explicite avant production.
