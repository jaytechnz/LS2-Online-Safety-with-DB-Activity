import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, collectionName } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const container = document.getElementById("summaryContainer");

function escapeHTML(text) {
  if (!text) return "";
  return String(text).replace(/[&<>"']/g, function(match) {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return replacements[match];
  });
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return "Just submitted";
  }
  return timestamp.toDate().toLocaleString();
}

const q = query(collection(db, collectionName), orderBy("submittedAt", "desc"));

onSnapshot(q, function(snapshot) {
  if (snapshot.empty) {
    container.innerHTML = '<p class="empty-message">No group responses have been submitted yet.</p>';
    return;
  }

  container.innerHTML = snapshot.docs.map((doc) => {
    const response = doc.data();

    return `
      <article class="summary-card">
        <h2>${escapeHTML(response.groupName)}</h2>
        <p><strong>Submitted:</strong> ${escapeHTML(formatDate(response.submittedAt))}</p>

        <div class="response-block">
          <h3>Case Study 1: The Free Game Coins</h3>
          <p>${escapeHTML(response.case1)}</p>
        </div>

        <div class="response-block">
          <h3>Case Study 2: The Class Collaboration File</h3>
          <p>${escapeHTML(response.case2)}</p>
        </div>

        <div class="response-block">
          <h3>Case Study 3: The New Homework App</h3>
          <p>${escapeHTML(response.case3)}</p>
        </div>
      </article>
    `;
  }).join("");

}, function(error) {
  console.error(error);
  container.innerHTML = '<p class="empty-message">Could not load responses. Check your Firebase config and Firestore rules.</p>';
});
