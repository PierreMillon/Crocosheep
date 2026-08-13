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

  // Silhouette maison inspirée du logo crocodile envoyé par Pierre : corps
  // vert foncé, contour vert (plus clair que le corps), œil noir gardé tel quel.
  const CROCODILE_SVG = `
    <svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Crocodile">
      <ellipse cx="55" cy="76" rx="8" ry="6" fill="#173a1c"/>
      <ellipse cx="75" cy="78" rx="8" ry="6" fill="#173a1c"/>
      <ellipse cx="140" cy="76" rx="8" ry="6" fill="#173a1c"/>
      <ellipse cx="160" cy="78" rx="8" ry="6" fill="#173a1c"/>
      <path d="M8,62 C2,54 4,44 14,40 C10,32 16,24 26,24 C30,14 42,8 52,16
               C58,8 70,8 76,18 C84,10 96,10 100,20 C110,12 122,14 126,24
               C150,22 168,26 182,34 C198,40 210,44 214,50 C216,53 214,56 210,56
               C202,54 196,52 190,54 C186,60 176,62 168,58 C160,64 148,64 142,58
               C130,66 110,68 92,66 C76,72 56,74 40,70 C28,74 16,72 8,62 Z"
            fill="#173a1c" stroke="#4da54f" stroke-width="3" stroke-linejoin="round"/>
      <path d="M190,53 L196,60 L184,58 Z" fill="#f4ede0"/>
      <path d="M178,56 L183,63 L172,60 Z" fill="#f4ede0"/>
      <path d="M204,49 L210,55 L200,54 Z" fill="#f4ede0"/>
      <circle cx="118" cy="20" r="9" fill="#f4ede0" stroke="#4da54f" stroke-width="2.5"/>
      <ellipse cx="118" cy="20" rx="3.4" ry="6.5" fill="#1c1a17"/>
    </svg>`;

  const ANIMALS = {
    mouton:    { label: "Mouton",     color: "#f4ede0", tier: 0 },
    crocodile: { label: "Crocodile",  color: "#2f5233", tier: 1, emoji: "🐊" },
    lion:      { label: "Lion",       color: "#d9a441", tier: 2, emoji: "🦁" },
    licorne:   { label: "Licorne",    color: "#b98fd6", tier: 3, emoji: "🦄" },
    rhino:     { label: "Rhinocéros", color: "#8a8f99", tier: 4, emoji: "🦏" },
  };
  const TIER_ORDER = ["mouton", "crocodile", "lion", "licorne", "rhino"];
  const CUSTOM_SVG = { mouton: SHEEP_SVG, crocodile: CROCODILE_SVG };

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
   * État — tout en local pour cette maquette (pas de backend).
   * Le seuil de déblocage du crocodile est tiré au hasard à chaque
   * fois dans une petite plage, pour illustrer le principe de ratio
   * variable sans obliger quiconque à cliquer 2000 fois pour tester.
   * ------------------------------------------------------------- */
  // Amorce de l'algorithme caché "multi-paramètres" évoqué dans le brief :
  // une base aléatoire, + des facteurs discrets liés au moment de l'envoi
  // (heure, parité de la seconde) — invisibles pour qui utilise l'appli,
  // dans l'esprit "chasse au trésor" plutôt qu'un simple tirage uniforme.
  function randomThreshold() {
    const now = new Date();
    let t = 9 + Math.floor(Math.random() * 3); // base : 9, 10 ou 11
    if (now.getHours() >= 7 && now.getHours() < 12) t += 1; // matinée (7h-12h)
    if (now.getSeconds() % 2 === 1) t -= 1; // seconde impaire au moment du tirage
    return Math.max(1, t);
  }

  function randomCode() {
    const n = 100 + Math.floor(Math.random() * 900);
    const l = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${l}-${n}`;
  }

  function seedContacts() {
    return [
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

  function freshState() {
    const nextThreshold = {};
    const unlocked = {};
    UNLOCKABLE_TIERS.forEach((t) => { nextThreshold[t] = randomThreshold(); unlocked[t] = false; });
    return {
      pseudo: randomCode(),
      since: Date.now(),
      stock: { crocodile: 0, lion: 0, licorne: 0, rhino: 0 },
      sentTotals: { mouton: 0, crocodile: 0, lion: 0, licorne: 0, rhino: 0 },
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
      s.unlocked = { crocodile: !!s.crocodileUnlocked, lion: false, licorne: false, rhino: false };
      s.nextThreshold = {
        crocodile: s.nextCrocodileThreshold || (s.sentTotals?.mouton || 0) + randomThreshold(),
        lion: randomThreshold(),
        licorne: randomThreshold(),
        rhino: randomThreshold(),
      };
      delete s.crocodileUnlocked;
      delete s.nextCrocodileThreshold;
    }
    s.stock = { crocodile: 0, lion: 0, licorne: 0, rhino: 0, ...s.stock };
    s.sentTotals = { mouton: 0, crocodile: 0, lion: 0, licorne: 0, rhino: 0, ...s.sentTotals };
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
  }

  function subscribeContactPreviews() {
    stopContactPreviews();
    renderContacts(); // affichage immédiat depuis le cache local, pas d'écran vide en attendant le réseau
    if (!FIREBASE_READY) return;
    authReady.then((ok) => {
      if (!ok) return;
      state.contacts.forEach((c) => {
        const unsub = db.collection("pairs").doc(pairId(state.pseudo, c.code))
          .collection("messages").orderBy("ts", "desc").limit(1)
          .onSnapshot((snap) => {
            if (snap.empty) return;
            const m = snap.docs[0].data();
            if (!m.ts) return; // écriture pas encore confirmée par le serveur
            const last = { dir: m.from === state.pseudo ? "out" : "in", animal: m.animal, ts: m.ts.toMillis() };
            const cached = c.history[c.history.length - 1];
            if (!cached || cached.ts < last.ts) {
              c.history.push(last);
              saveState();
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
  }

  /* ---------------------------------------------------------------
   * Écran discussion
   * ------------------------------------------------------------- */
  function openChat(contactId) {
    stopChatSubscription();
    stopContactPreviews();
    activeContactId = contactId;
    const c = state.contacts.find((x) => x.id === contactId);
    document.getElementById("chat-avatar").textContent = c.code.slice(0, 1);
    document.getElementById("chat-avatar").style.background = c.color;
    document.getElementById("chat-code").textContent = c.code;
    renderChatBubbles(); // affichage immédiat depuis le cache local, pas d'écran vide en attendant le réseau
    renderDock();
    showScreen("chat");
    subscribeToThread(c);
  }

  function subscribeToThread(contact) {
    if (!FIREBASE_READY) return;
    authReady.then((ok) => {
      // L'utilisateur a pu changer d'écran pendant l'authentification
      if (!ok || activeContactId !== contact.id) return;
      unsubscribeChat = db.collection("pairs").doc(pairId(state.pseudo, contact.code))
        .collection("messages").orderBy("ts", "asc")
        .onSnapshot((snap) => {
          contact.history = snap.docs
            .filter((d) => d.data().ts) // ignore les écritures locales pas encore confirmées, pour éviter les doublons
            .map((d) => {
              const m = d.data();
              return { dir: m.from === state.pseudo ? "out" : "in", animal: m.animal, ts: m.ts.toMillis() };
            });
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

    const active = TIER_ORDER.filter((t) => t === "mouton" || state.unlocked[t]);
    active.forEach((type) => {
      const band = document.createElement("button");
      band.className = "send-band";
      band.setAttribute("aria-label", `Envoyer un ${ANIMALS[type].label.toLowerCase()}`);
      band.style.background = type === "mouton" ? "var(--sheep)" : `${ANIMALS[type].color}55`;
      band.innerHTML = `
        <span class="send-band-icon">${iconMarkup(type)}</span>
        ${type !== "mouton" ? `<span class="stock-pill">${state.stock[type]}</span>` : ""}`;
      band.addEventListener("click", () => sendAnimal(type));
      stack.appendChild(band);
    });

    renderProgress();
  }

  function nextLockedTier() {
    return UNLOCKABLE_TIERS.find((t) => !state.unlocked[t]) || null;
  }

  function renderProgress() {
    const p = document.getElementById("sender-progress");
    const target = nextLockedTier();
    if (target) {
      const prevType = TIER_ORDER[TIER_ORDER.indexOf(target) - 1];
      const ratio = Math.min(1, state.sentTotals[prevType] / state.nextThreshold[target]);
      p.textContent = `${prevType === "mouton" ? "🐑" : ANIMALS[prevType].emoji} ${ANIMALS[target].label.toLowerCase()} approche…`;
      p.style.background = `linear-gradient(90deg, var(--accent) ${Math.round(ratio * 100)}%, transparent 0)`;
    } else {
      const last = TIER_ORDER[TIER_ORDER.length - 1];
      p.textContent = state.stock[last] > 0
        ? `${ANIMALS[last].emoji} tout est débloqué — ${ANIMALS[last].label.toLowerCase()} en stock`
        : `${ANIMALS[last].emoji} tout est débloqué — stock épuisé, continue d'envoyer pour en regagner`;
      p.style.background = "none";
    }
  }

  /* ---------------------------------------------------------------
   * Envoi d'un animal
   * ------------------------------------------------------------- */
  function sendAnimal(type) {
    if (type !== "mouton") {
      if ((state.stock[type] || 0) <= 0) {
        showToast(`Plus de ${ANIMALS[type].label.toLowerCase()} en stock`);
        return;
      }
      state.stock[type] -= 1;
    }

    state.sentTotals[type] += 1;
    checkUnlock(type); // marche pour tous les paliers : dépenser des crocodiles fait aussi progresser vers le lion, etc.
    saveState();
    renderDock();

    const c = state.contacts.find((x) => x.id === activeContactId);

    if (FIREBASE_READY) {
      authReady.then((ok) => {
        if (!ok) throw new Error("auth indisponible");
        return db.collection("pairs").doc(pairId(state.pseudo, c.code))
          .collection("messages").add({
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
  function checkUnlock(sentType) {
    const idx = TIER_ORDER.indexOf(sentType);
    const nextTier = TIER_ORDER[idx + 1];
    if (!nextTier) return; // rhino : rien de plus rare à débloquer

    if (state.sentTotals[sentType] < state.nextThreshold[nextTier]) return;

    if (!state.unlocked[nextTier]) {
      state.unlocked[nextTier] = true;
      state.stock[nextTier] += 2;
      showToast(`${ANIMALS[nextTier].emoji} ${ANIMALS[nextTier].label} débloqué !`);
    } else {
      state.stock[nextTier] += 1;
      showToast(`${ANIMALS[nextTier].emoji} +1 ${ANIMALS[nextTier].label.toLowerCase()}`);
    }
    state.nextThreshold[nextTier] = state.sentTotals[sentType] + randomThreshold();
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
  }

  /* ---------------------------------------------------------------
   * Historique des versions
   * ------------------------------------------------------------- */
  const CHANGELOG = [
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
   * Câblage des écrans
   * ------------------------------------------------------------- */
  document.getElementById("open-profile").addEventListener("click", () => {
    stopChatSubscription();
    stopContactPreviews();
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

  document.getElementById("edit-code").addEventListener("click", () => {
    const next = prompt(
      "Colle ici le code affiché sur ton autre appareil (ex. W-867) pour que celui-ci devienne la même identité.\n\nAttention : tes contacts et ton historique restent propres à cet appareil, seul le code change.",
      state.pseudo
    );
    if (next === null) return;
    const clean = next.trim().toUpperCase();
    if (!clean || clean === state.pseudo) return;
    state.pseudo = clean;
    saveState();
    renderProfile();
    showToast(`Identité changée : ${clean}`);
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

  handleIncomingLink();
  subscribeContactPreviews();
  showScreen("contacts");
})();
