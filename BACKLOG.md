# Suivi des instructions — Crocosheep

Ce fichier existe pour une seule raison : ne plus perdre d'instructions en route, surtout quand plusieurs arrivent d'affilée. À chaque nouveau message de Pierre contenant une demande, elle est ajoutée ici. **Dès qu'elle est vraiment livrée (codée + poussée) ou répondue, elle est retirée du fichier** — ce n'est pas un historique, juste l'état courant de ce qui reste ouvert. L'historique complet existe déjà ailleurs (commits Git, changelog dans l'appli).

Format : `[ ]` à faire · `[~]` en cours · `[?]` en attente d'une décision de Pierre.

---

## En attente (bloqué sur une décision de Pierre)

- `[?]` **Nettoyage des vieux fils Firestore inactifs** — supprimer une conversation ne supprime rien côté serveur (juste local, volontaire — voir plus haut). Vérifié que ce n'est pas un vrai problème à l'échelle actuelle (plan gratuit : 1 Go, un message ≈100-150 octets, il faudrait des millions de messages pour approcher la limite). Idée notée pour plus tard si l'usage devient massif : purge automatique des fils très anciens et inactifs. Rien à faire maintenant.

## Décisions de Pierre (pour mémoire, rien à coder)

- **Historique visible avant ajout du contact** — comportement actuel gardé tel quel.
- **Vraies notifications app fermée** — non, on reste sur la version "onglet ouvert" ; pas de passage en plan Blaze.
- **App Check (anti-bot réseau)** — pas maintenant, activation prévue quand il y aura du trafic ; le code client reste en place, inactif.
- **Boutique** — reste une maquette, pas de vrais paiements.

---

*Dernière mise à jour : session du 8 septembre 2026.*
