# Suivi des instructions — Crocosheep

Ce fichier existe pour une seule raison : ne plus perdre d'instructions en route, surtout quand plusieurs arrivent d'affilée. À chaque nouveau message de Pierre contenant une demande, elle est ajoutée ici. **Dès qu'elle est vraiment livrée (codée + poussée) ou répondue, elle est retirée du fichier** — ce n'est pas un historique, juste l'état courant de ce qui reste ouvert. L'historique complet existe déjà ailleurs (commits Git, changelog dans l'appli).

Format : `[ ]` à faire · `[~]` en cours · `[?]` en attente d'une décision de Pierre.

---

## En attente (bloqué sur une décision de Pierre)

- `[?]` **Règles Firestore : authentifié ≠ autorisé** — trouvé lors de l'audit sécurité du 10/09. Les règles actuelles (`allow read, write: if request.auth != null`) vérifient juste "authentifié anonymement" (gratuit, automatique, n'importe qui), jamais "propriétaire de ce code/cette conversation précise". Concrètement, avec juste le SDK Firebase public (config déjà dans le repo, normal) : n'importe qui peut lire n'importe quel fil `pairs/{pairId}/messages` en devinant/balayant deux codes (petit espace : 1 lettre + 3 chiffres = 26 000 combinaisons), lire n'importe quel `profiles/{code}` (déjà su et assumé pour les stats), et surtout **écrire** — forger un message en se faisant passer pour n'importe quel code, ou modifier directement le stock/palmarès de n'importe qui, sans passer par l'appli. Corrigé côté client ce qui pouvait l'être (échappement HTML partout, validation du format de code, garde-fou contre un message mal formé — v21). Le vrai correctif (lier chaque code à l'UID Firebase Auth qui l'a créé, et vérifier cette propriété dans les règles) est un vrai chantier avec migration des comptes existants, pas une ligne à changer — j'attends le feu vert de Pierre avant de m'y lancer.
- `[?]` **Nettoyage des vieux fils Firestore inactifs** — supprimer une conversation ne supprime rien côté serveur (juste local, volontaire — voir plus haut). Vérifié que ce n'est pas un vrai problème à l'échelle actuelle (plan gratuit : 1 Go, un message ≈100-150 octets, il faudrait des millions de messages pour approcher la limite). Idée notée pour plus tard si l'usage devient massif : purge automatique des fils très anciens et inactifs. Rien à faire maintenant.

## Décisions de Pierre (pour mémoire, rien à coder)

- **Historique visible avant ajout du contact** — comportement actuel gardé tel quel.
- **Vraies notifications app fermée** — non, on reste sur la version "onglet ouvert" ; pas de passage en plan Blaze.
- **App Check (anti-bot réseau)** — pas maintenant, activation prévue quand il y aura du trafic ; le code client reste en place, inactif.
- **Boutique** — reste une maquette, pas de vrais paiements.

---

*Dernière mise à jour : session du 10 septembre 2026.*
