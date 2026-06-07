import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, collectionName } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("caseStudyForm");
const clearThisGroup = document.getElementById("clearThisGroup");
const submitButton = document.getElementById("submitButton");
const nextButton = document.getElementById("nextButton");
const backButton = document.getElementById("backButton");
const statusMessage = document.getElementById("statusMessage");
const progressText = document.getElementById("progressText");

let currentStep = 1;
const totalSteps = 3;

function showStep(step) {
  document.querySelectorAll(".case-card").forEach(card => card.classList.remove("active"));
  document.querySelector(`[data-step="${step}"]`).classList.add("active");

  progressText.textContent = `Case Study ${step} of ${totalSteps}`;
  backButton.disabled = step === 1;

  if (step === totalSteps) {
    nextButton.style.display = "none";
    submitButton.classList.remove("submit-hidden");
    submitButton.classList.add("submit-visible");
  } else {
    nextButton.style.display = "inline-block";
    submitButton.classList.add("submit-hidden");
    submitButton.classList.remove("submit-visible");
  }

  statusMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentSummaryIsComplete() {
  return document.getElementById(`case${currentStep}`).value.trim().length > 0;
}

nextButton.addEventListener("click", function() {
  if (!currentSummaryIsComplete()) {
    statusMessage.textContent = "Please type your group summary before moving to the next case study.";
    statusMessage.style.color = "#b91c1c";
    return;
  }
  currentStep++;
  showStep(currentStep);
});

backButton.addEventListener("click", function() {
  currentStep--;
  showStep(currentStep);
});

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

    setTimeout(() => {
      window.location.href = "summaries.html";
    }, 800);
  } catch (error) {
    console.error(error);
    statusMessage.textContent = `There was a problem submitting the responses: ${error.message}`;
    statusMessage.style.color = "#b91c1c";
    submitButton.disabled = false;
  }
});

clearThisGroup.addEventListener("click", function() {
  form.reset();
  currentStep = 1;
  showStep(currentStep);
});

showStep(currentStep);
