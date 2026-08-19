/* -------------------------------------------------------------------
 * Service worker — deux responsabilités bien séparées :
 *
 * 1) Notifications (existant, INCHANGÉ). Sert à afficher les
 *    notifications via registration.showNotification(), pas à du push
 *    app-fermée (ça, ça demanderait Firebase Cloud Messaging + plan
 *    payant, voir BACKLOG.md).
 *
 *    Pourquoi ce fichier existe à l'origine : sur iOS Safari,
 *    new Notification(...) appelé directement depuis la page ne
 *    fonctionne pas (silencieusement ignoré, même avec la permission
 *    accordée) — seule une notification déclenchée via un service
 *    worker enregistré s'affiche vraiment. Sans ce fichier, le bouton
 *    "Activer les notifications" peut passer au vert mais aucune
 *    notification n'apparaît jamais sur iPhone.
 *
 * 2) Mode hors-ligne (nouveau), volontairement en réseau-d'abord et
 *    PAS en cache-d'abord contrairement aux autres sites du même
 *    auteur (licence-math, alice-et-sophie, exercices-l1-math) — ceux-
 *    là sont des sites statiques sans mécanisme de fraîcheur, alors
 *    que Crocosheep a DÉJÀ un système explicite et soigné qui vérifie
 *    version.json et recharge automatiquement l'appli dès qu'une
 *    nouvelle version est en ligne (voir checkForUpdate() dans
 *    script.js — "Pierre veut que les gens récupèrent la dernière
 *    version sans rien avoir à faire"). Un cache-first classique
 *    servirait un index.html/script.js potentiellement périmés à
 *    CHAQUE visite tant que le navigateur n'a pas re-détecté sw.js
 *    lui-même comme changé (pas immédiat, contrairement à
 *    version.json qui est vérifié activement toutes les 5 min) — ça
 *    irait directement à l'encontre de ce que Pierre a déjà demandé et
 *    fait coder pour ce site précis.
 *
 *    Stratégie retenue : réseau d'abord, cache en secours (et en
 *    filet de sécurité write-through — chaque réponse réseau réussie
 *    réalimente le cache au passage). En ligne, l'appli reste donc
 *    toujours aussi fraîche qu'avant (rien ne change) ; hors-ligne,
 *    elle affiche la dernière version qui a réellement chargé avec
 *    succès plutôt qu'un écran d'erreur vide. Pas de liste de
 *    fichiers à précharger à l'installation ni de VERSION à faire
 *    avancer en parallèle du site (contrairement aux 3 autres sites) :
 *    le cache se remplit tout seul au fil de la navigation réelle,
 *    donc pas de risque de désynchronisation avec les ?v= de
 *    script.js/style.css qui changent à chaque déploiement.
 *
 *    version.json n'est JAMAIS intercepté (voir le fetch handler) :
 *    c'est le fichier que checkForUpdate() interroge pour détecter
 *    une nouvelle version, il doit toujours atteindre le réseau réel.
 *    Les requêtes Firebase (firestore.googleapis.com, etc.) et les
 *    scripts gstatic.com sont cross-origin, donc déjà ignorés par la
 *    garde `url.origin !== self.location.origin` — jamais mis en
 *    cache, jamais interceptés : Crocosheep reste fondamentalement une
 *    appli qui a besoin du réseau pour envoyer/recevoir de vrais
 *    messages, le hors-ligne ne sert qu'à afficher une coquille déjà
 *    vue plutôt qu'une page blanche.
 * ------------------------------------------------------------- */

const SHELL_CACHE = "crocosheep-shell";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // Firebase/gstatic : jamais touché
  if (url.pathname.endsWith("/version.json")) return; // doit toujours être frais, voir checkForUpdate()

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Rien d'autre à faire ici pour les notifications : notify() dans
// script.js appelle self.registration.showNotification() directement
// depuis la page via la référence obtenue au moment de l'enregistrement.
