# Suivi des instructions — Crocosheep

Ce fichier existe pour une seule raison : ne plus perdre d'instructions en route, surtout quand plusieurs arrivent d'affilée. À chaque nouveau message de Pierre contenant une demande, elle est ajoutée ici. **Dès qu'elle est vraiment livrée (codée + poussée) ou répondue, elle est retirée du fichier** — ce n'est pas un historique, juste l'état courant de ce qui reste ouvert. L'historique complet existe déjà ailleurs (commits Git, changelog dans l'appli).

Format : `[ ]` à faire · `[~]` en cours · `[?]` en attente d'une décision de Pierre.

---

## En attente (bloqué sur une décision de Pierre)

- `[?]` **Historique visible avant ajout du contact** — comportement confirmé normal (pas un bug) : le fil `pairs/{pairId}` existe dès qu'une des deux personnes connaît le code de l'autre et écrit, indépendamment de l'ajout local en contact. Question posée : garder ce comportement, ou masquer les messages reçus tant que le contact n'est pas ajouté localement (vraie demande de contact) ?
- `[?]` **Vraies notifications app fermée** — nécessite Firebase Cloud Messaging + Service Worker + Cloud Function, ce qui impose de passer le projet Firebase en facturation payante (plan Blaze, carte bancaire). Version "onglet ouvert" déjà livrée sans ce coût. Décision financière laissée à Pierre.
- `[?]` **App Check (anti-bot réseau)** — code déjà branché côté client, inactif tant qu'une clé reCAPTCHA v3 n'est pas créée par Pierre sur google.com/recaptcha/admin et collée dans `firebase-config.js`.
- `[?]` **Vrais paiements dans la boutique** — laissée en maquette (décision autonome, conforme à l'instruction initiale) ; un vrai système demanderait comptes marchand + engagements financiers/légaux que je ne prends pas seul.
- `[?]` **Nettoyage des vieux fils Firestore inactifs** — supprimer une conversation ne supprime rien côté serveur (juste local, volontaire — voir plus haut). Vérifié que ce n'est pas un vrai problème à l'échelle actuelle (plan gratuit : 1 Go, un message ≈100-150 octets, il faudrait des millions de messages pour approcher la limite). Idée notée pour plus tard si l'usage devient massif : purge automatique des fils très anciens et inactifs. Rien à faire maintenant.

---

*Dernière mise à jour : session du 20 août 2026.*
