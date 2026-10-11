# Protection des supports — préparation OVH / V2

## État vérifié le 11 octobre 2026

Dans l’espace client OVH, lecture seule : offre PERSO de cieri.fr, PHP global 8.1 ; thomas-salanova.fr et www.thomas-salanova.fr utilisent le dossier thomas. L’autre site utilise www. SFTP est activé sur le port 22 et le compte donne accès à la racine home. Le FTP Explorer intégré est retiré par OVH.

Aucun réglage OVH, fichier distant ou déploiement de production n’a été modifié. La version PHP effective du dossier thomas et son éventuel .ovhconfig restent à lire par SFTP. Les mots de passe SFTP présents dans GitHub Secrets n’ont pas été lus ni exportés.

## Contenu

- supports.php : administration et téléchargement contrôlé côté serveur, sans base de données.
- prepare.mjs : produit un paquet public/ et compsy-private/ à partir de site/, sans modifier les sources ni les documents originaux.
- init.php : création locale de la configuration administrateur privée (mot de passe jamais affiché).
- protection.test.mjs : tests HTTP de la version PHP.

Les codes numériques commencent à 4 chiffres, avec conservation des zéros initiaux. Un code protège tous les documents d’une formation. Le remplacement invalide les anciens accès. Les empreintes, les sessions et les compteurs de tentatives vivent hors de la racine publique ; aucune donnée secrète n’est placée dans Git. Dix échecs entraînent un blocage de cinq minutes pour la formation concernée ou l’administration. La connexion expire après une heure.

## Construire et tester

PHP 8.2 ou supérieur recommandé ; tests effectués localement avec PHP 8.5.11 officiel. Aucun module de base de données requis.

```powershell
node ovh-protection/prepare.mjs
$env:PHP_BINARY='chemin/vers/php.exe'
node --test ovh-protection/protection.test.mjs
```

Le constructeur exige un nouveau dossier de sortie afin de ne jamais écraser des codes ou un paquet précédent. Passer un chemin différent en argument pour reconstruire. Le dossier par défaut .prepared-ovh est exclu de Git. Son manifeste liste tous les anciens chemins retirés.

Les tests couvrent : pages publiques, copie exacte des PDF après authentification, deux documents pour une formation, isolation des codes, rejet des codes trop courts, protection CSRF, révocation de l’ancien code, persistance après redémarrage, limitation des tentatives et refus HTTP en production. Le serveur PHP de test ne traite pas .htaccess : son application reste à tester sur Apache/OVH.

## Préparer le compte administrateur

Sur la machine de préparation, choisir un mot de passe administrateur distinct des codes participants et du mot de passe de démonstration. Ne pas le mettre dans Git ni dans un journal.

```powershell
$credential=Get-Credential -UserName administrateur -Message 'Mot de passe administrateur du site (16 caractères minimum)'
$env:COMPSY_ADMIN_PASSWORD=$credential.GetNetworkCredential().Password
& $env:PHP_BINARY ovh-protection/init.php .prepared-ovh/compsy-private
Remove-Item Env:COMPSY_ADMIN_PASSWORD
```

Ce script refuse d’écraser config.json s’il existe. Le compte administrateur n’est jamais initialisé depuis une page publique. Les codes du prototype Node ne sont pas automatiquement importés : ils doivent être ressaisis dans la version PHP.

## Installation à effectuer uniquement après accord utilisateur

1. Lire et sauvegarder la configuration effective de thomas (.ovhconfig et .htaccess), ainsi que le site actuel. Ne pas modifier la version PHP globale : elle concerne d’autres sites. Préparer une version PHP maintenue pour thomas uniquement selon les possibilités OVH vérifiées.
2. Sauvegarder tout dossier compsy-private préexistant. Placer le paquet privé à /home/cierifrssr/compsy-private, hors de thomas et www. Vérifier que ce chemin n’est associé à aucun domaine. Les fichiers config.json et state.json ainsi que sessions/ et state.lock ne doivent jamais faire l’objet d’un mirror --delete.
3. Transférer documents/ et catalog.json dans ce dossier privé. Initialiser config.json une seule fois. Garder les permissions privées et vérifier que PHP peut les lire/écrire. En cas de nouvelle formation, transférer d’abord les PDF puis remplacer le catalogue ; garder les anciens documents jusqu’à la fin du changement public.
4. Adapter le workflow de main AVANT tout futur déploiement : construire le paquet, transférer uniquement documents/ et catalog.json vers le privé, puis publier public/ dans thomas. Le workflow actuel publie site/ et remettrait les PDF en accès public. Aucun changement de workflow actif n’est inclus à cette étape.
5. Publier le paquet public (avec suppression des anciens chemins PDF listés au manifeste). Les règles .htaccess bloquent également ces chemins en défense supplémentaire. Les descriptions restent accessibles sans code.
6. Tester sur OVH : HTTPS, accès admin, enregistrement et persistance des codes, chaque document, refus d’accès direct (y compris URL encodée et domaine www), absence d’exposition de compsy-private depuis tous les domaines. Valider la règle .htaccess et le comportement HTTPS de PHP derrière l’infrastructure OVH avant de finaliser.
7. Régler la publication GitHub avant de présenter les documents comme privés : le dépôt Compsy est public, y compris son historique, et contient les PDF. Le rendre privé évite l’accès anonyme futur, après accord utilisateur. Cela ne rappelle pas les copies déjà obtenues. Ne pas réécrire l’historique sans demande explicite.
8. Vérifier ensuite une mise à jour de page : les codes définis doivent rester utilisables. Mettre en place une sauvegarde privée du dossier de données.

## Retour arrière

Conserver le site antérieur et le paquet public protégé avant installation. Si la protection tombe en panne, bloquer les téléchargements et restaurer une version fonctionnelle de supports.php en conservant les données privées. Restaurer les PDF dans le dossier public rendrait leur accès public : ne pas le faire automatiquement comme rollback. Ne jamais supprimer le dossier privé pour annuler un changement de page.

## Ce qui reste avant la production

- Accès SFTP effectif, lecture des configurations existantes et sauvegarde distante.
- Choix du mot de passe administrateur final, installation et validation réelle sur OVH.
- Modification contrôlée du workflow de déploiement et décision sur le dépôt public.
- Validation explicite de l’utilisateur avant toute modification de production.

Sources : documentation officielle OVH sur .ovhconfig et les environnements PHP (https://docs.ovhcloud.com/fr/guides/web-cloud/web-hosting/configure-your-web-hosting), documentation PHP sur les sessions (https://www.php.net/function.session-set-cookie-params.php).
