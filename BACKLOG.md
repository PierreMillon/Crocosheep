# Suivi des instructions — Crocosheep

Ce fichier existe pour une seule raison : ne plus perdre d'instructions en route. À chaque nouveau message de Pierre contenant une demande, elle est résumée ici. Une fois traitée (codée + poussée, ou répondue), elle passe dans **Fait**. Ce qui reste ouvert — bloqué sur une décision de Pierre, ou explicitement mis de côté — reste visible dans **En attente**.

Format : `[ ]` à faire · `[~]` en cours · `[x]` fait (avec commit si applicable) · `[?]` en attente d'une décision de Pierre.

---

## En attente (bloqué sur une décision de Pierre)

- `[?]` **Historique visible avant ajout du contact** — comportement actuel confirmé normal (pas un bug) : le fil `pairs/{pairId}` existe dès qu'une des deux personnes connaît le code de l'autre et écrit, indépendamment de l'ajout local en contact ; "ajouter un contact" est juste un signet local, ça n'a jamais été une porte d'accès à la conversation. Séparation entre paires différentes confirmée intacte (chaque paire = son propre fil isolé). Question posée à Pierre : préfère-t-il garder ce comportement, ou masquer les messages reçus tant que le contact n'est pas ajouté localement (vraie demande de contact) ? Pas de code changé tant qu'il n'a pas tranché.
- `[?]` **Vraies notifications app fermée** — nécessite Firebase Cloud Messaging + Service Worker + Cloud Function, ce qui impose de passer le projet Firebase en facturation payante (plan Blaze, carte bancaire). Version "onglet ouvert" déjà livrée (v10) sans ce coût. Décision financière laissée à Pierre.
- `[?]` **App Check (anti-bot réseau)** — code déjà branché côté client, inactif tant qu'une clé reCAPTCHA v3 n'est pas créée par Pierre sur google.com/recaptcha/admin et collée dans `firebase-config.js`.
- `[?]` **Vrais paiements dans la boutique** — laissée en maquette (décision autonome, conforme à l'instruction initiale de Pierre) ; un vrai système demanderait comptes marchand + engagements financiers/légaux que je ne prends pas seul.
- `[?]` **"Animaux supplémentaires" et "faire fonctionner la boutique en vrai"** — mentionnés par Pierre une fois sans détail retrouvable dans l'historique ; les 3 animaux (dragon/panda/T-Rex) ont été ajoutés séparément sur une demande claire, mais si Pierre voulait autre chose de plus précis, ça reste à préciser.

## Fait

### Base de l'appli (v1-v4)
- `[x]` Maquette initiale : contacts, discussion, profil, mouton illustré, envoi libre illimité, déblocage crocodile après moutons envoyés
- `[x]` Icône iPhone (mouton SVG maison — pas l'emoji, question de cohérence entre plateformes), fond orange, correction du défilement vers le dernier message
- `[x]` Synchronisation Firebase entre deux téléphones, appairage par lien partagé
- `[x]` Corrections tactiles iOS : halo gris au tap supprimé, zoom qui volait les taps rapides bloqué

### Sécurité et identité (v5, v7)
- `[x]` Un appareil peut adopter le code d'un autre pour tester avec la même identité des deux côtés
- `[x]` Faille corrigée : le code public seul permettait d'usurper une identité → clé de récupération séparée, jamais incluse dans le lien de partage
- `[x]` Anti-triche : clics trop rapides/robotiques ignorés silencieusement, horloge calée sur le serveur Firestore (pas celle, manipulable, du téléphone)
- `[x]` App Check préparé côté code (voir "En attente" pour l'activation)

### Mécanique de jeu (v6, v8, v9)
- `[x]` Chaîne de déblocage généralisée : chaque palier dépensé fait progresser vers le suivant (pas que le mouton), avec seuil aléatoire 9-11 par défaut
- `[x]` Algorithme caché multi-paramètres : +1 si envoi le matin (7h-12h), -1 sur seconde impaire, +1 si écart de fuseau horaire du contact >6h, +1 si le nombre de moutons envoyés dans la vie est premier
- `[x]` "Version fine" du filet de secours mouton : envoyer uniquement des moutons peut aussi débloquer n'importe quel palier directement, juste ×8 moins efficace par échelon sauté que la chaîne directe — pour ne jamais bloquer durablement qui n'a pas de chance
- `[x]` 3 animaux supplémentaires : dragon, panda, T-Rex (après rhinocéros)
- `[x]` Crocodile en vraie illustration (logo de Pierre, récupéré via upload GitHub direct, recolorié par script : corps vert foncé, contour et œil gardés)

### Interface (v6, v7, v8)
- `[x]` Bouton mouton plein largeur qui se divise en bandes horizontales égales au fil des déblocages ; animaux verrouillés ou à stock épuisé invisibles (pas de cadenas/bouton mort)
- `[x]` Bouton mouton agrandi, fond gris (contraste avec le mouton blanc/noir)
- `[x]` Heure exacte (HH:MM:SS) sous chaque message, horloge en direct au-dessus des boutons d'envoi
- `[x]` Liste des contacts en tableau de bord (code + dernier échange, mis à jour en temps réel), avatar rond retiré partout
- `[x]` Numéro de version cliquable → changelog détaillé par version
- `[x]` Animations qui rejouaient sur tout l'existant à chaque envoi (boutons, bulles) → retirées

### Fonctionnalités (v7, v8, v10)
- `[x]` Groupes : créer, inviter des contacts, sondage muet lancé par le créateur (un seul bouton), les membres répondent par mouton ou ne répondent pas, seul le créateur voit le détail des réponses en direct, créateur non compté parmi les votants attendus
- `[x]` Boutique factice sur le profil (maquette visuelle assumée, aucun vrai paiement)
- `[x]` Bot de démo (🤖 Bot) toujours disponible, purement local, pour tester seul
- `[x]` Bouton "+ Ajouter un contact" par code, en plus du lien de partage (qui marche toujours pareil, sans bouton)
- `[x]` Profil public : n'importe quel contact peut voir le palmarès complet (envoyé/reçu/en stock, compteur précis) de n'importe qui — décision explicite de Pierre, pas de garantie de confidentialité sur ces stats
- `[x]` Stock/paliers synchronisés entre appareils partageant une identité (corrigeait : 4 lions sur un appareil, 1 crocodile/0 lion sur l'autre, même identité)
- `[x]` Notifications dans le navigateur (mouton reçu, invitation de groupe, sondage lancé) tant qu'un onglet est ouvert quelque part

### Bugs trouvés en usage réel
- `[x]` **Régression critique** : le stock ne se régénérait plus après un premier déblocage (condition de trop dans `checkUnlock` après extraction de `grantUnlock`) — repéré par Pierre après 435 moutons envoyés, corrigé et vérifié
- `[x]` Règles Firestore manquantes pour `groups`/`_clock`/`profiles` → bouton "créer un groupe" ne faisait rien silencieusement
- `[x]` Cache navigateur pouvait servir un `script.js` périmé avec un `index.html` à jour → cache-busting `?v=N` ajouté, à incrémenter à chaque déploiement
- `[x]` **Notifications inactives sur iPhone** : `new Notification(...)` appelé directement depuis la page est silencieusement ignoré par iOS Safari, même permission accordée. Corrigé en ajoutant un vrai service worker (`sw.js`) et en passant par `registration.showNotification()` — c'est le seul chemin qu'iOS honore. Testé : le service worker s'enregistre et s'active correctement (vérifié en conditions réelles via un serveur local, `file://` ne permettant pas ce test). Limite restant côté iOS, pas contournable : ça ne marche que si l'appli a été ajoutée à l'écran d'accueil (pas dans un simple onglet Safari), sur iOS 16.4+.
- `[x]` **Profil public qui ne se mettait pas à jour** (repéré sur le contact B-687 : crocodile+mouton envoyés visibles dans la discussion, mais palmarès public resté à 0/0/0) : l'écriture du message et celle du compteur agrégé (`profiles/{pseudo}.sentTotals`) sont deux opérations Firestore séparées ; la deuxième n'avait aucun filet de rattrapage — un raté réseau la perdait pour toujours, en silence. Corrigé par une file d'attente locale (`state.pendingStatsSync`) avec réessai automatique (retour réseau, toutes les 15s, et à la reprise d'une session interrompue) tant que l'écriture n'est pas confirmée. Vérifié par test automatisé (échec simulé puis confirmation après "retour réseau").

### Autre
- `[x]` Refactoring : extraction de `withAuth()` (remplace ~15 répétitions du même bloc d'authentification Firestore) et de raccourcis `threadRef`/`profileRef`/`groupRef` — aucun changement de comportement, suite de tests complète avant/après
- `[x]` Questions produit répondues : traçabilité légale (les codes sont anonymes pour les autres utilisateurs, pas pour la justice sur réquisition), fonctionnement du lien de partage, image du logo crocodile (récupérée via upload GitHub après échec de toutes les autres méthodes)

---

*Dernière mise à jour : session du 17 août 2026.*
