(() => {
  "use strict";

  const STORAGE_KEY = "crocosheep_state_v1";

  /* ---------------------------------------------------------------
   * Icônes
   * -----------------------------------------------------------------
   * Le mouton est le seul animal à avoir une silhouette SVG dédiée
   * (envoi gratuit et illimité, donc vu en boucle) : une laine faite
   * de cercles superposés + une tête noire. Les autres animaux
   * restent en emoji pour l'instant — suffisant pour la maquette,
   * à remplacer par de vraies illustrations avant la V1.
   * ------------------------------------------------------------- */
  const SHEEP_SVG = `
    <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mouton">
      <rect x="30" y="70" width="7" height="14" rx="3.5" fill="#1c1a17"/>
      <rect x="47" y="73" width="7" height="14" rx="3.5" fill="#1c1a17"/>
      <rect x="64" y="70" width="7" height="14" rx="3.5" fill="#1c1a17"/>
      <circle cx="36" cy="50" r="22" fill="#f4ede0" stroke="#e4d8c2" stroke-width="2"/>
      <circle cx="58" cy="45" r="24" fill="#f4ede0" stroke="#e4d8c2" stroke-width="2"/>
      <circle cx="75" cy="55" r="17" fill="#f4ede0" stroke="#e4d8c2" stroke-width="2"/>
      <circle cx="50" cy="63" r="20" fill="#f4ede0" stroke="#e4d8c2" stroke-width="2"/>
      <ellipse cx="83" cy="37" rx="13" ry="11" fill="#1c1a17"/>
      <ellipse cx="73" cy="28" rx="5" ry="3" fill="#1c1a17" transform="rotate(-35 73 28)"/>
      <ellipse cx="93" cy="29" rx="5" ry="3" fill="#1c1a17" transform="rotate(35 93 29)"/>
    </svg>`;

  // Vrai logo crocodile de Pierre (croco-real.png), recolorié par script :
  // corps passé en vert foncé (#173a1c), contour vert d'origine gardé, œil
  // noir gardé tel quel — remplace l'ancienne silhouette dessinée à la main.
  const CROCODILE_IMG = `<img src="croco-real.png" alt="Crocodile" loading="lazy">`;

  // Icône du bouton "supprimer" révélé par balayage — pixel art repris du
  // projet L1 math (licence-math/menu.js, SKULL_SVG). Deux versions y
  // existent (une petite 7x8 pour un décompte de score, une détaillée
  // 23x30 pour un bouton) ; comparées visuellement côte à côte à la
  // taille réelle du bouton ici, la détaillée est nettement plus lisible
  // (orbites et dents identifiables) alors que la petite reste une tache
  // abstraite à cette taille — c'est donc celle-ci qui est reprise.
  const SKULL_SVG = `<svg class="skull-icon" viewBox="0 0 23 30" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true"><rect x="8" y="0" width="1" height="1"/><rect x="9" y="0" width="1" height="1"/><rect x="10" y="0" width="1" height="1"/><rect x="11" y="0" width="1" height="1"/><rect x="12" y="0" width="1" height="1"/><rect x="13" y="0" width="1" height="1"/><rect x="6" y="1" width="1" height="1"/><rect x="7" y="1" width="1" height="1"/><rect x="14" y="1" width="1" height="1"/><rect x="15" y="1" width="1" height="1"/><rect x="16" y="1" width="1" height="1"/><rect x="4" y="2" width="1" height="1"/><rect x="5" y="2" width="1" height="1"/><rect x="17" y="2" width="1" height="1"/><rect x="18" y="2" width="1" height="1"/><rect x="3" y="3" width="1" height="1"/><rect x="19" y="3" width="1" height="1"/><rect x="2" y="4" width="1" height="1"/><rect x="20" y="4" width="1" height="1"/><rect x="1" y="5" width="1" height="1"/><rect x="2" y="5" width="1" height="1"/><rect x="20" y="5" width="1" height="1"/><rect x="21" y="5" width="1" height="1"/><rect x="1" y="6" width="1" height="1"/><rect x="21" y="6" width="1" height="1"/><rect x="0" y="7" width="1" height="1"/><rect x="1" y="7" width="1" height="1"/><rect x="21" y="7" width="1" height="1"/><rect x="22" y="7" width="1" height="1"/><rect x="0" y="8" width="1" height="1"/><rect x="2" y="8" width="1" height="1"/><rect x="20" y="8" width="1" height="1"/><rect x="22" y="8" width="1" height="1"/><rect x="0" y="9" width="1" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="20" y="9" width="1" height="1"/><rect x="22" y="9" width="1" height="1"/><rect x="0" y="10" width="1" height="1"/><rect x="2" y="10" width="1" height="1"/><rect x="20" y="10" width="1" height="1"/><rect x="22" y="10" width="1" height="1"/><rect x="0" y="11" width="1" height="1"/><rect x="1" y="11" width="1" height="1"/><rect x="5" y="11" width="1" height="1"/><rect x="6" y="11" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="14" y="11" width="1" height="1"/><rect x="15" y="11" width="1" height="1"/><rect x="16" y="11" width="1" height="1"/><rect x="17" y="11" width="1" height="1"/><rect x="21" y="11" width="1" height="1"/><rect x="22" y="11" width="1" height="1"/><rect x="0" y="12" width="1" height="1"/><rect x="1" y="12" width="1" height="1"/><rect x="4" y="12" width="1" height="1"/><rect x="5" y="12" width="1" height="1"/><rect x="6" y="12" width="1" height="1"/><rect x="7" y="12" width="1" height="1"/><rect x="8" y="12" width="1" height="1"/><rect x="9" y="12" width="1" height="1"/><rect x="13" y="12" width="1" height="1"/><rect x="14" y="12" width="1" height="1"/><rect x="15" y="12" width="1" height="1"/><rect x="16" y="12" width="1" height="1"/><rect x="17" y="12" width="1" height="1"/><rect x="18" y="12" width="1" height="1"/><rect x="21" y="12" width="1" height="1"/><rect x="22" y="12" width="1" height="1"/><rect x="0" y="13" width="1" height="1"/><rect x="1" y="13" width="1" height="1"/><rect x="3" y="13" width="1" height="1"/><rect x="4" y="13" width="1" height="1"/><rect x="5" y="13" width="1" height="1"/><rect x="6" y="13" width="1" height="1"/><rect x="7" y="13" width="1" height="1"/><rect x="8" y="13" width="1" height="1"/><rect x="9" y="13" width="1" height="1"/><rect x="13" y="13" width="1" height="1"/><rect x="14" y="13" width="1" height="1"/><rect x="15" y="13" width="1" height="1"/><rect x="16" y="13" width="1" height="1"/><rect x="17" y="13" width="1" height="1"/><rect x="18" y="13" width="1" height="1"/><rect x="19" y="13" width="1" height="1"/><rect x="21" y="13" width="1" height="1"/><rect x="22" y="13" width="1" height="1"/><rect x="1" y="14" width="1" height="1"/><rect x="3" y="14" width="1" height="1"/><rect x="4" y="14" width="1" height="1"/><rect x="5" y="14" width="1" height="1"/><rect x="6" y="14" width="1" height="1"/><rect x="7" y="14" width="1" height="1"/><rect x="8" y="14" width="1" height="1"/><rect x="9" y="14" width="1" height="1"/><rect x="13" y="14" width="1" height="1"/><rect x="14" y="14" width="1" height="1"/><rect x="15" y="14" width="1" height="1"/><rect x="16" y="14" width="1" height="1"/><rect x="17" y="14" width="1" height="1"/><rect x="18" y="14" width="1" height="1"/><rect x="19" y="14" width="1" height="1"/><rect x="21" y="14" width="1" height="1"/><rect x="1" y="15" width="1" height="1"/><rect x="3" y="15" width="1" height="1"/><rect x="4" y="15" width="1" height="1"/><rect x="5" y="15" width="1" height="1"/><rect x="6" y="15" width="1" height="1"/><rect x="7" y="15" width="1" height="1"/><rect x="8" y="15" width="1" height="1"/><rect x="10" y="15" width="1" height="1"/><rect x="11" y="15" width="1" height="1"/><rect x="12" y="15" width="1" height="1"/><rect x="14" y="15" width="1" height="1"/><rect x="15" y="15" width="1" height="1"/><rect x="16" y="15" width="1" height="1"/><rect x="17" y="15" width="1" height="1"/><rect x="18" y="15" width="1" height="1"/><rect x="19" y="15" width="1" height="1"/><rect x="21" y="15" width="1" height="1"/><rect x="0" y="16" width="1" height="1"/><rect x="4" y="16" width="1" height="1"/><rect x="5" y="16" width="1" height="1"/><rect x="6" y="16" width="1" height="1"/><rect x="7" y="16" width="1" height="1"/><rect x="10" y="16" width="1" height="1"/><rect x="11" y="16" width="1" height="1"/><rect x="12" y="16" width="1" height="1"/><rect x="15" y="16" width="1" height="1"/><rect x="16" y="16" width="1" height="1"/><rect x="17" y="16" width="1" height="1"/><rect x="18" y="16" width="1" height="1"/><rect x="22" y="16" width="1" height="1"/><rect x="0" y="17" width="1" height="1"/><rect x="9" y="17" width="1" height="1"/><rect x="10" y="17" width="1" height="1"/><rect x="11" y="17" width="1" height="1"/><rect x="12" y="17" width="1" height="1"/><rect x="13" y="17" width="1" height="1"/><rect x="22" y="17" width="1" height="1"/><rect x="0" y="18" width="1" height="1"/><rect x="1" y="18" width="1" height="1"/><rect x="9" y="18" width="1" height="1"/><rect x="10" y="18" width="1" height="1"/><rect x="11" y="18" width="1" height="1"/><rect x="12" y="18" width="1" height="1"/><rect x="13" y="18" width="1" height="1"/><rect x="21" y="18" width="1" height="1"/><rect x="22" y="18" width="1" height="1"/><rect x="1" y="19" width="1" height="1"/><rect x="2" y="19" width="1" height="1"/><rect x="3" y="19" width="1" height="1"/><rect x="4" y="19" width="1" height="1"/><rect x="9" y="19" width="1" height="1"/><rect x="10" y="19" width="1" height="1"/><rect x="11" y="19" width="1" height="1"/><rect x="12" y="19" width="1" height="1"/><rect x="13" y="19" width="1" height="1"/><rect x="18" y="19" width="1" height="1"/><rect x="19" y="19" width="1" height="1"/><rect x="20" y="19" width="1" height="1"/><rect x="21" y="19" width="1" height="1"/><rect x="2" y="20" width="1" height="1"/><rect x="3" y="20" width="1" height="1"/><rect x="5" y="20" width="1" height="1"/><rect x="17" y="20" width="1" height="1"/><rect x="19" y="20" width="1" height="1"/><rect x="20" y="20" width="1" height="1"/><rect x="2" y="21" width="1" height="1"/><rect x="5" y="21" width="1" height="1"/><rect x="17" y="21" width="1" height="1"/><rect x="20" y="21" width="1" height="1"/><rect x="2" y="22" width="1" height="1"/><rect x="5" y="22" width="1" height="1"/><rect x="7" y="22" width="1" height="1"/><rect x="9" y="22" width="1" height="1"/><rect x="11" y="22" width="1" height="1"/><rect x="13" y="22" width="1" height="1"/><rect x="15" y="22" width="1" height="1"/><rect x="17" y="22" width="1" height="1"/><rect x="20" y="22" width="1" height="1"/><rect x="3" y="23" width="1" height="1"/><rect x="5" y="23" width="1" height="1"/><rect x="6" y="23" width="1" height="1"/><rect x="7" y="23" width="1" height="1"/><rect x="8" y="23" width="1" height="1"/><rect x="9" y="23" width="1" height="1"/><rect x="10" y="23" width="1" height="1"/><rect x="11" y="23" width="1" height="1"/><rect x="12" y="23" width="1" height="1"/><rect x="13" y="23" width="1" height="1"/><rect x="14" y="23" width="1" height="1"/><rect x="15" y="23" width="1" height="1"/><rect x="16" y="23" width="1" height="1"/><rect x="17" y="23" width="1" height="1"/><rect x="19" y="23" width="1" height="1"/><rect x="3" y="24" width="1" height="1"/><rect x="6" y="24" width="1" height="1"/><rect x="7" y="24" width="1" height="1"/><rect x="9" y="24" width="1" height="1"/><rect x="11" y="24" width="1" height="1"/><rect x="13" y="24" width="1" height="1"/><rect x="15" y="24" width="1" height="1"/><rect x="16" y="24" width="1" height="1"/><rect x="19" y="24" width="1" height="1"/><rect x="3" y="25" width="1" height="1"/><rect x="7" y="25" width="1" height="1"/><rect x="9" y="25" width="1" height="1"/><rect x="11" y="25" width="1" height="1"/><rect x="13" y="25" width="1" height="1"/><rect x="15" y="25" width="1" height="1"/><rect x="19" y="25" width="1" height="1"/><rect x="4" y="26" width="1" height="1"/><rect x="18" y="26" width="1" height="1"/><rect x="5" y="27" width="1" height="1"/><rect x="17" y="27" width="1" height="1"/><rect x="6" y="28" width="1" height="1"/><rect x="16" y="28" width="1" height="1"/><rect x="7" y="29" width="1" height="1"/><rect x="8" y="29" width="1" height="1"/><rect x="9" y="29" width="1" height="1"/><rect x="10" y="29" width="1" height="1"/><rect x="11" y="29" width="1" height="1"/><rect x="12" y="29" width="1" height="1"/><rect x="13" y="29" width="1" height="1"/><rect x="14" y="29" width="1" height="1"/><rect x="15" y="29" width="1" height="1"/></svg>`;

  const ANIMALS = {
    mouton:    { label: "Mouton",     color: "#f4ede0", tier: 0 },
    crocodile: { label: "Crocodile",  color: "#2f5233", tier: 1, emoji: "🐊", price: "0,99 €" },
    lion:      { label: "Lion",       color: "#d9a441", tier: 2, emoji: "🦁", price: "2,99 €" },
    licorne:   { label: "Licorne",    color: "#b98fd6", tier: 3, emoji: "🦄", price: "9,99 €" },
    rhino:     { label: "Rhinocéros", color: "#8a8f99", tier: 4, emoji: "🦏", price: "29,99 €" },
    dragon:    { label: "Dragon",     color: "#7a2e2e", tier: 5, emoji: "🐉", price: "49,99 €" },
    panda:     { label: "Panda",      color: "#2b2420", tier: 6, emoji: "🐼", price: "99,99 €" },
    trex:      { label: "T-Rex",      color: "#4f5b2f", tier: 7, emoji: "🦖", price: "199,99 €" },
  };
  const TIER_ORDER = ["mouton", "crocodile", "lion", "licorne", "rhino", "dragon", "panda", "trex"];
  const CUSTOM_SVG = { mouton: SHEEP_SVG, crocodile: CROCODILE_IMG };

  function iconMarkup(type) {
    return CUSTOM_SVG[type] ? CUSTOM_SVG[type] : `<span class="emoji">${ANIMALS[type].emoji}</span>`;
  }

  /* ---------------------------------------------------------------
   * Synchro Firebase (Firestore) — optionnelle.
   * -----------------------------------------------------------------
   * Tant que firebase-config.js n'a pas été renseigné avec un vrai
   * projet, l'appli reste en mode démo 100% local (aucune erreur,
   * juste pas d'échange réel entre deux appareils). Une fois configuré,
   * chaque paire de codes a son propre fil de messages, protégé par
   * une authentification anonyme (gratuite, sans carte bancaire).
   * ------------------------------------------------------------- */
  const FIREBASE_READY = !!(
    window.FIREBASE_CONFIG &&
    window.FIREBASE_CONFIG.apiKey !== "REMPLACE_MOI" &&
    typeof firebase !== "undefined" // le SDK a pu échouer à charger (bloqueur de pub, réseau...) : on ne plante pas l'appli pour autant
  );
  let db = null;
  let authReady = Promise.resolve(null);

  if (FIREBASE_READY) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    // App Check (anti-bot) : optionnel, actif seulement si une vraie clé
    // reCAPTCHA v3 a été renseignée dans firebase-config.js. Voir le
    // commentaire dans ce fichier pour comment l'obtenir.
    if (window.FIREBASE_CONFIG.appCheckSiteKey && window.FIREBASE_CONFIG.appCheckSiteKey !== "REMPLACE_MOI" && firebase.appCheck) {
      try {
        firebase.appCheck().activate(window.FIREBASE_CONFIG.appCheckSiteKey, true);
      } catch (e) {
        console.warn("App Check indisponible", e);
      }
    }
    db = firebase.firestore();
    authReady = firebase.auth().signInAnonymously()
      .then(() => true)
      .catch((e) => { console.error("Auth Firebase échouée", e); return false; });
  } else {
    console.warn("Crocosheep : Firebase non configuré — mode démo local uniquement, pas de synchro entre appareils.");
  }

  function pairId(codeA, codeB) {
    return [codeA, codeB].sort().join("__");
  }

  /* ---------------------------------------------------------------
   * Petits raccourcis Firestore — évitent de répéter
   * db.collection("x").doc(y) partout et centralisent les noms de
   * collection à un seul endroit.
   * ------------------------------------------------------------- */
  function threadRef(codeA, codeB) {
    return db.collection("pairs").doc(pairId(codeA, codeB)).collection("messages");
  }
  function profileRef(pseudo) {
    return db.collection("profiles").doc(pseudo);
  }
  function groupRef(groupId) {
    return db.collection("groups").doc(groupId);
  }

  // Emballe tout code qui a besoin d'être authentifié avant de toucher
  // Firestore : remplace le `authReady.then((ok) => { if (!ok) return; … })`
  // qui revenait à l'identique un peu partout dans ce fichier.
  function withAuth(fn) {
    authReady.then((ok) => { if (ok) fn(); });
  }

  /* ---------------------------------------------------------------
   * Profil partagé (Firestore profiles/{pseudo}) — stock, totaux et
   * paliers ne vivaient qu'en local jusqu'ici. Deux appareils avec la
   * même identité (via la clé de récupération) avaient donc chacun
   * leur propre inventaire, ce qui n'a pas de sens pour une seule
   * personne. Maintenant : affichage optimiste immédiat en local
   * comme avant, + synchro Firestore en arrière-plan avec des
   * increment() atomiques (pas des valeurs absolues) pour que deux
   * envois quasi simultanés sur deux appareils s'additionnent au lieu
   * de s'écraser l'un l'autre. Un onSnapshot permanent sur son propre
   * profil ramène ensuite tout appareil au même état.
   *
   * Fiabilité : contrairement à l'envoi d'un message (qui a un repli
   * local + toast si Firestore est injoignable), un increment() raté
   * ici était jusqu'ici perdu pour toujours — juste un console.warn,
   * jamais réessayé. Symptôme observé : un contact envoie bien son
   * animal (visible dans la discussion), mais son profil public reste
   * bloqué à 0 parce que ce deuxième écrit-là a échoué en silence.
   * Fix : chaque delta passe d'abord par une file locale persistée
   * (state.pendingStatsSync), et flushPendingStatsSync() réessaie tant
   * qu'elle n'est pas vide — au retour du réseau, à intervalle
   * régulier, et à chaque nouvel envoi.
   * ------------------------------------------------------------- */
  function syncStatsDelta(stockDelta, sentDelta, receivedDelta) {
    if (!FIREBASE_READY) return;
    const delta = {};
    Object.entries(stockDelta || {}).forEach(([k, v]) => { delta[`stock.${k}`] = v; });
    Object.entries(sentDelta || {}).forEach(([k, v]) => { delta[`sentTotals.${k}`] = v; });
    Object.entries(receivedDelta || {}).forEach(([k, v]) => { delta[`receivedTotals.${k}`] = v; });
    if (!Object.keys(delta).length) return;
    state.pendingStatsSync.push(delta);
    saveState();
    flushPendingStatsSync();
  }

  // Additionne toutes les entrées en attente en un seul objet — un increment
  // de +1 puis -1 sur le même champ s'annule avant même de partir sur le
  // réseau, et ça ne fait qu'une seule écriture Firestore quel que soit le
  // nombre de deltas accumulés pendant une coupure.
  function combineDeltas(list) {
    const combined = {};
    list.forEach((entry) => {
      Object.entries(entry).forEach(([field, v]) => { combined[field] = (combined[field] || 0) + v; });
    });
    return combined;
  }

  let statsSyncInFlight = false;
  function flushPendingStatsSync() {
    if (!FIREBASE_READY || statsSyncInFlight || !state.pendingStatsSync.length) return;
    statsSyncInFlight = true;
    const batch = state.pendingStatsSync.slice(); // photo de ce qu'on tente là — d'autres deltas peuvent s'ajouter pendant l'écriture
    authReady.then((ok) => {
      // Même logique que sendAnimal : un échec d'auth doit tomber dans le
      // même .catch() qu'un échec d'écriture, pour réessayer pareil aux deux.
      if (!ok) throw new Error("auth indisponible");
      const combined = combineDeltas(batch);
      const updates = {};
      Object.entries(combined).forEach(([field, v]) => { updates[field] = firebase.firestore.FieldValue.increment(v); });
      return profileRef(state.pseudo).set(updates, { merge: true });
    }).then(() => {
      state.pendingStatsSync.splice(0, batch.length); // ne retire que ce qui vient d'être confirmé, pas ce qui s'est ajouté entre-temps
      saveState();
    }).catch((e) => {
      console.warn("Synchro stats impossible, nouvelle tentative plus tard", e);
    }).finally(() => { statsSyncInFlight = false; });
  }

  // unlocked/nextThreshold sont un état, pas des compteurs — un simple
  // écrasement (dernier écrit gagne) suffit, les écritures concurrentes y
  // sont rares comparé aux envois.
  function syncUnlockState() {
    if (!FIREBASE_READY) return;
    withAuth(() => {
      profileRef(state.pseudo).set(
        { unlocked: state.unlocked, nextThreshold: state.nextThreshold },
        { merge: true }
      ).catch((e) => console.warn("Synchro paliers impossible", e));
    });
  }

  let unsubscribeOwnProfile = null;
  function subscribeOwnProfile() {
    if (!FIREBASE_READY || unsubscribeOwnProfile) return;
    withAuth(() => {
      unsubscribeOwnProfile = profileRef(state.pseudo).onSnapshot((snap) => {
        if (!snap.exists) return;
        const d = snap.data();
        if (d.stock) state.stock = { ...state.stock, ...d.stock };
        if (d.sentTotals) state.sentTotals = { ...state.sentTotals, ...d.sentTotals };
        if (d.receivedTotals) state.receivedTotals = { ...state.receivedTotals, ...d.receivedTotals };
        if (d.unlocked) state.unlocked = { ...state.unlocked, ...d.unlocked };
        if (d.nextThreshold) state.nextThreshold = { ...state.nextThreshold, ...d.nextThreshold };
        saveState();
        // Reflète le changement quel que soit l'écran affiché — un autre
        // appareil a pu mettre à jour le stock pendant qu'on est ailleurs.
        if (!screens.chat.classList.contains("screen-hidden")) renderDock();
        if (!screens.profile.classList.contains("screen-hidden")) renderProfile();
      }, (e) => console.warn("Profil personnel indisponible", e));
    });
  }

  // Paramètre caché supplémentaire : plus le fuseau horaire d'un contact
  // est loin du tien (>6h d'écart), plus le prochain seuil est facile à
  // atteindre en lui envoyant des animaux — pensé pour les couples/amis à
  // distance, cas d'usage n°1 du projet. Ton propre décalage est écrit une
  // fois au démarrage ; celui d'un contact est allé chercher à l'ouverture
  // de sa discussion et mis en cache sur l'objet contact pour la session.
  function publishOwnTimezone() {
    if (!FIREBASE_READY) return;
    withAuth(() => {
      profileRef(state.pseudo).set(
        { tzOffset: new Date().getTimezoneOffset() },
        { merge: true }
      ).catch((e) => console.warn("Publication fuseau horaire impossible", e));
    });
  }

  function fetchContactTimezone(contact) {
    if (!FIREBASE_READY || contact.bot || typeof contact.tzOffset === "number") return;
    withAuth(() => {
      profileRef(contact.code).get()
        .then((snap) => {
          if (snap.exists && typeof snap.data().tzOffset === "number") contact.tzOffset = snap.data().tzOffset;
        })
        .catch((e) => console.warn("Fuseau horaire indisponible pour", contact.code, e));
    });
  }

  function timezoneGapBonus(contact) {
    if (!contact || typeof contact.tzOffset !== "number") return 0;
    const gapHours = Math.abs(new Date().getTimezoneOffset() - contact.tzOffset) / 60;
    return gapHours > 6 ? 1 : 0;
  }

  // Compteur "reçu" — jamais suivi jusqu'ici. Repose sur les deux
  // écouteurs de messages entrants déjà en place (aperçu contacts + fil
  // ouvert) ; limite connue : la toute première synchro d'un appareil tout
  // neuf sur une identité déjà active peut recompter un historique déjà
  // ancien une fois, faute d'un vrai curseur côté serveur.
  function trackReceived(animal) {
    state.receivedTotals[animal] = (state.receivedTotals[animal] || 0) + 1;
    saveState();
    syncStatsDelta(null, null, { [animal]: 1 });
  }

  /* ---------------------------------------------------------------
   * Horloge serveur — pour que les paramètres cachés basés sur l'heure
   * (voir randomThreshold) ne se laissent pas manipuler en changeant
   * l'heure du téléphone. Un seul aller-retour au démarrage suffit :
   * on mesure l'écart entre l'horloge de Firestore et celle de
   * l'appareil, et on l'applique ensuite à tous les calculs de now().
   * Sans Firebase (mode démo), il n'y a rien à protéger : on retombe
   * simplement sur l'horloge locale.
   * ------------------------------------------------------------- */
  let serverTimeOffset = 0;
  function now() { return Date.now() + serverTimeOffset; }

  if (FIREBASE_READY) {
    withAuth(() => {
      const ref = db.collection("_clock").doc(state.pseudo);
      ref.set({ t: firebase.firestore.FieldValue.serverTimestamp() })
        .then(() => ref.get({ source: "server" }))
        .then((snap) => {
          const t = snap.data() && snap.data().t;
          if (t) serverTimeOffset = t.toMillis() - Date.now();
        })
        .catch((e) => console.warn("Calibration horloge serveur impossible, repli sur l'horloge locale", e));
    });
  }

  /* ---------------------------------------------------------------
   * Anti-clic-robot — un script qui spamme le mouton clique soit plus
   * vite qu'un doigt humain ne peut répéter, soit à des intervalles
   * quasi identiques à la milliseconde près (un humain a toujours du
   * "jitter" naturel). On ignore silencieusement les deux cas — pas
   * de message d'erreur qui renseignerait qui triche.
   * ------------------------------------------------------------- */
  let lastClickAt = 0;
  let recentIntervals = [];
  function looksAutomated(ts) {
    if (lastClickAt) {
      const interval = ts - lastClickAt;
      if (interval < 80) { lastClickAt = ts; return true; }
      recentIntervals.push(interval);
      if (recentIntervals.length > 8) recentIntervals.shift();
      if (recentIntervals.length >= 5) {
        const avg = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
        const variance = recentIntervals.reduce((a, b) => a + (b - avg) ** 2, 0) / recentIntervals.length;
        if (Math.sqrt(variance) < 4) { lastClickAt = ts; return true; }
      }
    }
    lastClickAt = ts;
    return false;
  }

  /* ---------------------------------------------------------------
   * État — tout en local pour cette maquette (pas de backend).
   * Le seuil de déblocage du crocodile est tiré au hasard à chaque
   * fois dans une petite plage, pour illustrer le principe de ratio
   * variable sans obliger quiconque à cliquer 2000 fois pour tester.
   * ------------------------------------------------------------- */
  // Amorce de l'algorithme caché "multi-paramètres" évoqué dans le brief :
  // une base aléatoire, + des facteurs discrets liés au moment de l'envoi
  // (heure, parité de la seconde) — invisibles pour qui utilise l'appli,
  // dans l'esprit "chasse au trésor" plutôt qu'un simple tirage uniforme.
  function randomThreshold(bonus = 0) {
    const d = new Date(now()); // horloge calée sur le serveur, pas sur l'appareil — voir plus haut
    let t = 9 + Math.floor(Math.random() * 3); // base : 9, 10 ou 11
    if (d.getHours() >= 7 && d.getHours() < 12) t += 1; // matinée (7h-12h)
    if (d.getSeconds() % 2 === 1) t -= 1; // seconde impaire au moment du tirage
    t -= bonus; // ex. écart de fuseau horaire avec le contact — voir timezoneGapBonus
    return Math.max(1, t);
  }

  function isPrime(n) {
    if (n < 2) return false;
    if (n % 2 === 0) return n === 2;
    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  // Encore un paramètre caché : si le nombre total de moutons envoyés dans
  // ta vie est premier pile au moment du tirage, léger coup de pouce. Se
  // combine avec les autres facteurs — personne ne devrait le repérer sans
  // comparer des notes avec quelqu'un d'autre.
  function primeMoutonBonus() {
    return isPrime(state.sentTotals.mouton) ? 1 : 0;
  }

  function randomCode() {
    const n = 100 + Math.floor(Math.random() * 900);
    const l = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${l}-${n}`;
  }

  // Clé plus longue, distincte du code public : le code (ex. "W-867") est
  // fait pour être partagé (lien de contact) et ne doit JAMAIS suffire, à
  // lui seul, à usurper une identité. Cette clé sert uniquement à prouver
  // que c'est bien toi qui restaures ton identité sur un autre appareil —
  // elle n'est jamais incluse dans le lien de partage.
  function randomRecoveryKey() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // sans caractères ambigus (0/o, 1/l/i)
    let key = "";
    for (let i = 0; i < 10; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
  }

  // Contact permanent, purement local (pas de synchro Firestore) : sert à
  // se faire une idée de l'appli tout seul, ou à la montrer à quelqu'un
  // sans attendre qu'il ait installé quoi que ce soit.
  function botContact() {
    return { id: "bot", code: "🤖 Bot", color: "#4f7a58", bot: true, history: [] };
  }

  // Plus de faux contacts de démo (R-482/K-071/T-955) — un vrai nouvel
  // utilisateur ne doit jamais tomber sur des conversations fantômes.
  // Seul le bot (clairement identifié comme tel) reste pré-présent.
  function seedContacts() {
    return [botContact()];
  }

  const UNLOCKABLE_TIERS = TIER_ORDER.slice(1); // tout sauf mouton, gratuit dès le départ

  // Générés depuis TIER_ORDER plutôt qu'écrits en dur — ajouter un animal
  // dans TIER_ORDER/ANIMALS suffit alors, pas besoin de retoucher tous les
  // objets d'état un par un (c'est justement l'oubli qui a cassé le stock
  // au dernier ajout).
  function zeroPerTier() {
    const o = {};
    TIER_ORDER.forEach((t) => { o[t] = 0; });
    return o;
  }
  function zeroStock() {
    const o = {};
    UNLOCKABLE_TIERS.forEach((t) => { o[t] = 0; });
    return o;
  }

  function freshState() {
    const nextThreshold = {};
    const unlocked = {};
    UNLOCKABLE_TIERS.forEach((t) => { nextThreshold[t] = randomThreshold(); unlocked[t] = false; });
    return {
      pseudo: randomCode(),
      recoveryKey: randomRecoveryKey(),
      since: Date.now(),
      stock: zeroStock(),
      sentTotals: zeroPerTier(),
      receivedTotals: zeroPerTier(),
      unlocked,
      nextThreshold,
      contacts: seedContacts(),
      pendingStatsSync: [], // deltas stock/sentTotals/receivedTotals pas encore confirmés par Firestore — voir flushPendingStatsSync()
    };
  }

  // Convertit l'ancien format (un seul palier crocodile codé en dur) vers le
  // format générique actuel, pour ne pas faire perdre leur progression aux
  // personnes déjà en train de tester.
  function migrateState(s) {
    if (!s.unlocked) {
      s.unlocked = { crocodile: !!s.crocodileUnlocked };
      s.nextThreshold = { crocodile: s.nextCrocodileThreshold || (s.sentTotals?.mouton || 0) + randomThreshold() };
      delete s.crocodileUnlocked;
      delete s.nextCrocodileThreshold;
    }
    UNLOCKABLE_TIERS.forEach((t) => {
      if (!(t in s.unlocked)) s.unlocked[t] = false;
      if (!(t in s.nextThreshold)) s.nextThreshold[t] = randomThreshold();
    });
    s.stock = { ...zeroStock(), ...s.stock };
    s.sentTotals = { ...zeroPerTier(), ...s.sentTotals };
    s.receivedTotals = { ...zeroPerTier(), ...s.receivedTotals };
    if (!Array.isArray(s.pendingStatsSync)) s.pendingStatsSync = []; // comptes déjà en test avant l'ajout de la file de réessai
    if (!s.recoveryKey) s.recoveryKey = randomRecoveryKey(); // comptes déjà en test avant l'ajout de cette clé
    if (!s.contacts.some((c) => c.id === "bot")) s.contacts.unshift(botContact()); // comptes déjà en test avant l'ajout du bot
    // Retrait rétroactif des faux contacts de démo (id "c1"/"c2"/"c3",
    // seedés par défaut jusqu'ici) — pour tout le monde, y compris les
    // appareils déjà en cours d'utilisation, pas juste les nouveaux.
    // Ces id ne sont générés QUE par l'ancien seedContacts(), jamais par
    // addContactByCode() (qui prend le code lui-même comme id) : aucun
    // risque de supprimer un vrai contact au passage.
    s.contacts = s.contacts.filter((c) => !["c1", "c2", "c3"].includes(c.id));
    return s;
  }

  function loadState() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* stockage indisponible */ }
    if (raw) {
      try { return migrateState(JSON.parse(raw)); } catch (e) { /* état corrompu, on repart à zéro */ }
    }
    return freshState();
  }

  let state = loadState();
  saveState(); // fige le pseudo dès la première visite : sans ça, un partage de lien
               // avant toute action se ferait perdre au prochain rechargement.

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* tant pis pour cette session */ }
  }

  const CONTACT_COLORS = ["#5c8a53", "#b98fd6", "#d9a441", "#4f7a58", "#c1573f", "#8a8f99"];
  function colorForCode(code) {
    let hash = 0;
    for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
    return CONTACT_COLORS[hash % CONTACT_COLORS.length];
  }

  /* ---------------------------------------------------------------
   * Ajout d'un contact par lien partagé (?add=CODE)
   * ------------------------------------------------------------- */
  function addContactByCode(code) {
    if (!code || code === state.pseudo) return null;
    let c = state.contacts.find((x) => x.code === code);
    if (c) return c;
    c = { id: code, code, color: colorForCode(code), history: [] };
    state.contacts.push(c);
    saveState();
    return c;
  }

  function handleIncomingLink() {
    const params = new URLSearchParams(location.search);
    const code = params.get("add");
    if (!code) return;
    const added = addContactByCode(code);
    // On nettoie l'URL pour ne pas se retrouver à ré-ajouter en boucle
    // au moindre partage/rafraîchissement.
    history.replaceState(null, "", location.pathname);
    if (added) showToast(`${code} ajouté à tes contacts`);
  }

  /* ---------------------------------------------------------------
   * Navigation entre écrans
   * ------------------------------------------------------------- */
  const screens = {
    contacts: document.getElementById("screen-contacts"),
    chat: document.getElementById("screen-chat"),
    profile: document.getElementById("screen-profile"),
    group: document.getElementById("screen-group"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.add("screen-hidden"));
    screens[name].classList.remove("screen-hidden");
  }

  let activeContactId = null;
  let unsubscribeChat = null;

  function stopChatSubscription() {
    if (unsubscribeChat) {
      unsubscribeChat();
      unsubscribeChat = null;
    }
  }

  /* ---------------------------------------------------------------
   * Écran contacts
   * ------------------------------------------------------------- */
  function timeAgo(ts) {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `il y a ${hours} h`;
    return `il y a ${Math.round(hours / 24)} j`;
  }

  // Heure exacte (HH:MM:SS) pour les bulles de discussion — utile pour
  // suivre l'ordre précis d'un échange rapide, contrairement à "à l'instant"
  // qui ne distingue rien entre plusieurs envois rapprochés.
  function exactTime(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // Vue "tableau de bord" : un listener temps réel par contact (juste le
  // dernier message, limit(1)) pour que la liste se mette à jour toute
  // seule sans qu'il faille rouvrir chaque discussion. Coupé dès qu'on
  // quitte l'écran contacts pour ne pas laisser tourner des listeners
  // inutiles en arrière-plan.
  let unsubscribeContactPreviews = [];

  function stopContactPreviews() {
    unsubscribeContactPreviews.forEach((fn) => fn());
    unsubscribeContactPreviews = [];
    stopGroupLists();
  }

  function subscribeContactPreviews() {
    stopContactPreviews();
    renderContacts(); // affichage immédiat depuis le cache local, pas d'écran vide en attendant le réseau
    subscribeGroupLists();
    if (!FIREBASE_READY) return;
    withAuth(() => {
      state.contacts.filter((c) => !c.bot).forEach((c) => {
        const unsub = threadRef(state.pseudo, c.code)
          .orderBy("ts", "desc").limit(1)
          .onSnapshot((snap) => {
            if (snap.empty) return;
            const m = snap.docs[0].data();
            if (!m.ts) return; // écriture pas encore confirmée par le serveur
            const last = { dir: m.from === state.pseudo ? "out" : "in", animal: m.animal, ts: m.clientTs != null ? m.clientTs : m.ts.toMillis() };
            const cached = c.history[c.history.length - 1];
            if (!cached || cached.ts < last.ts) {
              c.history.push(last);
              saveState();
              if (last.dir === "in") {
                trackReceived(last.animal);
                notify("Crocosheep", `${c.code} t'a envoyé un animal 🐑`);
              }
              renderContacts();
            }
          }, (err) => console.warn("Aperçu temps réel indisponible pour", c.code, err));
        unsubscribeContactPreviews.push(unsub);
      });
    });
  }

  function renderContacts() {
    const list = document.getElementById("contacts-list");
    list.innerHTML = "";

    myInvites.forEach((g) => {
      const row = document.createElement("div");
      row.className = "contact-item group-row";
      row.innerHTML = `
        <p class="contact-code"><span class="invite-tag">Invitation</span> ${g.label || g.id}</p>
        <span class="invite-actions">
          <button class="invite-btn invite-accept" data-action="accept">Accepter</button>
          <button class="invite-btn invite-decline" data-action="decline">Ignorer</button>
        </span>`;
      row.querySelector('[data-action="accept"]').addEventListener("click", (e) => { e.stopPropagation(); acceptInvite(g.id); });
      row.querySelector('[data-action="decline"]').addEventListener("click", (e) => { e.stopPropagation(); declineInvite(g.id); });
      list.appendChild(row);
    });

    myGroups.forEach((g) => {
      const btn = document.createElement("button");
      btn.className = "contact-item group-row";
      const memberCount = (g.members || []).length;
      btn.innerHTML = `
        <p class="contact-code"><span class="group-tag">👥 Groupe</span> ${g.label || g.id}</p>
        <span class="contact-preview"><span>${memberCount} membre${memberCount > 1 ? "s" : ""}</span></span>`;
      wireSwipeRow(list, btn, () => openGroup(g.id), () => leaveGroup(g.id), `Quitter le groupe ${g.label || g.id}`);
    });

    state.contacts.forEach((c) => {
      const last = c.history[c.history.length - 1];
      const btn = document.createElement("button");
      btn.className = "contact-item";
      btn.innerHTML = `
        <p class="contact-code">${c.nickname || c.code}${c.nickname ? `<span class="contact-code-sub"> · ${c.code}</span>` : ""}</p>
        <span class="contact-preview">
          ${last
            ? `<span class="contact-preview-icon">${iconMarkup(last.animal)}</span><span>${exactTime(last.ts)}</span>`
            : "<span>Aucun échange pour l'instant</span>"}
        </span>`;

      if (c.bot) {
        // Le bot de démo reste toujours disponible, pas de suppression possible.
        btn.addEventListener("click", () => openChat(c.id));
        list.appendChild(btn);
        return;
      }

      wireSwipeRow(list, btn, () => openChat(c.id), () => deleteContact(c.id), `Supprimer la conversation avec ${c.code}`);
    });

    // Premier lancement (aucun vrai contact, aucun groupe, aucune
    // invitation) : un vrai écran de bienvenue plutôt qu'une liste
    // silencieuse à côté de deux boutons — traité comme un vrai moment
    // d'accueil, pas un cul-de-sac (recherche UX : les empty states de
    // premier lancement doivent guider vers l'action suivante).
    if (!state.contacts.some((c) => !c.bot) && !myGroups.length && !myInvites.length) {
      const hint = document.createElement("div");
      hint.className = "empty-contacts-hint";
      hint.innerHTML = `
        <p class="empty-contacts-title">Bienvenue sur Crocosheep 🐑</p>
        <p class="empty-contacts-body">Ajoute ton premier contact avec son code, ou partage ton lien, pour commencer à échanger des animaux.</p>`;
      list.appendChild(hint);
    }

    const addContactBtn = document.createElement("button");
    addContactBtn.className = "create-group-btn";
    addContactBtn.textContent = "+ Ajouter un contact (avec son code)";
    addContactBtn.addEventListener("click", () => {
      const input = prompt("Code de la personne à ajouter (ex. W-867) :");
      if (!input) return;
      const code = input.trim().toUpperCase();
      const added = addContactByCode(code);
      if (added) { showToast(`${code} ajouté à tes contacts`); renderContacts(); }
      else if (code === state.pseudo) showToast("C'est ton propre code !");
    });
    list.appendChild(addContactBtn);

    const createGroupBtn = document.createElement("button");
    createGroupBtn.className = "create-group-btn";
    createGroupBtn.textContent = "+ Créer un groupe";
    createGroupBtn.addEventListener("click", createGroup);
    list.appendChild(createGroupBtn);
  }

  /* ---------------------------------------------------------------
   * Suppression par balayage — conversations ET groupes.
   * Contact : supprime seulement de ta liste (le fil pairs/{pairId} et
   * donc l'historique restent intacts côté Firestore) : l'autre personne
   * garde sa conversation avec toi intacte, comme sur la plupart des
   * apps de messagerie. Si elle t'écrit à nouveau ou que tu la rajoutes
   * plus tard, l'historique complet réapparaît — cohérent avec le
   * fonctionnement déjà en place (voir la discussion sur B-687 : le fil
   * existe indépendamment de la liste de contacts locale).
   * Groupe : "supprimer" = quitter le groupe (retire ton pseudo de
   * members) — la liste de groupes est une requête live sur ce champ,
   * donc un simple retrait local n'aurait tenu qu'jusqu'au prochain
   * snapshot.
   *
   * Implémentation en vrais Touch Events (pas Pointer Events) : sur iOS
   * Safari, un balayage réel part rarement parfaitement à l'horizontale,
   * et le navigateur peut annuler le suivi des pointer events avant que
   * le code n'ait eu le temps de trancher "c'est un geste horizontal" —
   * symptôme observé : rien ne se révèle, juste l'effet :active qui
   * assombrit le bouton. Les Touch Events + preventDefault() explicite
   * une fois la direction tranchée donnent un contrôle total du geste.
   * La souris (desktop / tests) reste gérée en parallèle via Pointer
   * Events, sans ce risque de conflit avec un scroll natif.
   * ------------------------------------------------------------- */
  const SWIPE_REVEAL = 84; // doit correspondre à la largeur de .contact-delete-btn en CSS
  let openSwipeRow = null;
  let justSwiped = false; // un seul balayage à la fois possible, pas besoin d'un flag par ligne

  function closeSwipeRow(row) {
    if (!row) return;
    const item = row.querySelector(".contact-item");
    if (item) item.style.transform = "translateX(0)";
    row.dataset.swiped = "closed";
    if (openSwipeRow === row) openSwipeRow = null;
  }

  function wireSwipeToDelete(row, itemBtn) {
    let startX = null, startY = null, dragging = false, lockedHorizontal = false, currentX = 0;

    function begin(x, y) {
      startX = x; startY = y;
      dragging = true;
      lockedHorizontal = false;
      itemBtn.style.transition = "none";
    }

    function move(x, y, sourceEvent) {
      if (!dragging || startX == null) return;
      const dx = x - startX;
      const dy = y - startY;
      if (!lockedHorizontal) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; // pas encore assez de mouvement pour trancher
        if (Math.abs(dy) > Math.abs(dx)) { dragging = false; return; } // c'est un scroll vertical, on laisse faire
        lockedHorizontal = true;
      }
      if (sourceEvent && sourceEvent.cancelable) sourceEvent.preventDefault(); // on a pris la main sur le geste horizontal
      const base = row.dataset.swiped === "open" ? -SWIPE_REVEAL : 0;
      // currentX suit la position en JS plutôt que de la relire via
      // getComputedStyle() à la fin du geste : plus fiable — la lecture du
      // style calculé juste après une rafale de mutations synchrones peut
      // renvoyer une valeur pas encore à jour selon le navigateur.
      currentX = Math.min(0, Math.max(-SWIPE_REVEAL, base + dx));
      itemBtn.style.transform = `translateX(${currentX}px)`;
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      itemBtn.style.transition = "";
      if (!lockedHorizontal) return;
      justSwiped = true; // le click qui suit ce relâchement ne doit pas ouvrir la discussion
      if (currentX < -SWIPE_REVEAL / 2) {
        if (openSwipeRow && openSwipeRow !== row) closeSwipeRow(openSwipeRow);
        itemBtn.style.transform = `translateX(-${SWIPE_REVEAL}px)`;
        row.dataset.swiped = "open";
        openSwipeRow = row;
      } else {
        closeSwipeRow(row);
      }
    }

    // Doigt (chemin principal, mobile) — preventDefault() nécessite un
    // listener non-passif pour pouvoir désactiver le scroll natif.
    itemBtn.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      if (t) begin(t.clientX, t.clientY);
    }, { passive: true });
    itemBtn.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY, e);
    }, { passive: false });
    itemBtn.addEventListener("touchend", endDrag, { passive: true });
    itemBtn.addEventListener("touchcancel", endDrag, { passive: true });

    // Souris (desktop / tests) — pas de scroll natif à négocier ici.
    itemBtn.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      begin(e.clientX, e.clientY);
    });
    itemBtn.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") move(e.clientX, e.clientY, null);
    });
    itemBtn.addEventListener("pointerup", (e) => { if (e.pointerType === "mouse") endDrag(); });
    itemBtn.addEventListener("pointercancel", (e) => { if (e.pointerType === "mouse") endDrag(); });
  }

  // Toucher n'importe où ailleurs referme la ligne ouverte — évite de
  // laisser le bouton supprimer exposé après avoir changé d'avis.
  document.addEventListener("pointerdown", (e) => {
    if (openSwipeRow && !openSwipeRow.contains(e.target)) closeSwipeRow(openSwipeRow);
  });
  document.addEventListener("touchstart", (e) => {
    if (openSwipeRow && !openSwipeRow.contains(e.target)) closeSwipeRow(openSwipeRow);
  }, { passive: true });

  // Construit une ligne balayable (contact ou groupe) : itemBtn glisse
  // par-dessus un bouton 💀 révélé en dessous. onOpen s'exécute au tap
  // normal, onDelete au tap sur 💀 (supprime/quitte selon le contexte).
  function wireSwipeRow(list, itemBtn, onOpen, onDelete, deleteAriaLabel) {
    const row = document.createElement("div");
    row.className = "contact-row";
    row.dataset.swiped = "closed";

    const delBtn = document.createElement("button");
    delBtn.className = "contact-delete-btn";
    delBtn.innerHTML = SKULL_SVG;
    delBtn.setAttribute("aria-label", deleteAriaLabel);
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onDelete();
    });

    itemBtn.addEventListener("click", () => {
      if (justSwiped) { justSwiped = false; return; }
      if (row.dataset.swiped === "open") { closeSwipeRow(row); return; }
      onOpen();
    });

    row.appendChild(delBtn);
    row.appendChild(itemBtn);
    wireSwipeToDelete(row, itemBtn);
    list.appendChild(row);
  }

  function deleteContact(id) {
    const c = state.contacts.find((x) => x.id === id);
    state.contacts = state.contacts.filter((x) => x.id !== id);
    saveState();
    stopContactPreviews();
    subscribeContactPreviews(); // réabonne sur la liste réduite et réaffiche
    if (c) showToast(`Conversation avec ${c.code} supprimée chez toi — encore visible pour ton contact, l'historique revient si tu le rajoutes`);
  }

  // Pseudo local sur un contact — purement pour toi : jamais envoyé à
  // Firestore, jamais vu par l'autre personne. Remplace l'affichage du
  // code dans la liste de contacts et l'en-tête de discussion ; le code
  // réel reste utilisé partout où il compte (Firestore, profil public)
  // et reste consultable (sous le pseudo dans la liste, et le profil
  // public l'affiche toujours dans son titre entre parenthèses).
  function renameContact(code) {
    const c = state.contacts.find((x) => x.code === code);
    if (!c) return;
    const input = prompt(`Comment veux-tu appeler ${code} ? (laisse vide pour revenir au code)`, c.nickname || "");
    if (input === null) return; // annulé
    const nickname = input.trim();
    c.nickname = nickname || null;
    saveState();
    renderContacts();
    if (activeContactId === c.id) {
      const chatCodeEl = document.getElementById("chat-code");
      chatCodeEl.textContent = c.nickname || c.code;
    }
    document.getElementById("public-profile-title").textContent = `Profil de ${c.nickname || c.code}`;
    showToast(c.nickname ? `Renommé en "${c.nickname}" (juste chez toi)` : `Retour au code ${c.code}`);
  }

  function leaveGroup(groupId) {
    const g = myGroups.find((x) => x.id === groupId);
    withAuth(() => {
      groupRef(groupId).update({
        members: firebase.firestore.FieldValue.arrayRemove(state.pseudo),
      }).then(() => showToast(`Groupe ${g ? (g.label || g.id) : ""} quitté`))
        .catch((e) => { console.error(e); showToast("Impossible de quitter le groupe"); });
    });
  }

  /* ---------------------------------------------------------------
   * Écran discussion
   * ------------------------------------------------------------- */
  // Profil public d'un contact : envoyé / reçu / possédé, visible par
  // n'importe qui (décision de Pierre — pas de garantie de confidentialité
  // ici, l'effet vitrine prime). Lecture ponctuelle, pas de listener
  // permanent — c'est une consultation, pas un fil qu'on regarde en continu.
  let unsubscribePublicProfile = null;
  let currentPublicProfileCode = null; // pour que le bouton "Renommer" sache sur quel contact agir
  function openPublicProfile(code) {
    if (code === "🤖 Bot") return; // le bot n'a pas de profil Firestore, rien à montrer
    currentPublicProfileCode = code;
    const contact = state.contacts.find((x) => x.code === code);
    document.getElementById("public-profile-title").textContent = `Profil de ${(contact && contact.nickname) || code}`;
    const grid = document.getElementById("public-profile-grid");
    grid.innerHTML = `<p class="group-waiting">Chargement…</p>`;
    document.getElementById("public-profile-overlay").classList.remove("screen-hidden");

    if (!FIREBASE_READY) {
      grid.innerHTML = `<p class="group-waiting">Synchro non activée — profils publics indisponibles en mode démo local.</p>`;
      return;
    }
    withAuth(() => {
      if (unsubscribePublicProfile) unsubscribePublicProfile();
      unsubscribePublicProfile = profileRef(code).onSnapshot((snap) => {
        if (!snap.exists) {
          grid.innerHTML = `<p class="group-waiting">Rien à montrer pour l'instant — ${code} n'a encore rien envoyé ni reçu.</p>`;
          return;
        }
        const d = snap.data();
        grid.innerHTML = TIER_ORDER.map((type) => {
          const sent = (d.sentTotals && d.sentTotals[type]) || 0;
          const received = (d.receivedTotals && d.receivedTotals[type]) || 0;
          const owned = type === "mouton" ? "∞" : ((d.stock && d.stock[type]) || 0);
          return `
            <div class="pp-card">
              <span class="pp-icon">${iconMarkup(type)}</span>
              <p class="pp-name">${ANIMALS[type].label}</p>
              <div class="pp-stats">
                <span><b>${sent}</b>envoyé</span>
                <span><b>${received}</b>reçu</span>
                <span><b>${owned}</b>en stock</span>
              </div>
            </div>`;
        }).join("");
      }, (e) => {
        console.warn("Profil public indisponible pour", code, e);
        grid.innerHTML = `<p class="group-waiting">Profil indisponible pour l'instant.</p>`;
      });
    });
  }

  function openChat(contactId) {
    stopChatSubscription();
    stopContactPreviews();
    stopGroupScreen();
    activeContactId = contactId;
    const c = state.contacts.find((x) => x.id === contactId);
    const chatCodeEl = document.getElementById("chat-code");
    chatCodeEl.textContent = c.nickname || c.code;
    chatCodeEl.dataset.code = c.code; // le pseudo local peut remplacer l'affichage, mais le vrai code reste nécessaire pour le profil public/Firestore
    renderChatBubbles(); // affichage immédiat depuis le cache local, pas d'écran vide en attendant le réseau
    renderDock();
    showScreen("chat");
    if (!c.bot) {
      subscribeToThread(c); // le bot est purement local, rien à écouter côté serveur
      fetchContactTimezone(c);
    }
  }

  function subscribeToThread(contact) {
    if (!FIREBASE_READY) return;
    withAuth(() => {
      // L'utilisateur a pu changer d'écran pendant l'authentification
      if (activeContactId !== contact.id) return;
      unsubscribeChat = threadRef(state.pseudo, contact.code)
        .orderBy("ts", "asc")
        .onSnapshot((snap) => {
          const watermark = contact.history.reduce((max, m) => Math.max(max, m.ts || 0), 0);
          const fresh = snap.docs
            .filter((d) => d.data().ts) // ignore les écritures locales pas encore confirmées, pour éviter les doublons
            .map((d) => {
              const m = d.data();
              // clientTs (l'horloge calée serveur au moment du clic, voir sendAnimal) est
              // affiché de préférence à m.ts.toMillis() : le serverTimestamp() de Firestore
              // n'est figé qu'à la confirmation d'écriture, quelques centaines de ms à
              // plus d'une seconde après le clic — assez pour afficher "+1 seconde" par
              // rapport à l'heure réelle d'envoi. ts (Firestore) reste la source de tri
              // et de déduplication, inchangée, pour ne rien casser sur les messages déjà
              // en base sans clientTs.
              return { dir: m.from === state.pseudo ? "out" : "in", animal: m.animal, ts: m.clientTs != null ? m.clientTs : m.ts.toMillis() };
            });
          fresh.filter((m) => m.dir === "in" && m.ts > watermark).forEach((m) => trackReceived(m.animal));
          contact.history = fresh;
          saveState();
          if (activeContactId === contact.id) renderChatBubbles();
        }, (err) => {
          console.error("Synchro Crocosheep interrompue", err);
          showToast("Connexion perdue — les messages restent en attente");
        });
    });
  }

  // Anime seulement la ou les bulles qui viennent réellement d'apparaître
  // depuis le dernier rendu de CE contact — pas tout l'historique à
  // chaque fois. C'est précisément ce qui avait été retiré plus tôt
  // (l'animation rejouait sur tout l'existant à chaque envoi/réception,
  // faute de ce genre de suivi) ; corrigé ici en gardant en mémoire
  // combien de bulles étaient déjà là au dernier rendu de ce contact.
  let lastBubbleContactId = null;
  let lastBubbleCount = 0;
  function renderChatBubbles() {
    const c = state.contacts.find((x) => x.id === activeContactId);
    const wrap = document.getElementById("chat-bubbles");
    wrap.innerHTML = "";
    if (!c.history.length) {
      wrap.innerHTML = `<p class="chat-empty">Aucun animal échangé pour l'instant. Envoie le premier mouton 🐑</p>`;
      lastBubbleContactId = activeContactId;
      lastBubbleCount = 0;
      return;
    }
    // À l'ouverture d'un contact, previousCount = tout l'historique : rien
    // ne doit sembler "nouveau" juste parce qu'on regarde la discussion.
    const previousCount = lastBubbleContactId === activeContactId ? lastBubbleCount : c.history.length;
    c.history.forEach((m, i) => {
      const line = document.createElement("div");
      const isNew = i >= previousCount;
      line.className = `bubble-line ${m.dir === "out" ? "out" : "in"}${isNew ? " bubble-pop" : ""}`;
      line.innerHTML = `
        <span class="bubble-icon">${iconMarkup(m.animal)}</span>
        <span class="bubble-time">${exactTime(m.ts)}</span>`;
      wrap.appendChild(line);
    });
    lastBubbleContactId = activeContactId;
    lastBubbleCount = c.history.length;
    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    const wrap = document.getElementById("chat-bubbles");
    // Deux passes : une tout de suite, une après le prochain repaint —
    // sur iOS Safari la hauteur réelle n'est pas toujours à jour au
    // moment même où le DOM change (barres qui montrent/cachent, etc.)
    wrap.scrollTop = wrap.scrollHeight;
    requestAnimationFrame(() => {
      wrap.scrollTop = wrap.scrollHeight;
    });
  }

  // Le mouton occupe seul toute la largeur au départ. À chaque déblocage,
  // cette même zone se redivise en bandes horizontales égales — une par
  // animal débloqué, mouton toujours en haut — plutôt que d'ajouter des
  // boutons à côté. Les animaux pas encore débloqués n'apparaissent nulle
  // part ici (pas de cadenas, pas de placeholder).
  // Même principe que pour les bulles : seule une bande qui vient de
  // faire son apparition (pas déjà présente au rendu précédent) reçoit
  // l'animation d'entrée — celles déjà là ne rejouent rien à chaque envoi.
  let lastActiveDockTypes = [];
  function renderDock() {
    const stack = document.getElementById("send-stack");
    stack.innerHTML = "";

    // Une fois le stock d'un animal retombé à zéro, son bouton disparaît
    // aussi (pas de bouton mort qui ne fait qu'afficher une erreur) —
    // il revient tout seul dès qu'un nouveau stock est regagné.
    const active = TIER_ORDER.filter((t) => t === "mouton" || (state.unlocked[t] && state.stock[t] > 0));
    active.forEach((type) => {
      const isNew = !lastActiveDockTypes.includes(type);
      const band = document.createElement("button");
      band.className = `send-band${isNew ? " band-pop" : ""}`;
      band.setAttribute("aria-label", `Envoyer un ${ANIMALS[type].label.toLowerCase()}`);
      band.style.background = type === "mouton" ? "var(--sheep-band-bg)" : `${ANIMALS[type].color}55`;
      band.innerHTML = `
        <span class="send-band-icon">${iconMarkup(type)}</span>
        ${type !== "mouton" ? `<span class="stock-pill">${state.stock[type]}</span>` : ""}`;
      band.addEventListener("click", () => sendAnimal(type));
      stack.appendChild(band);
    });
    lastActiveDockTypes = active;
  }

  /* ---------------------------------------------------------------
   * Envoi d'un animal
   * ------------------------------------------------------------- */
  function sendAnimal(type) {
    if (looksAutomated(Date.now())) return; // clic ignoré sans un mot — voir looksAutomated()

    if (type !== "mouton") {
      if ((state.stock[type] || 0) <= 0) return; // le bouton est déjà censé avoir disparu à ce stade
      state.stock[type] -= 1;
    }

    const c = state.contacts.find((x) => x.id === activeContactId);

    state.sentTotals[type] += 1;
    checkUnlock(type, c); // marche pour tous les paliers : dépenser des crocodiles fait aussi progresser vers le lion, etc.
    saveState();
    renderDock();
    syncStatsDelta(type !== "mouton" ? { [type]: -1 } : null, { [type]: 1 }, null);

    if (c.bot) {
      c.history.push({ dir: "out", animal: type, ts: Date.now() });
      saveState();
      renderChatBubbles();
      scheduleBotReply(c);
      return;
    }

    if (FIREBASE_READY) {
      authReady.then((ok) => {
        // Contrairement à withAuth(), on veut que l'échec d'authentification
        // tombe dans le même .catch() que l'échec d'écriture ci-dessous —
        // les deux doivent déclencher le même repli hors-ligne.
        if (!ok) throw new Error("auth indisponible");
        return threadRef(state.pseudo, c.code).add({
            from: state.pseudo,
            animal: type,
            ts: firebase.firestore.FieldValue.serverTimestamp(), // source de tri/dédup, inchangée
            clientTs: now(), // horloge calée serveur au moment du clic — voir plus haut pourquoi c'est ça qui s'affiche
          });
        // La bulle s'affiche via l'écouteur onSnapshot de subscribeToThread
        // dès que Firestore confirme l'écriture — quasi instantané.
      }).catch((e) => {
        console.error("Envoi impossible", e);
        showToast("Envoi hors-ligne — pas de connexion");
        c.history.push({ dir: "out", animal: type, ts: Date.now() });
        saveState();
        if (activeContactId === c.id) renderChatBubbles();
      });
    } else {
      c.history.push({ dir: "out", animal: type, ts: Date.now() });
      saveState();
      renderChatBubbles();
    }
  }

  // Envoyer un animal fait progresser vers le déblocage du palier suivant
  // (mouton → crocodile → lion → licorne → rhino). Chaque palier, une fois
  // débloqué, continue de gagner +1 en stock à chaque nouveau seuil atteint.
  function grantUnlock(tier) {
    let gained = 1;
    if (!state.unlocked[tier]) {
      state.unlocked[tier] = true;
      gained = 2;
      showToast(`${ANIMALS[tier].emoji} ${ANIMALS[tier].label} débloqué !`);
    } // sinon : gain silencieux, pas de popup à chaque fois — juste la pastille de stock qui monte
    state.stock[tier] += gained;
    syncStatsDelta({ [tier]: gained }, null, null);
    syncUnlockState();
  }

  // Filet de secours : envoyer le palier juste en dessous reste la voie
  // efficace (chaîne directe, seuil ~9-11), mais le volume de moutons
  // envoyés dans la vie compte aussi, tout seul, pour débloquer n'importe
  // quel palier — beaucoup moins bien (×8 plus dur par échelon sauté),
  // pour ne jamais bloquer durablement quelqu'un qui n'a pas de chance sur
  // la chaîne du dessus.
  function moutonSafetyNetThreshold(tierIndex) {
    return 10 * Math.pow(8, tierIndex - 1);
  }

  function checkUnlock(sentType, contact) {
    const idx = TIER_ORDER.indexOf(sentType);
    const nextTier = TIER_ORDER[idx + 1];
    if (nextTier && state.sentTotals[sentType] >= state.nextThreshold[nextTier]) {
      state.nextThreshold[nextTier] = state.sentTotals[sentType] + randomThreshold(timezoneGapBonus(contact) + primeMoutonBonus());
      grantUnlock(nextTier); // synchronise stock + le nextThreshold qu'on vient de mettre à jour
    }

    if (sentType === "mouton") {
      TIER_ORDER.slice(2).forEach((tier) => { // lion, licorne, rhino — le crocodile est déjà 100% mouton
        const tierIndex = TIER_ORDER.indexOf(tier);
        if (!state.unlocked[tier] && state.sentTotals.mouton >= moutonSafetyNetThreshold(tierIndex)) {
          grantUnlock(tier);
        }
      });
    }
  }

  // Le bot répond après un petit délai (pour ne pas avoir l'air instantané
  // et robotique), avec un animal tiré au hasard — surtout des moutons,
  // avec de temps en temps un animal plus rare pour donner un aperçu de
  // toute la gamme, indépendamment de ce que la personne a débloqué elle-même.
  const BOT_REPLY_ANIMALS = ["mouton", "mouton", "mouton", "mouton", "crocodile", "mouton", "lion", "mouton", "licorne", "rhino"];
  function scheduleBotReply(contact) {
    const delay = 700 + Math.random() * 1800;
    setTimeout(() => {
      const animal = BOT_REPLY_ANIMALS[Math.floor(Math.random() * BOT_REPLY_ANIMALS.length)];
      contact.history.push({ dir: "in", animal, ts: Date.now() });
      saveState();
      if (activeContactId === contact.id && !screens.chat.classList.contains("screen-hidden")) {
        renderChatBubbles();
      } else if (!screens.contacts.classList.contains("screen-hidden")) {
        renderContacts();
      }
    }, delay);
  }

  /* ---------------------------------------------------------------
   * Groupes — sondage muet façon "clic de reconnaissance" : le
   * créateur lance, les membres répondent en envoyant un mouton (ou ne
   * répondent pas, ce qui vaut pour un non), et seul le créateur voit
   * le détail des réponses en direct. Demande Firebase — pas de sens
   * en mode démo local tout seul.
   * ------------------------------------------------------------- */
  let myGroups = [];
  let myInvites = [];
  let unsubscribeMyGroups = null;
  let unsubscribeMyInvites = null;

  function subscribeGroupLists() {
    if (!FIREBASE_READY) return;
    withAuth(() => {
      unsubscribeMyGroups = db.collection("groups").where("members", "array-contains", state.pseudo)
        .onSnapshot((snap) => {
          const prevPolls = {}; // pour repérer un nouveau sondage lancé sur un groupe qu'on suit déjà
          myGroups.forEach((g) => { prevPolls[g.id] = g.currentPollId; });
          myGroups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          myGroups.forEach((g) => {
            if (g.creator !== state.pseudo && g.currentPollId && prevPolls[g.id] !== undefined && prevPolls[g.id] !== g.currentPollId) {
              notify("Crocosheep", `Sondage lancé dans ${g.label || g.id} 🔔`);
            }
          });
          renderContacts();
        }, (e) => console.warn("Liste des groupes indisponible", e));
      unsubscribeMyInvites = db.collection("groups").where("pendingInvites", "array-contains", state.pseudo)
        .onSnapshot((snap) => {
          const prevIds = myInvites.map((g) => g.id);
          myInvites = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          myInvites.forEach((g) => {
            if (!prevIds.includes(g.id)) notify("Crocosheep", `Invitation à rejoindre ${g.label || g.id} 👥`);
          });
          renderContacts();
        }, (e) => console.warn("Invitations indisponibles", e));
    });
  }

  function stopGroupLists() {
    if (unsubscribeMyGroups) { unsubscribeMyGroups(); unsubscribeMyGroups = null; }
    if (unsubscribeMyInvites) { unsubscribeMyInvites(); unsubscribeMyInvites = null; }
  }

  function createGroup() {
    if (!FIREBASE_READY) { showToast("Les groupes ont besoin de la synchro activée"); return; }
    const label = prompt("Nom du groupe (facultatif) :", "");
    withAuth(() => {
      db.collection("groups").add({
        creator: state.pseudo,
        label: (label || "").trim() || `Groupe de ${state.pseudo}`,
        members: [state.pseudo],
        pendingInvites: [],
        currentPollId: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).then((ref) => openGroup(ref.id))
        .catch((e) => { console.error(e); showToast("Impossible de créer le groupe"); });
    });
  }

  function acceptInvite(groupId) {
    withAuth(() => {
      groupRef(groupId).update({
        pendingInvites: firebase.firestore.FieldValue.arrayRemove(state.pseudo),
        members: firebase.firestore.FieldValue.arrayUnion(state.pseudo),
      }).catch((e) => { console.error(e); showToast("Impossible de rejoindre le groupe"); });
    });
  }

  function declineInvite(groupId) {
    withAuth(() => {
      groupRef(groupId).update({
        pendingInvites: firebase.firestore.FieldValue.arrayRemove(state.pseudo),
      }).catch((e) => console.error(e));
    });
  }

  function inviteToGroup(groupId, code) {
    withAuth(() => {
      groupRef(groupId).update({
        pendingInvites: firebase.firestore.FieldValue.arrayUnion(code),
      }).then(() => showToast(`Invitation envoyée à ${code}`))
        .catch((e) => { console.error(e); showToast("Invitation impossible"); });
    });
  }

  function launchPoll(groupId) {
    withAuth(() => {
      groupRef(groupId).collection("polls").add({
        startedAt: firebase.firestore.FieldValue.serverTimestamp(),
        startedBy: state.pseudo,
      }).then((pollRef) => groupRef(groupId).update({ currentPollId: pollRef.id }))
        .then(() => showToast("Sondage lancé"))
        .catch((e) => { console.error(e); showToast("Impossible de lancer le sondage"); });
    });
  }

  function respondToPoll(groupId, pollId) {
    if (looksAutomated(Date.now())) return;
    withAuth(() => {
      groupRef(groupId).collection("polls").doc(pollId)
        .collection("responses").doc(state.pseudo).set({
          animal: "mouton",
          ts: firebase.firestore.FieldValue.serverTimestamp(),
        }).catch((e) => console.error(e));
    });
  }

  let activeGroupId = null;
  let unsubscribeGroupDoc = null;
  let unsubscribeGroupPoll = null;

  function stopGroupScreen() {
    if (unsubscribeGroupDoc) { unsubscribeGroupDoc(); unsubscribeGroupDoc = null; }
    if (unsubscribeGroupPoll) { unsubscribeGroupPoll(); unsubscribeGroupPoll = null; }
  }

  function openGroup(groupId) {
    stopChatSubscription();
    stopContactPreviews();
    stopGroupLists();
    stopGroupScreen();
    activeGroupId = groupId;
    showScreen("group");
    withAuth(() => {
      if (activeGroupId !== groupId) return;
      unsubscribeGroupDoc = groupRef(groupId).onSnapshot((snap) => {
        if (!snap.exists) { showToast("Ce groupe n'existe plus"); showScreen("contacts"); return; }
        renderGroup({ id: snap.id, ...snap.data() });
      }, (e) => console.error("Groupe indisponible", e));
    });
  }

  function renderGroup(group) {
    document.getElementById("group-label").textContent = group.label || group.id;
    const isCreator = group.creator === state.pseudo;
    const body = document.getElementById("group-body");

    let html = `<p class="group-section-label">Membres</p><div class="group-members">`;
    html += group.members.map((m) => `<span class="group-member-chip">${m}</span>`).join("");
    html += `</div>`;

    if (isCreator) {
      const invitable = state.contacts
        .map((c) => c.code)
        .filter((code) => !group.members.includes(code) && !(group.pendingInvites || []).includes(code));
      html += `<button class="add-member-btn" id="add-member-btn">+ Ajouter un membre</button>`;
      html += `<button class="poll-launch-btn" id="launch-poll-btn">🔔 Lancer un sondage</button>`;
      html += `<div id="poll-tally-area"></div>`;
      body.innerHTML = html;

      document.getElementById("add-member-btn").addEventListener("click", () => {
        if (!invitable.length) { showToast("Tous tes contacts sont déjà dans le groupe"); return; }
        const pick = prompt(`Code à inviter (parmi tes contacts) :\n${invitable.join(", ")}`);
        if (!pick) return;
        const code = pick.trim().toUpperCase();
        if (!invitable.includes(code)) { showToast("Ce code n'est pas dans tes contacts disponibles"); return; }
        inviteToGroup(group.id, code);
      });
      document.getElementById("launch-poll-btn").addEventListener("click", () => launchPoll(group.id));

      subscribeGroupPoll(group);
    } else {
      if (!group.currentPollId) {
        html += `<p class="group-waiting">En attente du premier sondage 🕊️</p>`;
        body.innerHTML = html;
      } else {
        html += `<div id="member-poll-area"></div>`;
        body.innerHTML = html;
        subscribeMemberResponse(group);
      }
    }
  }

  function subscribeGroupPoll(group) {
    if (unsubscribeGroupPoll) { unsubscribeGroupPoll(); unsubscribeGroupPoll = null; }
    const area = document.getElementById("poll-tally-area");
    if (!group.currentPollId) { area.innerHTML = `<p class="group-waiting">Pas encore de sondage lancé.</p>`; return; }
    unsubscribeGroupPoll = groupRef(group.id).collection("polls").doc(group.currentPollId)
      .collection("responses").onSnapshot((snap) => {
        // Le créateur lance le sondage — le fait de le lancer est déjà son
        // signal, inutile de compter aussi sa propre réponse.
        const voters = group.members.filter((m) => m !== group.creator);
        const responded = snap.docs.map((d) => d.id).filter((m) => voters.includes(m));
        const total = voters.length;
        const pending = voters.filter((m) => !responded.includes(m));
        area.innerHTML = `
          <p class="poll-tally">${responded.length}/${total}</p>
          <p class="poll-tally-label">ont répondu</p>
          <p class="poll-list-title">Ont dit oui</p>
          <div class="poll-list">${responded.map((m) => `<span class="poll-chip yes">${m}</span>`).join("") || `<span class="poll-chip pending">Personne pour l'instant</span>`}</div>
          <hr class="poll-divider">
          <p class="poll-list-title">Pas encore répondu</p>
          <div class="poll-list">${pending.map((m) => `<span class="poll-chip pending">${m}</span>`).join("") || `<span class="poll-chip yes">Tout le monde a répondu 🎉</span>`}</div>
        `;
      }, (e) => console.error("Réponses indisponibles", e));
  }

  function subscribeMemberResponse(group) {
    if (unsubscribeGroupPoll) { unsubscribeGroupPoll(); unsubscribeGroupPoll = null; }
    const area = document.getElementById("member-poll-area");
    unsubscribeGroupPoll = groupRef(group.id).collection("polls").doc(group.currentPollId)
      .collection("responses").doc(state.pseudo).onSnapshot((snap) => {
        if (snap.exists) {
          area.innerHTML = `<p class="poll-responded">✅ Tu as répondu à ce sondage</p>`;
        } else {
          area.innerHTML = `<button class="poll-respond-btn" id="respond-btn" aria-label="Répondre au sondage">${SHEEP_SVG}</button>`;
          document.getElementById("respond-btn").addEventListener("click", () => respondToPoll(group.id, group.currentPollId));
        }
      }, (e) => console.error("Réponse indisponible", e));
  }

  /* ---------------------------------------------------------------
   * Écran profil
   * ------------------------------------------------------------- */
  function renderProfile() {
    document.getElementById("profile-avatar").textContent = state.pseudo.slice(0, 1);
    document.getElementById("profile-avatar").style.background = "var(--accent)";
    document.getElementById("profile-id").textContent = state.pseudo;
    document.getElementById("profile-since").textContent =
      `Sur Crocosheep depuis ${new Date(state.since).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
    document.getElementById("sync-status").textContent = FIREBASE_READY
      ? "🟢 Synchro activée entre appareils"
      : "⚪ Mode démo local — pas encore de synchro entre appareils";

    // Mêmes trois chiffres (envoyé/reçu/en stock) que sur le profil public
    // d'un contact — Pierre voulait la même vitrine sur son propre profil,
    // pas juste le nombre envoyé.
    const grid = document.getElementById("badge-grid");
    grid.innerHTML = "";
    TIER_ORDER.forEach((type) => {
      const sent = state.sentTotals[type] || 0;
      const received = state.receivedTotals[type] || 0;
      const owned = type === "mouton" ? "∞" : (state.stock[type] || 0);
      const locked = type !== "mouton" && !state.unlocked[type];
      const card = document.createElement("div");
      card.className = `badge-card ${locked ? "locked" : ""}`;
      card.innerHTML = `
        ${locked ? `<span class="badge-lock">🔒</span>` : ""}
        <span class="badge-icon">${iconMarkup(type)}</span>
        <p class="badge-name">${ANIMALS[type].label}</p>
        <div class="pp-stats">
          <span><b>${sent}</b>envoyé</span>
          <span><b>${received}</b>reçu</span>
          <span><b>${owned}</b>en stock</span>
        </div>`;
      grid.appendChild(card);
    });

    renderShop();
  }

  // Boutique factice — aucun paiement réel, juste pour montrer le principe :
  // un tap "achète" un pack de 3, débloque le palier si besoin. C'est la
  // même mécanique que gagner via le clicker, juste instantanée.
  function buyAnimal(type) {
    const wasLocked = !state.unlocked[type];
    state.unlocked[type] = true;
    state.stock[type] = (state.stock[type] || 0) + 3;
    saveState();
    renderProfile();
    if (screens.chat && !screens.chat.classList.contains("screen-hidden")) renderDock();
    showToast(`🎉 Achat simulé : +3 ${ANIMALS[type].label.toLowerCase()} (aucun vrai paiement)`);
    syncStatsDelta({ [type]: 3 }, null, null);
    if (wasLocked) syncUnlockState();
  }

  function renderShop() {
    const grid = document.getElementById("shop-grid");
    grid.innerHTML = "";
    UNLOCKABLE_TIERS.forEach((type) => {
      const card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = `
        <span class="shop-icon">${iconMarkup(type)}</span>
        <p class="shop-name">${ANIMALS[type].label}</p>
        <p class="shop-qty">Pack de 3 — ${state.stock[type]} en stock</p>
        <button class="shop-buy-btn" data-type="${type}">${ANIMALS[type].price}</button>`;
      card.querySelector(".shop-buy-btn").addEventListener("click", () => buyAnimal(type));
      grid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------
   * Historique des versions
   * ------------------------------------------------------------- */
  const CHANGELOG = [
    { version: "v20", date: "20 août 2026", changes: [
      "Plus de faux contacts de démo (R-482/K-071/T-955) — un nouvel arrivant ne voit plus que le bot, pas de fausses conversations",
      "Vrai écran de bienvenue au premier lancement, avec quoi faire ensuite",
      "Premier affichage instantané (logo) au lieu d'un écran vide le temps que l'appli démarre",
    ]},
    { version: "v19", date: "20 août 2026", changes: [
      "Passe pro sur l'identité visuelle : vrai logo d'installation (icône Android/Chrome, plus juste Apple), petit défaut nettoyé sur l'icône mouton",
      "Nom \"Crocosheep\" dans une police dédiée, en deux tons (Croco en vert, sheep en encre)",
      "Un peu de profondeur sur les cartes et le bandeau d'envoi (ombres douces) au lieu d'aplats plats",
      "Animations d'apparition sur les nouveaux messages et les nouveaux animaux débloqués — cette fois ciblées sur l'élément qui vient d'apparaître, pas tout l'écran (ce qui avait causé le bug retiré en v6/v7)",
    ]},
    { version: "v18", date: "18 août 2026", changes: [
      "Ton propre profil affiche maintenant envoyé/reçu/en stock pour chaque animal, comme quand tu regardes le profil d'un contact",
    ]},
    { version: "v17", date: "18 août 2026", changes: [
      "Correction interne sur la mise à jour automatique (v16) : un deuxième rechargement d'affilée pouvait produire une adresse invalide",
    ]},
    { version: "v16", date: "18 août 2026", changes: [
      "Mise à jour automatique : l'appli se recharge toute seule dès qu'une nouvelle version est en ligne, plus besoin de fermer/rouvrir",
    ]},
    { version: "v15", date: "18 août 2026", changes: [
      "Taper en dehors du profil ou du changelog les ferme maintenant, comme la croix",
    ]},
    { version: "v14", date: "17 août 2026", changes: [
      "Pseudo local sur un contact : tape sur son code en discussion → \"Renommer ce contact\" pour lui donner un petit nom (juste pour toi, jamais envoyé nulle part, le code reste visible en dessous)",
    ]},
    { version: "v13", date: "17 août 2026", changes: [
      "Balayer pour supprimer ne marchait pas de manière fiable sur iPhone (rien ne se révélait) — corrigé en repassant sur de vrais événements tactiles",
      "Balayer pour supprimer est maintenant aussi possible sur les groupes (= quitter le groupe)",
      "Bouton supprimer : icône tête de mort dessinée (pixel art) à la place de l'emoji, fond noir, plus de liseré orange dans les coins",
      "Balayer depuis le bord gauche pour revenir en arrière suit maintenant le doigt en direct avec une vraie animation, au lieu de sauter directement à l'écran précédent",
    ]},
    { version: "v12", date: "17 août 2026", changes: [
      "Balayer une conversation vers la gauche pour la supprimer (💀) — juste chez toi, l'historique reste intact pour l'autre personne",
      "Balayer depuis le bord gauche de l'écran pour revenir en arrière, comme le geste natif iOS, en plus du bouton ←",
    ]},
    { version: "v11", date: "17 août 2026", changes: [
      "Notifications réparées sur iPhone : passaient par un appel que iOS ignore silencieusement, corrigé via un service worker",
      "Compteurs du profil public (envoyé/reçu/en stock) plus fiables : un raté réseau ne les fait plus rester bloqués pour toujours, réessai automatique jusqu'à confirmation",
      "Heure affichée dans le chat corrigée (était en retard d'environ 1 seconde sur l'heure réelle d'envoi)",
    ]},
    { version: "v10", date: "13 août 2026", changes: [
      "Notifications (mouton reçu, invitation de groupe, sondage lancé) tant que l'appli est ouverte quelque part — vraie notif app fermée demanderait un compte Firebase payant, pas activé",
    ]},
    { version: "v9", date: "13 août 2026", changes: [
      "Deux nouveaux paramètres cachés : écart de fuseau horaire avec le contact, nombre premier de moutons envoyés dans la vie",
    ]},
    { version: "v8", date: "13 août 2026", changes: [
      "Vrai logo crocodile de Pierre, recolorié automatiquement (corps vert foncé, contour et œil gardés)",
      "3 animaux de plus : dragon, panda, T-Rex",
      "Le mouton seul peut aussi débloquer n'importe quel palier, juste beaucoup moins efficacement que la chaîne directe",
      "Profil public : tape sur le code d'un contact en discussion pour voir son palmarès envoyé/reçu/en stock",
      "Stock et paliers synchronisés entre appareils partageant la même identité (ne dépendait que du stockage local avant)",
      "Bouton \"+ Ajouter un contact\" par code, sans passer par un lien",
      "Le créateur d'un sondage de groupe n'est plus compté parmi les votants attendus",
      "Bulles de discussion : l'animation de démarrage ne rejoue plus sur les anciens messages à chaque envoi",
    ]},
    { version: "v7", date: "13 août 2026", changes: [
      "Groupes : créer, inviter tes contacts, sondage muet lancé par le créateur, réponse en un tap (mouton) ou rien",
      "Boutique factice sur le profil (maquette visuelle, aucun vrai paiement)",
      "Bot de démo toujours disponible pour tester sans deuxième téléphone",
      "Clé de récupération séparée du code public — le code seul ne suffit plus à usurper une identité",
      "Anti-triche : clics trop rapides/robotiques ignorés, horloge calée sur le serveur plutôt que celle du téléphone",
      "Bouton mouton en fond gris pour mieux ressortir",
      "Avatar rond retiré partout (liste et en-tête de discussion) ; texte d'accroche et barre de progression retirés",
      "Bouton d'un animal épuisé (stock à 0) qui disparaît au lieu de rester grisé",
      "Horloge en direct au-dessus des boutons d'envoi",
    ]},
    { version: "v6", date: "13 août 2026", changes: [
      "Crocodile en illustration maison (plus l'emoji)",
      "Chaque animal envoyé fait progresser vers le palier suivant, pas que le mouton",
      "Heure exacte (HH:MM:SS) sous chaque message envoyé",
      "La zone d'envoi se divise en bandes au fil des déblocages ; les animaux verrouillés sont invisibles",
      "Liste des contacts en tableau de bord (code + dernier envoi, mis à jour en direct)",
    ]},
    { version: "v5", date: "13 août 2026", changes: [
      "Un appareil peut adopter le code d'un autre pour tester avec la même identité des deux côtés",
      "Le partage de lien ne reste plus bloqué silencieusement sur iPhone",
    ]},
    { version: "v4", date: "13 août 2026", changes: [
      "Plus de halo gris au tap sur iPhone",
      "Le zoom ne vole plus les taps rapides sur le mouton",
    ]},
    { version: "v3", date: "13 août 2026", changes: [
      "Synchronisation en direct entre deux téléphones (Firebase)",
      "Appairage par lien partagé",
    ]},
    { version: "v2", date: "12 août 2026", changes: [
      "Icône d'écran d'accueil iPhone",
      "Fond orange",
      "Correction du défilement vers le dernier message",
    ]},
    { version: "v1", date: "12 août 2026", changes: [
      "Première maquette : contacts, discussion, profil",
      "Mouton illustré, envoi libre et illimité",
      "Déblocage du crocodile après des moutons envoyés",
    ]},
  ];
  const APP_VERSION = CHANGELOG[0].version;

  function renderChangelog() {
    document.getElementById("changelog-list").innerHTML = CHANGELOG.map((entry) => `
      <div class="changelog-entry">
        <div class="changelog-version-row">
          <span class="changelog-version">${entry.version}</span>
          ${entry.version === APP_VERSION ? `<span class="changelog-current">actuelle</span>` : ""}
          <span class="changelog-date">${entry.date}</span>
        </div>
        <ul>${entry.changes.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
    `).join("");
  }

  /* ---------------------------------------------------------------
   * Toast
   * ------------------------------------------------------------- */
  let toastTimer = null;
  function showToast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    // Durée proportionnelle à la longueur du message : un texte court
    // ("ajouté aux contacts") reste à 2.2s, un texte plus long et
    // explicatif (ex. la confirmation de suppression) a le temps d'être lu.
    const duration = Math.min(5000, 2200 + Math.max(0, message.length - 30) * 40);
    toastTimer = setTimeout(() => el.classList.remove("visible"), duration);
  }

  /* ---------------------------------------------------------------
   * Notifications — version "onglet ouvert" via l'API Notification du
   * navigateur : fonctionne tant que le site est ouvert quelque part
   * (même en arrière-plan, pas au premier plan), mais pas app fermée.
   * Une vraie notif push app-fermée demanderait Firebase Cloud
   * Messaging + Service Worker + Cloud Function, ce qui impose de
   * passer le projet Firebase en facturation payante (plan Blaze) —
   * décision financière qu'on laisse à Pierre, pas prise ici.
   *
   * new Notification(...) appelé directement depuis la page ne marche
   * pas sur iOS Safari (silencieusement ignoré même permission accordée
   * — c'était la cause du "ça marche pas" sur iPhone) : seule une
   * notification déclenchée via un service worker enregistré (sw.js)
   * s'affiche vraiment là-bas. On enregistre ce service worker au
   * démarrage et on préfère ce chemin dès qu'il est prêt ; sinon on
   * retombe sur l'ancien appel direct (marche très bien sur desktop).
   * ------------------------------------------------------------- */
  let swRegistration = null;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then((reg) => { swRegistration = reg; })
      .catch((e) => console.warn("Service worker (notifications) indisponible", e));
  }
  function notify(title, body) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!document.hidden) return; // on est déjà en train de regarder l'appli, pas la peine
    const opts = { body, icon: "apple-touch-icon.png" };
    if (swRegistration) {
      swRegistration.showNotification(title, opts).catch((e) => console.warn("Notification (service worker) impossible", e));
      return;
    }
    try {
      new Notification(title, opts);
    } catch (e) { /* certains navigateurs mobiles n'aiment pas new Notification() direct, tant pis */ }
  }

  /* ---------------------------------------------------------------
   * Câblage des écrans
   * ------------------------------------------------------------- */
  document.getElementById("open-profile").addEventListener("click", () => {
    stopChatSubscription();
    stopContactPreviews();
    stopGroupScreen();
    renderProfile();
    showScreen("profile");
  });
  document.getElementById("back-to-contacts").addEventListener("click", () => {
    stopChatSubscription();
    subscribeContactPreviews();
    showScreen("contacts");
  });
  document.getElementById("back-to-contacts-from-profile").addEventListener("click", () => {
    subscribeContactPreviews();
    showScreen("contacts");
  });
  document.getElementById("back-to-contacts-from-group").addEventListener("click", () => {
    stopGroupScreen();
    subscribeContactPreviews();
    showScreen("contacts");
  });

  // Le code public (ex. "W-867") sert à être ajouté en contact — il ne doit
  // JAMAIS suffire, seul, à devenir quelqu'un d'autre. La clé de
  // récupération, elle, n'est jamais partagée avec le lien de contact :
  // il faut aller la chercher exprès ici pour l'obtenir.
  document.getElementById("show-recovery-key").addEventListener("click", () => {
    prompt(
      "Ta clé de récupération (garde-la pour toi, ne la partage jamais comme ton lien de contact) :\n\nPour retrouver cette identité sur un autre appareil, colle cette valeur complète dans \"Restaurer une identité\" sur cet autre appareil.",
      `${state.pseudo}:${state.recoveryKey}`
    );
  });

  document.getElementById("restore-identity").addEventListener("click", () => {
    const input = prompt(
      "Colle ici la clé de récupération complète affichée sur ton autre appareil (format CODE:clé).\n\nAttention : tes contacts et ton historique restent propres à cet appareil, seule l'identité change."
    );
    if (!input) return;
    const [code, key] = input.trim().split(":");
    if (!code || !key) {
      showToast("Format invalide — colle bien CODE:clé en entier");
      return;
    }
    state.pseudo = code.trim().toUpperCase();
    state.recoveryKey = key.trim();
    saveState();
    renderProfile();
    showToast(`Identité restaurée : ${state.pseudo}`);
  });

  document.getElementById("share-link").addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}?add=${encodeURIComponent(state.pseudo)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Crocosheep", text: "Ajoute-moi sur Crocosheep 🐑", url });
        return; // partage réussi (ou feuille refermée proprement), rien d'autre à faire
      } catch (e) {
        if (e && e.name === "AbortError") return; // fermé volontairement par l'utilisateur
        // Sinon (ex. share() cassé en PWA standalone sur certaines versions iOS) :
        // on ne s'arrête pas là, on tente le repli copier-coller ci-dessous.
        console.warn("Partage natif indisponible, repli sur la copie", e);
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("Lien copié !");
    } catch (e) {
      // Dernier filet, imparable sur tous les navigateurs : une boîte système
      // avec le lien pré-sélectionné, à copier à la main.
      prompt("Copie ce lien :", url);
    }
  });

  function updateNotifyButton() {
    const btn = document.getElementById("enable-notifications");
    if (typeof Notification === "undefined") { btn.style.display = "none"; return; }
    if (Notification.permission === "granted") btn.textContent = "🔔 Notifications activées";
    else if (Notification.permission === "denied") btn.textContent = "🔕 Notifications bloquées (à réactiver dans les réglages du navigateur)";
    else btn.textContent = "🔔 Activer les notifications";
  }
  updateNotifyButton();

  document.getElementById("enable-notifications").addEventListener("click", () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then(() => updateNotifyButton());
    } else {
      showToast("Change ça dans les réglages de notifications du navigateur");
    }
  });

  document.getElementById("open-profile").style.backgroundImage =
    `url("data:image/svg+xml,${encodeURIComponent(SHEEP_SVG)}")`;

  const versionBadge = document.getElementById("show-changelog");
  versionBadge.textContent = APP_VERSION;
  const changelogOverlay = document.getElementById("changelog-overlay");
  versionBadge.addEventListener("click", () => {
    renderChangelog();
    changelogOverlay.classList.remove("screen-hidden");
  });
  document.getElementById("close-changelog").addEventListener("click", () => {
    changelogOverlay.classList.add("screen-hidden");
  });
  // Taper en dehors du panneau (sur le fond assombri) doit fermer comme la
  // croix — e.target === l'overlay lui-même exclut les clics qui viennent
  // du panneau ou de son contenu (ils remontent avec un target différent).
  changelogOverlay.addEventListener("click", (e) => {
    if (e.target === changelogOverlay) changelogOverlay.classList.add("screen-hidden");
  });

  document.getElementById("chat-code-btn").addEventListener("click", () => {
    const el = document.getElementById("chat-code");
    const code = el.dataset.code || el.textContent;
    if (code && code !== "—") openPublicProfile(code);
  });
  const publicProfileOverlay = document.getElementById("public-profile-overlay");
  function closePublicProfile() {
    publicProfileOverlay.classList.add("screen-hidden");
    if (unsubscribePublicProfile) { unsubscribePublicProfile(); unsubscribePublicProfile = null; }
  }
  document.getElementById("close-public-profile").addEventListener("click", closePublicProfile);
  publicProfileOverlay.addEventListener("click", (e) => {
    if (e.target === publicProfileOverlay) closePublicProfile();
  });
  document.getElementById("rename-contact-btn").addEventListener("click", () => {
    if (!currentPublicProfileCode) return;
    renameContact(currentPublicProfileCode);
  });

  // Horloge en direct au-dessus du dock d'envoi — la même horloge (calée
  // serveur) que celle utilisée par l'algorithme caché du seuil.
  function tickClock() {
    const el = document.getElementById("live-clock");
    if (el) el.textContent = exactTime(now());
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------------------------------------------------------------
   * Retour par balayage depuis le bord gauche — en plus du bouton ←,
   * geste natif façon iOS sur les 3 écrans qui ont un retour possible.
   * Suivi en direct du doigt (pas juste un déclenchement au seuil) :
   * l'écran actuel glisse avec le doigt, l'écran contacts apparaît
   * dessous avec un léger effet de parallaxe, et au relâchement soit ça
   * termine en douceur (geste assez loin), soit ça revient à sa place.
   * ------------------------------------------------------------- */
  const BACK_BUTTON_BY_SCREEN = {
    chat: "back-to-contacts",
    group: "back-to-contacts-from-group",
    profile: "back-to-contacts-from-profile",
  };
  const SWIPE_BACK_EDGE_ZONE = 24; // px depuis le bord où le geste doit démarrer
  const SWIPE_BACK_COMMIT_RATIO = 0.35; // fraction de la largeur d'écran à dépasser pour valider
  const SWIPE_BACK_SETTLE_MS = 280;
  let swipeBack = null; // { screenName, outgoing, target, width, startX, startY, lastX, locked }

  function swipeBackScreenName() {
    return Object.keys(BACK_BUTTON_BY_SCREEN).find((name) => !screens[name].classList.contains("screen-hidden"));
  }

  function lockSwipeBack(sb) {
    sb.locked = true;
    sb.outgoing = screens[sb.screenName];
    sb.target = screens.contacts;
    sb.width = sb.outgoing.getBoundingClientRect().width || window.innerWidth;
    sb.outgoing.classList.add("swipe-live");
    sb.target.classList.add("swipe-live");
    sb.target.classList.remove("screen-hidden"); // révélé dessous pendant le geste, sans redéclencher sa vraie logique d'ouverture
    sb.outgoing.style.transition = "none";
    sb.target.style.transition = "none";
  }

  function updateSwipeBack(sb, dx) {
    const progress = Math.min(1, Math.max(0, dx / sb.width));
    sb.outgoing.style.transform = `translateX(${dx}px)`;
    sb.target.style.transform = `translateX(${-25 + 25 * progress}%)`; // parallaxe : arrive de -25% vers 0%
  }

  function cleanupSwipeBack(outgoing, target, restoreHidden) {
    [outgoing, target].forEach((el) => {
      el.classList.remove("swipe-live");
      el.style.transition = "";
      el.style.transform = "";
    });
    if (restoreHidden) target.classList.add("screen-hidden");
  }

  function settleSwipeBack(sb, dx) {
    const commit = dx > sb.width * SWIPE_BACK_COMMIT_RATIO;
    sb.outgoing.style.transition = `transform ${SWIPE_BACK_SETTLE_MS}ms cubic-bezier(.22,.61,.36,1)`;
    sb.target.style.transition = `transform ${SWIPE_BACK_SETTLE_MS}ms cubic-bezier(.22,.61,.36,1)`;
    if (commit) {
      sb.outgoing.style.transform = `translateX(${sb.width}px)`;
      sb.target.style.transform = "translateX(0%)";
      setTimeout(() => {
        document.getElementById(BACK_BUTTON_BY_SCREEN[sb.screenName]).click(); // vraie logique de retour (désabonnements, etc.)
        cleanupSwipeBack(sb.outgoing, sb.target, false);
      }, SWIPE_BACK_SETTLE_MS);
    } else {
      sb.outgoing.style.transform = "translateX(0px)";
      sb.target.style.transform = "translateX(-25%)";
      setTimeout(() => cleanupSwipeBack(sb.outgoing, sb.target, true), SWIPE_BACK_SETTLE_MS);
    }
  }

  document.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (!t || t.clientX > SWIPE_BACK_EDGE_ZONE) { swipeBack = null; return; }
    const screenName = swipeBackScreenName();
    if (!screenName) { swipeBack = null; return; }
    swipeBack = { screenName, startX: t.clientX, startY: t.clientY, lastX: t.clientX, locked: false };
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    if (!swipeBack) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - swipeBack.startX;
    const dy = t.clientY - swipeBack.startY;
    if (!swipeBack.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // pas encore assez de mouvement pour trancher
      if (Math.abs(dy) > Math.abs(dx) || dx < 0) { swipeBack = null; return; } // vertical, ou vers la gauche : pas notre geste
      lockSwipeBack(swipeBack);
    }
    swipeBack.lastX = t.clientX;
    updateSwipeBack(swipeBack, Math.max(0, dx));
    if (e.cancelable) e.preventDefault(); // on a la main sur le geste, plus la peine de scroller la page en dessous
  }, { passive: false });

  document.addEventListener("touchend", () => {
    if (!swipeBack) return;
    if (swipeBack.locked) settleSwipeBack(swipeBack, Math.max(0, swipeBack.lastX - swipeBack.startX));
    swipeBack = null;
  }, { passive: true });

  document.addEventListener("touchcancel", () => {
    if (swipeBack && swipeBack.locked) cleanupSwipeBack(swipeBack.outgoing, swipeBack.target, true);
    swipeBack = null;
  }, { passive: true });

  // Réessai des compteurs stats non confirmés (voir syncStatsDelta) : au
  // retour du réseau, et en filet de sécurité toutes les 15s tant qu'il en
  // reste — flushPendingStatsSync() ne fait rien si la file est vide ou
  // qu'une tentative est déjà en cours, donc ce ping régulier ne coûte rien
  // la plupart du temps.
  window.addEventListener("online", flushPendingStatsSync);
  setInterval(flushPendingStatsSync, 15000);
  flushPendingStatsSync(); // reprend une file laissée en attente par une session précédente (onglet fermé avant confirmation)

  /* ---------------------------------------------------------------
   * Mise à jour automatique — Pierre veut que les gens récupèrent la
   * dernière version sans rien avoir à faire (pas de bouton "recharger",
   * pas de bannière à valider). L'appli vérifie de temps en temps un
   * petit fichier version.json (jamais mis en cache, voir cache: "no-
   * store") ; s'il annonce un numéro différent du sien, elle se recharge
   * elle-même — vers une URL avec un paramètre différent à chaque fois,
   * pour être sûre d'obtenir index.html/script.js/style.css réellement
   * frais et pas une copie que le navigateur aurait gardée en cache.
   *
   * Revers de la médaille, assumé : le rechargement peut tomber à un
   * mauvais moment (en plein milieu d'un geste, par exemple) — rien n'est
   * perdu (l'état est sauvegardé en continu dans localStorage), mais
   * l'écran saute sans prévenir. C'est le compromis explicitement demandé
   * (zéro action requise) plutôt qu'une bannière "nouvelle version
   * disponible" à cliquer.
   *
   * IMPORTANT pour les prochains déploiements : version.json doit être
   * mis à jour EN MÊME TEMPS que APP_VERSION (CHANGELOG[0].version) —
   * sinon toutes les sessions ouvertes se rechargent en boucle (ou,
   * pire, jamais) tant que les deux ne sont pas synchronisés.
   * ------------------------------------------------------------- */
  async function checkForUpdate() {
    try {
      const res = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version && data.version !== APP_VERSION) {
        // Bug corrigé : le séparateur doit dépendre de ce qui RESTE après
        // avoir retiré l'ancien "_=..." (pas de la query string d'origine)
        // sinon un deuxième rechargement auto produit une URL du genre
        // "/Crocosheep/&_=..." (sans "?"), potentiellement un 404.
        const strippedSearch = location.search.replace(/[?&]_=\d+/, "");
        location.href = location.pathname + strippedSearch + (strippedSearch ? "&" : "?") + "_=" + Date.now();
      }
    } catch (e) { /* pas grave — hors ligne ou fichier temporairement injoignable, on réessaiera plus tard */ }
  }
  setTimeout(checkForUpdate, 4000); // laisse l'appli finir de démarrer avant le tout premier check
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkForUpdate(); });
  // Filet de sécurité pour le cas rare d'un onglet resté au premier plan
  // sans jamais repasser en arrière-plan (le vrai déclencheur du
  // quotidien, c'est visibilitychange ci-dessus) — même 72h sans jamais
  // changer d'appli est déjà rare en usage réel (Pierre), pas la peine
  // de vérifier toutes les 5 min.
  setInterval(checkForUpdate, 72 * 60 * 60 * 1000);

  handleIncomingLink();
  subscribeContactPreviews();
  subscribeOwnProfile();
  publishOwnTimezone();
  showScreen("contacts");

  // Le tout premier rendu est prêt : on peut retirer le splash figé de
  // index.html (fondu, puis suppression du nœud pour ne rien laisser
  // traîner dans le DOM).
  const bootSplash = document.getElementById("boot-splash");
  if (bootSplash) {
    bootSplash.classList.add("boot-splash-hidden");
    setTimeout(() => bootSplash.remove(), 250);
  }
})();
