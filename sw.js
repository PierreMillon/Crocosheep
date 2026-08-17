/* -------------------------------------------------------------------
 * Service worker minimal — sert uniquement à afficher les notifications
 * via registration.showNotification(), pas à du push app-fermée (ça,
 * ça demanderait Firebase Cloud Messaging + plan payant, voir BACKLOG.md).
 *
 * Pourquoi ce fichier existe : sur iOS Safari, new Notification(...)
 * appelé directement depuis la page ne fonctionne pas (silencieusement
 * ignoré, même avec la permission accordée) — seule une notification
 * déclenchée via un service worker enregistré s'affiche vraiment.
 * Sans ce fichier, le bouton "Activer les notifications" peut passer au
 * vert mais aucune notification n'apparaît jamais sur iPhone.
 * ------------------------------------------------------------- */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Rien d'autre à faire ici : notify() dans script.js appelle
// self.registration.showNotification() directement depuis la page via
// la référence obtenue au moment de l'enregistrement.
