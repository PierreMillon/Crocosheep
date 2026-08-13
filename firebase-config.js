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
  apiKey: "AIzaSyA4q_Elzmhv8xHiyF-q8wntOoNcmY1NHNc",
  authDomain: "crocosheep-test.firebaseapp.com",
  projectId: "crocosheep-test",
  storageBucket: "crocosheep-test.firebasestorage.app",
  messagingSenderId: "558991811832",
  appId: "1:558991811832:web:89fe9e40a88ecee41b070d",
};
