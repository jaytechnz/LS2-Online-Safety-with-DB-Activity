import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, collectionName } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("caseStudyForm");
const clearThisGroup = document.getElementById("clearThisGroup");
const submitButton = document.getElementById("submitButton");
const statusMessage = document.getElementById("statusMessage");

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  const groupName = document.getElementById("groupName").value.trim();
  const case1 = document.getElementById("case1").value.trim();
  const case2 = document.getElementById("case2").value.trim();
  const case3 = document.getElementById("case3").value.trim();

  if (!groupName || !case1 || !case2 || !case3) {
    statusMessage.textContent = "Please enter a group name and complete all three summaries.";
    statusMessage.style.color = "#b91c1c";
    return;
  }

  submitButton.disabled = true;
  statusMessage.textContent = "Submitting responses...";
  statusMessage.style.color = "#1d4ed8";

  try {
    await addDoc(collection(db, collectionName), {
      groupName,
      case1,
      case2,
      case3,
      submittedAt: serverTimestamp()
    });

    statusMessage.textContent = "Responses submitted successfully.";
    statusMessage.style.color = "#166534";
    form.reset();

    setTimeout(() => {
      window.location.href = "summaries.html";
    }, 800);

  } catch (error) {
    console.error(error);
    statusMessage.textContent = "There was a problem submitting the responses. Check your Firebase config and Firestore rules.";
    statusMessage.style.color = "#b91c1c";
    submitButton.disabled = false;
  }
});

clearThisGroup.addEventListener("click", function() {
  form.reset();
  statusMessage.textContent = "";
});
