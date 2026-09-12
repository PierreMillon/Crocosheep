# Suivi des instructions — Crocosheep

Ce fichier existe pour une seule raison : ne plus perdre d'instructions en route, surtout quand plusieurs arrivent d'affilée. À chaque nouveau message de Pierre contenant une demande, elle est ajoutée ici. **Dès qu'elle est vraiment livrée (codée + poussée) ou répondue, elle est retirée du fichier** — ce n'est pas un historique, juste l'état courant de ce qui reste ouvert. L'historique complet existe déjà ailleurs (commits Git, changelog dans l'appli).

Format : `[ ]` à faire · `[~]` en cours · `[?]` en attente d'une décision de Pierre.

---

## En attente (bloqué sur une décision de Pierre)

- `[?]` **Règles Firestore : authentifié ≠ autorisé — le correctif est prêt, il attend d'être collé dans la Console Firebase.** Suite au feu vert ("Fonce") : le code client (v22) réclame maintenant la propriété de chaque code au démarrage (`owners/{code}` + `uidToCode/{uid}`, preuve par hash de la clé de récupération, jamais la clé elle-même), avec transition en douceur (les comptes pas encore relancés gardent l'ancien comportement le temps de rouvrir l'appli). Le fichier `firestore.rules` à la racine du repo contient les nouvelles règles complètes (profils, messages, groupes/sondages) qui font vraiment respecter cette propriété. **Il reste une seule chose à faire, et je ne peux pas la faire moi-même : coller le contenu de `firestore.rules` dans Firebase Console → Firestore Database → Règles, et publier.** Tant que ce n'est pas fait, le code client tourne mais les anciennes règles permissives restent actives côté serveur.
- `[?]` **Nettoyage des vieux fils Firestore inactifs** — supprimer une conversation ne supprime rien côté serveur (juste local, volontaire — voir plus haut). Vérifié que ce n'est pas un vrai problème à l'échelle actuelle (plan gratuit : 1 Go, un message ≈100-150 octets, il faudrait des millions de messages pour approcher la limite). Idée notée pour plus tard si l'usage devient massif : purge automatique des fils très anciens et inactifs. Rien à faire maintenant.

- `[ ]` **Vraies notifications app fermée — identifié comme le vrai frein, mais pas maintenant.** Pierre confirme (12/09) que l'absence de notification quand l'appli est fermée est le vrai frein à l'usage quotidien, surtout avec l'objectif de faire grandir l'appli (voir plus bas) — ça contredit la décision du 10/09 ("on reste sur onglet ouvert"). Le vrai correctif (Cloud Function déclenchée sur l'écriture Firestore) exige le plan Blaze (carte bancaire à attacher au projet, même si la facture resterait à 0 € vu le volume). Demandé explicitement à Pierre : pas tout de suite, il attachera la carte quand il sera prêt. Je ne code rien tant qu'il ne me dit pas que c'est fait.
- `[ ]` **Objectif de croissance — l'appli n'est plus pensée que pour un cercle intime.** Pierre veut que Crocosheep puisse grandir à plus de monde, pas juste rester entre quelques proches. Aucune demande concrète encore, mais ça doit influencer les priorités à venir : onboarding plus clair pour un inconnu qui découvre l'appli, parcours d'invitation plus visible, etc. Pas de code à écrire tant qu'une idée précise n'est pas posée.
- `[ ]` **Boutique — abandon de l'idée de vrai paiement, direction "pub contre déblocage".** Pierre veut remplacer l'idée d'un système de paiement réel par des publicités récompensées : regarder une pub au lieu de payer pour débloquer un avantage. La boutique reste une maquette telle quelle en attendant — pas de code à écrire avant d'avoir choisi comment intégrer de la pub sur un site statique GitHub Pages (réseau de pub web, contraintes techniques à étudier).

## Décisions de Pierre (pour mémoire, rien à coder)

- **Historique visible avant ajout du contact** — comportement actuel gardé tel quel.
- **Algorithme caché (bonus fuseau horaire, nombre premier, etc.)** — reste un secret jamais expliqué dans l'appli ; Pierre est à l'aise si des amis en discutent et essaient de le percer entre eux en dehors de l'appli, pas besoin de rendre ça plus lisible côté interface.
- **App Check (anti-bot réseau)** — pas maintenant, activation prévue quand il y aura du trafic ; le code client reste en place, inactif.

---

*Dernière mise à jour : session du 12 septembre 2026.*
