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

  const ANIMALS = {
    mouton:    { label: "Mouton",     color: "#f4ede0", tier: 0 },
    crocodile: { label: "Crocodile",  color: "#5c8a53", tier: 1, emoji: "🐊" },
    lion:      { label: "Lion",       color: "#d9a441", tier: 2, emoji: "🦁" },
    licorne:   { label: "Licorne",    color: "#b98fd6", tier: 3, emoji: "🦄" },
    rhino:     { label: "Rhinocéros", color: "#8a8f99", tier: 4, emoji: "🦏" },
  };
  const TIER_ORDER = ["mouton", "crocodile", "lion", "licorne", "rhino"];

  function iconMarkup(type) {
    return type === "mouton" ? SHEEP_SVG : `<span class="emoji">${ANIMALS[type].emoji}</span>`;
  }

  /* ---------------------------------------------------------------
   * État — tout en local pour cette maquette (pas de backend).
   * Le seuil de déblocage du crocodile est tiré au hasard à chaque
   * fois dans une petite plage, pour illustrer le principe de ratio
   * variable sans obliger quiconque à cliquer 2000 fois pour tester.
   * ------------------------------------------------------------- */
  function randomThreshold() {
    return 8 + Math.floor(Math.random() * 7); // 8 à 14
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

  function loadState() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* stockage indisponible */ }
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* état corrompu, on repart à zéro */ }
    }
    return {
      pseudo: randomCode(),
      since: Date.now(),
      stock: { crocodile: 0, lion: 0, licorne: 0, rhino: 0 },
      sentTotals: { mouton: 0, crocodile: 0, lion: 0, licorne: 0, rhino: 0 },
      nextCrocodileThreshold: randomThreshold(),
      crocodileUnlocked: false,
      contacts: seedContacts(),
    };
  }

  let state = loadState();

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* tant pis pour cette session */ }
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

  function renderContacts() {
    const list = document.getElementById("contacts-list");
    list.innerHTML = "";
    state.contacts.forEach((c) => {
      const last = c.history[c.history.length - 1];
      const btn = document.createElement("button");
      btn.className = "contact-item";
      btn.innerHTML = `
        <span class="contact-avatar" style="background:${c.color}">${c.code.slice(0, 1)}</span>
        <span class="contact-meta">
          <p class="contact-code">${c.code}</p>
          <span class="contact-preview">
            ${last ? `<span class="contact-preview-icon">${last.animal === "mouton" ? "🐑" : ANIMALS[last.animal].emoji}</span><span>${timeAgo(last.ts)}</span>` : "<span>Aucun échange pour l'instant</span>"}
          </span>
        </span>`;
      btn.addEventListener("click", () => openChat(c.id));
      list.appendChild(btn);
    });
  }

  /* ---------------------------------------------------------------
   * Écran discussion
   * ------------------------------------------------------------- */
  function openChat(contactId) {
    activeContactId = contactId;
    const c = state.contacts.find((x) => x.id === contactId);
    document.getElementById("chat-avatar").textContent = c.code.slice(0, 1);
    document.getElementById("chat-avatar").style.background = c.color;
    document.getElementById("chat-code").textContent = c.code;
    renderChatBubbles();
    renderSenderRow();
    showScreen("chat");
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
        <span class="bubble-time">${timeAgo(m.ts)}</span>`;
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

  function renderSenderRow() {
    const row = document.getElementById("sender-row");
    row.innerHTML = "";

    const sheepBtn = document.createElement("button");
    sheepBtn.className = "animal-btn primary";
    sheepBtn.setAttribute("aria-label", "Envoyer un mouton");
    sheepBtn.innerHTML = SHEEP_SVG;
    sheepBtn.addEventListener("click", () => sendAnimal("mouton"));
    row.appendChild(sheepBtn);

    if (state.crocodileUnlocked) {
      const crocBtn = document.createElement("button");
      crocBtn.className = "animal-btn secondary crocodile";
      crocBtn.setAttribute("aria-label", "Envoyer un crocodile");
      crocBtn.innerHTML = `${ANIMALS.crocodile.emoji}<span class="stock-badge">${state.stock.crocodile}</span>`;
      crocBtn.addEventListener("click", () => sendAnimal("crocodile"));
      row.appendChild(crocBtn);
    }

    ["lion", "licorne", "rhino"].forEach((type) => {
      const lockBtn = document.createElement("button");
      lockBtn.className = "animal-btn locked";
      lockBtn.setAttribute("aria-label", `${ANIMALS[type].label} — pas encore débloqué`);
      lockBtn.title = `${ANIMALS[type].label} — pas encore débloqué`;
      lockBtn.innerHTML = `${ANIMALS[type].emoji}<span class="lock-mark">🔒</span>`;
      row.appendChild(lockBtn);
    });

    renderProgress();
  }

  function renderProgress() {
    const p = document.getElementById("sender-progress");
    if (!state.crocodileUnlocked) {
      const ratio = Math.min(1, state.sentTotals.mouton / state.nextCrocodileThreshold);
      p.textContent = "🐑 le crocodile approche…";
      p.style.background = `linear-gradient(90deg, var(--accent) ${Math.round(ratio * 100)}%, transparent 0)`;
    } else {
      p.textContent = state.stock.crocodile > 0
        ? "🐊 crocodiles en stock"
        : "🐊 stock épuisé — de nouveaux arrivent en continuant d'envoyer des moutons";
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

    const c = state.contacts.find((x) => x.id === activeContactId);
    c.history.push({ dir: "out", animal: type, ts: Date.now() });

    if (type === "mouton") checkCrocodileUnlock();

    saveState();
    renderChatBubbles();
    renderSenderRow();
  }

  function checkCrocodileUnlock() {
    if (state.sentTotals.mouton < state.nextCrocodileThreshold) return;

    if (!state.crocodileUnlocked) {
      state.crocodileUnlocked = true;
      state.stock.crocodile += 2;
      showToast("🐊 Crocodile débloqué !");
    } else {
      state.stock.crocodile += 1;
      showToast("🐊 +1 crocodile");
    }
    state.nextCrocodileThreshold = state.sentTotals.mouton + randomThreshold();
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

    const grid = document.getElementById("badge-grid");
    grid.innerHTML = "";
    TIER_ORDER.forEach((type) => {
      const count = state.sentTotals[type];
      const locked = type !== "mouton" && count === 0;
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
    renderProfile();
    showScreen("profile");
  });
  document.getElementById("back-to-contacts").addEventListener("click", () => {
    renderContacts();
    showScreen("contacts");
  });
  document.getElementById("back-to-contacts-from-profile").addEventListener("click", () => {
    renderContacts();
    showScreen("contacts");
  });

  document.querySelectorAll(".app-title-mouton").forEach((el) => {
    el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(SHEEP_SVG)}")`;
  });

  renderContacts();
  showScreen("contacts");
})();
