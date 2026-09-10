# Suivi des instructions — Crocosheep

Ce fichier existe pour une seule raison : ne plus perdre d'instructions en route, surtout quand plusieurs arrivent d'affilée. À chaque nouveau message de Pierre contenant une demande, elle est ajoutée ici. **Dès qu'elle est vraiment livrée (codée + poussée) ou répondue, elle est retirée du fichier** — ce n'est pas un historique, juste l'état courant de ce qui reste ouvert. L'historique complet existe déjà ailleurs (commits Git, changelog dans l'appli).

Format : `[ ]` à faire · `[~]` en cours · `[?]` en attente d'une décision de Pierre.

---

## En attente (bloqué sur une décision de Pierre)

- `[?]` **Règles Firestore : authentifié ≠ autorisé — le correctif est prêt, il attend d'être collé dans la Console Firebase.** Suite au feu vert ("Fonce") : le code client (v22) réclame maintenant la propriété de chaque code au démarrage (`owners/{code}` + `uidToCode/{uid}`, preuve par hash de la clé de récupération, jamais la clé elle-même), avec transition en douceur (les comptes pas encore relancés gardent l'ancien comportement le temps de rouvrir l'appli). Le fichier `firestore.rules` à la racine du repo contient les nouvelles règles complètes (profils, messages, groupes/sondages) qui font vraiment respecter cette propriété. **Il reste une seule chose à faire, et je ne peux pas la faire moi-même : coller le contenu de `firestore.rules` dans Firebase Console → Firestore Database → Règles, et publier.** Tant que ce n'est pas fait, le code client tourne mais les anciennes règles permissives restent actives côté serveur.
- `[?]` **Nettoyage des vieux fils Firestore inactifs** — supprimer une conversation ne supprime rien côté serveur (juste local, volontaire — voir plus haut). Vérifié que ce n'est pas un vrai problème à l'échelle actuelle (plan gratuit : 1 Go, un message ≈100-150 octets, il faudrait des millions de messages pour approcher la limite). Idée notée pour plus tard si l'usage devient massif : purge automatique des fils très anciens et inactifs. Rien à faire maintenant.

## Décisions de Pierre (pour mémoire, rien à coder)

- **Historique visible avant ajout du contact** — comportement actuel gardé tel quel.
- **Vraies notifications app fermée** — non, on reste sur la version "onglet ouvert" ; pas de passage en plan Blaze.
- **App Check (anti-bot réseau)** — pas maintenant, activation prévue quand il y aura du trafic ; le code client reste en place, inactif.
- **Boutique** — reste une maquette, pas de vrais paiements.

---

*Dernière mise à jour : session du 10 septembre 2026.*
