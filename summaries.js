import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  enableNetwork
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, collectionName } from "./firebase-config.js";

const container = document.getElementById("summaryContainer");

const questions = {
  case1: [
    "What warning signs can you spot?",
    "What private information is being asked for?",
    "What should Maya do next?"
  ],
  case2: [
    "Why might this be a privacy problem?",
    "What should the student do after noticing the mistake?",
    "How could the class avoid this happening again?"
  ],
  case3: [
    "Which information is unnecessary or too private?",
    "What could Noah do before signing up?",
    "What makes a website or app safer to use?"
  ]
};

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

function formatDate(timestamp, fallback) {
  if (timestamp && timestamp.toDate) return timestamp.toDate().toLocaleString();
  return fallback || "Just submitted";
}

function showError(title, message) {
  container.innerHTML = `
    <div class="error-message">
      <h2>${escapeHTML(title)}</h2>
      <p><strong>Error:</strong> ${escapeHTML(message)}</p>
      <p>Check that:</p>
      <ul>
        <li>your Firebase config has been pasted into <strong>firebase-config.js</strong></li>
        <li>Firestore Database has been created, not just Realtime Database</li>
        <li>your Firestore rules allow <strong>create</strong> and <strong>read</strong> for this activity</li>
        <li>the site is being loaded from a web server, not opened directly as a file</li>
        <li>your school network is not blocking Firebase/Google APIs</li>
      </ul>
      <p>Open <strong>firebase-test.html</strong> to run a simple connection test.</p>
    </div>
  `;
}

function configLooksIncomplete() {
  return Object.values(firebaseConfig).some(value =>
    typeof value !== "string" ||
    value.includes("PASTE_YOUR") ||
    value.trim() === ""
  );
}

function renderCaseBlock(title, caseKey, caseData) {
  const answer1 = caseData?.q1 || caseData || "";
  const answer2 = caseData?.q2 || "";
  const answer3 = caseData?.q3 || "";

  return `
    <div class="response-block">
      <h3>${escapeHTML(title)}</h3>

      <div class="answer-block">
        <p><strong>1. ${escapeHTML(questions[caseKey][0])}</strong></p>
        <p>${escapeHTML(answer1)}</p>
      </div>

      <div class="answer-block">
        <p><strong>2. ${escapeHTML(questions[caseKey][1])}</strong></p>
        <p>${escapeHTML(answer2)}</p>
      </div>

      <div class="answer-block">
        <p><strong>3. ${escapeHTML(questions[caseKey][2])}</strong></p>
        <p>${escapeHTML(answer3)}</p>
      </div>
    </div>
  `;
}

try {
  if (configLooksIncomplete()) {
    throw new Error("Firebase config still contains placeholder values.");
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const loadingTimer = setTimeout(() => {
    showError(
      "Still waiting for Firebase",
      "The summaries page has not received a response from Firestore after 12 seconds."
    );
  }, 12000);

  await enableNetwork(db);

  const q = query(collection(db, collectionName), orderBy("submittedAt", "desc"));

  onSnapshot(q, function(snapshot) {
    clearTimeout(loadingTimer);

    if (snapshot.empty) {
      container.innerHTML = '<p class="empty-message">Firebase is connected, but no group responses have been submitted yet.</p>';
      return;
    }

    container.innerHTML = snapshot.docs.map((doc) => {
      const response = doc.data();

      return `
        <article class="summary-card">
          <h2>${escapeHTML(response.groupName)}</h2>
          <p><strong>Submitted:</strong> ${escapeHTML(formatDate(response.submittedAt, response.submittedAtLocal))}</p>
          ${renderCaseBlock("Case Study 1: The Free Game Coins", "case1", response.case1)}
          ${renderCaseBlock("Case Study 2: The Class Collaboration File", "case2", response.case2)}
          ${renderCaseBlock("Case Study 3: The New Homework App", "case3", response.case3)}
        </article>
      `;
    }).join("");
  }, function(error) {
    clearTimeout(loadingTimer);
    console.error(error);
    showError("Could not load Firebase responses", error.message);
  });
} catch (error) {
  console.error(error);
  showError("Firebase setup error", error.message);
}
