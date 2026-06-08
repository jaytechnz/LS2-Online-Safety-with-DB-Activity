import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { collectionName } from "./firebase-config.js";
import { app, requireRole, renderAuthBar } from "./auth-utils.js";

const db = getFirestore(app);
const runTest = document.getElementById("runTest");
const testStatus = document.getElementById("testStatus");

function setStatus(message, colour) {
  testStatus.textContent = message;
  testStatus.style.color = colour;
}

function withTimeout(promise, milliseconds) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Firebase timed out. The request did not complete.")), milliseconds);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

async function initialisePage() {
  const session = await requireRole(["teacher", "superadmin"]);
  renderAuthBar("authBar", session.user, session.role);
  setStatus("Signed in. Ready to test Firestore.", "#166534");
}

runTest.addEventListener("click", async function() {
  runTest.disabled = true;

  try {
    setStatus("Writing test document to Firestore...", "#1d4ed8");
    const docRef = await withTimeout(addDoc(collection(db, collectionName), {
      groupName: "Firebase Test",
      case1: { q1: "Test write", q2: "Test write", q3: "Test write" },
      case2: { q1: "Test write", q2: "Test write", q3: "Test write" },
      case3: { q1: "Test write", q2: "Test write", q3: "Test write" },
      submittedAt: serverTimestamp(),
      submittedAtLocal: new Date().toLocaleString(),
      testDocument: true
    }), 12000);

    setStatus("Reading test document back from Firestore...", "#1d4ed8");
    const savedDoc = await withTimeout(getDoc(docRef), 12000);

    if (!savedDoc.exists()) {
      throw new Error("The test document was written but could not be read back.");
    }

    setStatus("Success: authenticated Firestore write and read both worked.", "#166534");
  } catch (error) {
    console.error(error);
    setStatus(`Test failed: ${error.message}`, "#b91c1c");
  }

  runTest.disabled = false;
});

initialisePage();
