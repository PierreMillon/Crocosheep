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
   * ------------------------------------------------------------- */
  function syncStatsDelta(stockDelta, sentDelta, receivedDelta) {
    if (!FIREBASE_READY) return;
    withAuth(() => {
      const updates = {};
      Object.entries(stockDelta || {}).forEach(([k, v]) => { updates[`stock.${k}`] = firebase.firestore.FieldValue.increment(v); });
      Object.entries(sentDelta || {}).forEach(([k, v]) => { updates[`sentTotals.${k}`] = firebase.firestore.FieldValue.increment(v); });
      Object.entries(receivedDelta || {}).forEach(([k, v]) => { updates[`receivedTotals.${k}`] = firebase.firestore.FieldValue.increment(v); });
      if (!Object.keys(updates).length) return;
      profileRef(state.pseudo).set(updates, { merge: true })
        .catch((e) => console.warn("Synchro stats impossible", e));
    });
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

  function seedContacts() {
    return [
      botContact(),
      {
        id: "c1", code: "R-482", color: "#5c8a53",
        history: [
          { dir: "in", animal: "mouton", ts: Date.now() - 1000 * 60 * 60 * 20 },
          { dir: "in", animal: "mouton", ts: Date.now() - 1000 * 60 * 60 * 4 },
        ],
      },
      { id: "c2", code: "K-071", color: "#b98fd6", history: [] },
      {
        id: "c3", code: "T-955", color: "#d9a441",
        history: [{ dir: "in", animal: "crocodile", ts: Date.now() - 1000 * 60 * 90 }],
      },
    ];
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
    if (!s.recoveryKey) s.recoveryKey = randomRecoveryKey(); // comptes déjà en test avant l'ajout de cette clé
    if (!s.contacts.some((c) => c.id === "bot")) s.contacts.unshift(botContact()); // comptes déjà en test avant l'ajout du bot
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
            const last = { dir: m.from === state.pseudo ? "out" : "in", animal: m.animal, ts: m.ts.toMillis() };
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
      btn.addEventListener("click", () => openGroup(g.id));
      list.appendChild(btn);
    });

    state.contacts.forEach((c) => {
      const last = c.history[c.history.length - 1];
      const btn = document.createElement("button");
      btn.className = "contact-item";
      btn.innerHTML = `
        <p class="contact-code">${c.code}</p>
        <span class="contact-preview">
          ${last
            ? `<span class="contact-preview-icon">${iconMarkup(last.animal)}</span><span>${exactTime(last.ts)}</span>`
            : "<span>Aucun échange pour l'instant</span>"}
        </span>`;
      btn.addEventListener("click", () => openChat(c.id));
      list.appendChild(btn);
    });

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
   * Écran discussion
   * ------------------------------------------------------------- */
  // Profil public d'un contact : envoyé / reçu / possédé, visible par
  // n'importe qui (décision de Pierre — pas de garantie de confidentialité
  // ici, l'effet vitrine prime). Lecture ponctuelle, pas de listener
  // permanent — c'est une consultation, pas un fil qu'on regarde en continu.
  let unsubscribePublicProfile = null;
  function openPublicProfile(code) {
    if (code === "🤖 Bot") return; // le bot n'a pas de profil Firestore, rien à montrer
    document.getElementById("public-profile-title").textContent = `Profil de ${code}`;
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
    document.getElementById("chat-code").textContent = c.code;
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
              return { dir: m.from === state.pseudo ? "out" : "in", animal: m.animal, ts: m.ts.toMillis() };
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

  function renderChatBubbles() {
    const c = state.contacts.find((x) => x.id === activeContactId);
    const wrap = document.getElementById("chat-bubbles");
    wrap.innerHTML = "";
    if (!c.history.length) {
      wrap.innerHTML = `<p class="chat-empty">Aucun animal échangé pour l'instant. Envoie le premier mouton 🐑</p>`;
      return;
    }
    c.history.forEach((m) => {
      const line = document.createElement("div");
      line.className = `bubble-line ${m.dir === "out" ? "out" : "in"}`;
      line.innerHTML = `
        <span class="bubble-icon">${iconMarkup(m.animal)}</span>
        <span class="bubble-time">${exactTime(m.ts)}</span>`;
      wrap.appendChild(line);
    });
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
  function renderDock() {
    const stack = document.getElementById("send-stack");
    stack.innerHTML = "";

    // Une fois le stock d'un animal retombé à zéro, son bouton disparaît
    // aussi (pas de bouton mort qui ne fait qu'afficher une erreur) —
    // il revient tout seul dès qu'un nouveau stock est regagné.
    const active = TIER_ORDER.filter((t) => t === "mouton" || (state.unlocked[t] && state.stock[t] > 0));
    active.forEach((type) => {
      const band = document.createElement("button");
      band.className = "send-band";
      band.setAttribute("aria-label", `Envoyer un ${ANIMALS[type].label.toLowerCase()}`);
      band.style.background = type === "mouton" ? "var(--sheep-band-bg)" : `${ANIMALS[type].color}55`;
      band.innerHTML = `
        <span class="send-band-icon">${iconMarkup(type)}</span>
        ${type !== "mouton" ? `<span class="stock-pill">${state.stock[type]}</span>` : ""}`;
      band.addEventListener("click", () => sendAnimal(type));
      stack.appendChild(band);
    });
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
            ts: firebase.firestore.FieldValue.serverTimestamp(),
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

    const grid = document.getElementById("badge-grid");
    grid.innerHTML = "";
    TIER_ORDER.forEach((type) => {
      const count = state.sentTotals[type];
      const locked = type !== "mouton" && !state.unlocked[type];
      const card = document.createElement("div");
      card.className = `badge-card ${locked ? "locked" : ""}`;
      card.innerHTML = `
        ${locked ? `<span class="badge-lock">🔒</span>` : ""}
        <span class="badge-icon">${iconMarkup(type)}</span>
        <p class="badge-name">${ANIMALS[type].label}</p>
        <p class="badge-count">${count} envoyé${count > 1 ? "s" : ""}</p>`;
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
    toastTimer = setTimeout(() => el.classList.remove("visible"), 2200);
  }

  /* ---------------------------------------------------------------
   * Notifications — version "onglet ouvert" via l'API Notification du
   * navigateur : fonctionne tant que le site est ouvert quelque part
   * (même en arrière-plan, pas au premier plan), mais pas app fermée.
   * Une vraie notif push app-fermée demanderait Firebase Cloud
   * Messaging + Service Worker + Cloud Function, ce qui impose de
   * passer le projet Firebase en facturation payante (plan Blaze) —
   * décision financière qu'on laisse à Pierre, pas prise ici.
   * ------------------------------------------------------------- */
  function notify(title, body) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!document.hidden) return; // on est déjà en train de regarder l'appli, pas la peine
    try {
      new Notification(title, { body, icon: "apple-touch-icon.png" });
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

  document.getElementById("chat-code-btn").addEventListener("click", () => {
    const code = document.getElementById("chat-code").textContent;
    if (code && code !== "—") openPublicProfile(code);
  });
  document.getElementById("close-public-profile").addEventListener("click", () => {
    document.getElementById("public-profile-overlay").classList.add("screen-hidden");
    if (unsubscribePublicProfile) { unsubscribePublicProfile(); unsubscribePublicProfile = null; }
  });

  // Horloge en direct au-dessus du dock d'envoi — la même horloge (calée
  // serveur) que celle utilisée par l'algorithme caché du seuil.
  function tickClock() {
    const el = document.getElementById("live-clock");
    if (el) el.textContent = exactTime(now());
  }
  tickClock();
  setInterval(tickClock, 1000);

  handleIncomingLink();
  subscribeContactPreviews();
  subscribeOwnProfile();
  publishOwnTimezone();
  showScreen("contacts");
})();
