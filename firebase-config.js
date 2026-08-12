/* -------------------------------------------------------------------
 * Config Firebase — PAS des secrets. Ces valeurs sont publiques par
 * design (elles finissent de toute façon dans le JS envoyé au
 * navigateur) : la vraie sécurité vient des règles Firestore, pas de
 * la confidentialité de ces clés. Rien de grave à les committer.
 *
 * Tant que les valeurs ci-dessous ne sont pas remplacées, l'appli
 * tourne en mode démo local (pas de synchro entre appareils).
 *
 * Pour les remplacer : Console Firebase → ⚙️ Paramètres du projet →
 * "Vos applications" → l'app Web → objet de config affiché.
 * ------------------------------------------------------------- */
window.FIREBASE_CONFIG = {
  apiKey: "REMPLACE_MOI",
  authDomain: "REMPLACE_MOI.firebaseapp.com",
  projectId: "REMPLACE_MOI",
  storageBucket: "REMPLACE_MOI.appspot.com",
  messagingSenderId: "REMPLACE_MOI",
  appId: "REMPLACE_MOI",
};
