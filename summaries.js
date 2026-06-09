import { getFirestore, collection, query, orderBy, getDocs, enableNetwork } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { collectionName } from "./firebase-config.js";
import { app, requireRole, renderAuthBar } from "./auth-utils.js";

const container = document.getElementById("summaryContainer");
const reloadButton = document.getElementById("reloadResponsesButton");
const dashboardStatus = document.getElementById("dashboardStatus");

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

const caseTitles = {
  case1: "Case Study 1: The Free Game Coins",
  case2: "Case Study 2: The Class Collaboration File",
  case3: "Case Study 3: The New Homework App"
};

function setStatus(message, colour = "#475569") {
  dashboardStatus.textContent = message;
  dashboardStatus.style.color = colour;
}

function escapeHTML(text) {
  if (!text) return "";
  return String(text).replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[match]);
}

function formatDate(timestamp, fallback) {
  if (timestamp && timestamp.toDate) return timestamp.toDate().toLocaleString();
  return fallback || "Just submitted";
}

function withTimeout(promise, milliseconds, message) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function showError(title, message) {
  setStatus("Could not load dashboard.", "#b91c1c");
  container.innerHTML = `
    <div class="error-message">
      <h2>${escapeHTML(title)}</h2>
      <p><strong>Error:</strong> ${escapeHTML(message)}</p>
      <p>Check that you are signed in as a teacher or superadmin, Firebase Authentication is enabled, and the Firestore rules have been deployed.</p>
    </div>
  `;
}

function renderCaseBlock(title, caseKey, caseData) {
  const answer1 = caseData?.q1 || "";
  const answer2 = caseData?.q2 || "";
  const answer3 = caseData?.q3 || "";

  return `
    <div class="response-block">
      <h3>${escapeHTML(title)}</h3>
      <div class="answer-block">
        <p><strong>1. ${escapeHTML(questions[caseKey][0])}</strong></p>
        <p>${escapeHTML(answer1 || "No response")}</p>
      </div>
      <div class="answer-block">
        <p><strong>2. ${escapeHTML(questions[caseKey][1])}</strong></p>
        <p>${escapeHTML(answer2 || "No response")}</p>
      </div>
      <div class="answer-block">
        <p><strong>3. ${escapeHTML(questions[caseKey][2])}</strong></p>
        <p>${escapeHTML(answer3 || "No response")}</p>
      </div>
    </div>
  `;
}

function renderResponse(response, index) {
  return `
    <article class="summary-card">
      <h2>${escapeHTML(response.groupName || `Group ${index + 1}`)}</h2>
      <p><strong>Submitted:</strong> ${escapeHTML(formatDate(response.submittedAt, response.submittedAtLocal))}</p>
      <p><strong>Submitted by:</strong> ${escapeHTML(response.submittedByEmail || "Unknown")}</p>
      ${renderCaseBlock(caseTitles.case1, "case1", response.case1)}
      ${renderCaseBlock(caseTitles.case2, "case2", response.case2)}
      ${renderCaseBlock(caseTitles.case3, "case3", response.case3)}
    </article>
  `;
}

async function loadResponses() {
  try {
    const session = await requireRole(["teacher", "superadmin"]);
    renderAuthBar("authBar", session.user, session.role);
    setStatus("Loading student responses...", "#1d4ed8");

    const db = getFirestore(app);
    await withTimeout(enableNetwork(db), 8000, "Could not connect to Firestore.");

    const q = query(collection(db, collectionName), orderBy("submittedAt", "desc"));
    const snapshot = await withTimeout(getDocs(q), 12000, "Firestore did not return responses after 12 seconds.");
    const responses = snapshot.docs
      .map((docSnapshot) => docSnapshot.data())
      .filter((response) => !response.testDocument);

    if (responses.length === 0) {
      container.innerHTML = '<p class="empty-message">No group responses have been submitted yet.</p>';
      setStatus("No responses found yet. Ask a group to submit from Case Studies, then reload.", "#b91c1c");
      return;
    }

    container.innerHTML = responses.map(renderResponse).join("");
    setStatus(`${responses.length} group response set${responses.length === 1 ? "" : "s"} loaded.`, "#166534");
  } catch (error) {
    console.error(error);
    showError("Could not load student responses", error.message);
  }
}

reloadButton.addEventListener("click", loadResponses);
loadResponses();
