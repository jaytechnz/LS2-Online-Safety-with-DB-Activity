import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  enableNetwork
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, collectionName } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("caseStudyForm");
const clearThisGroup = document.getElementById("clearThisGroup");
const submitButton = document.getElementById("submitButton");
const statusMessage = document.getElementById("statusMessage");

function getAnswer(id) {
  return document.getElementById(id).value.trim();
}

function allAnswersComplete() {
  for (let caseNumber = 1; caseNumber <= 3; caseNumber++) {
    for (let questionNumber = 1; questionNumber <= 3; questionNumber++) {
      if (getAnswer(`case${caseNumber}q${questionNumber}`).length === 0) {
        return false;
      }
    }
  }
  return true;
}

function setStatus(message, colour) {
  statusMessage.textContent = message;
  statusMessage.style.color = colour;
}

function withTimeout(promise, milliseconds) {
  let timeoutId;

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("The Firebase request timed out. This usually means Firestore is blocked, not created, the rules do not allow writing, or the Firebase config is incorrect."));
    }, milliseconds);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function configLooksIncomplete() {
  return Object.values(firebaseConfig).some(value =>
    typeof value !== "string" ||
    value.includes("PASTE_YOUR") ||
    value.trim() === ""
  );
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  if (configLooksIncomplete()) {
    setStatus("Firebase config is incomplete. Open firebase-config.js and replace all placeholder values.", "#b91c1c");
    return;
  }

  const groupName = getAnswer("groupName");

  if (!groupName) {
    setStatus("Please enter a group name.", "#b91c1c");
    return;
  }

  if (!allAnswersComplete()) {
    setStatus("Please answer all three questions for all three case studies.", "#b91c1c");
    return;
  }

  submitButton.disabled = true;
  setStatus("Submitting responses...", "#1d4ed8");

  const responseData = {
    groupName,
    case1: {
      q1: getAnswer("case1q1"),
      q2: getAnswer("case1q2"),
      q3: getAnswer("case1q3")
    },
    case2: {
      q1: getAnswer("case2q1"),
      q2: getAnswer("case2q2"),
      q3: getAnswer("case2q3")
    },
    case3: {
      q1: getAnswer("case3q1"),
      q2: getAnswer("case3q2"),
      q3: getAnswer("case3q3")
    },
    userAgent: navigator.userAgent,
    submittedAt: serverTimestamp(),
    submittedAtLocal: new Date().toLocaleString()
  };

  try {
    await withTimeout(enableNetwork(db), 8000);
    await withTimeout(addDoc(collection(db, collectionName), responseData), 12000);

    setStatus("Responses submitted successfully. Opening summaries page...", "#166534");

    setTimeout(() => {
      window.location.href = "summaries.html";
    }, 700);

  } catch (error) {
    console.error("Firebase submit error:", error);
    setStatus(`Submission failed: ${error.message}`, "#b91c1c");
    submitButton.disabled = false;
  }
});

clearThisGroup.addEventListener("click", function() {
  form.reset();
  setStatus("", "#1f2937");
});
