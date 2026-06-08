import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { firebaseConfig, superAdminEmail } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const createAccountButton = document.getElementById("createAccountButton");
const signInButton = document.getElementById("signInButton");
const loginStatus = document.getElementById("loginStatus");

function getNextUrl(role) {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next) return next;
  return role === "student" ? "case-studies.html" : "summaries.html";
}

function getRole(email) {
  const normalised = String(email || "").trim().toLowerCase();
  if (normalised === superAdminEmail) return "superadmin";
  if (/^[a-z]+(\.[a-z]+)+@student\.cga\.school$/i.test(normalised)) return "student";
  if (/^[a-z]\.[a-z]+@cga\.school$/i.test(normalised)) return "teacher";
  return null;
}

function setStatus(message, colour = "#475569") {
  loginStatus.textContent = message;
  loginStatus.style.color = colour;
}

function validateEmail() {
  const email = emailInput.value.trim().toLowerCase();
  const role = getRole(email);
  if (!role) {
    throw new Error("Use a CGA student email like firstname.lastname@student.cga.school or a teacher email like j.smith@cga.school.");
  }
  return { email, role };
}

async function handleAuth(mode) {
  const { email, role } = validateEmail();
  const password = passwordInput.value;

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  signInButton.disabled = true;
  createAccountButton.disabled = true;
  setStatus(mode === "create" ? "Creating account..." : "Signing in...", "#1d4ed8");

  if (mode === "create") {
    await createUserWithEmailAndPassword(auth, email, password);
  } else {
    await signInWithEmailAndPassword(auth, email, password);
  }

  setStatus("Signed in. Opening your activity...", "#166534");
  window.location.href = getNextUrl(role);
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();
  try {
    await handleAuth("sign-in");
  } catch (error) {
    signInButton.disabled = false;
    createAccountButton.disabled = false;
    setStatus(error.message, "#b91c1c");
  }
});

createAccountButton.addEventListener("click", async function() {
  try {
    await handleAuth("create");
  } catch (error) {
    signInButton.disabled = false;
    createAccountButton.disabled = false;
    setStatus(error.message, "#b91c1c");
  }
});

onAuthStateChanged(auth, function(user) {
  if (!user) return;
  const role = getRole(user.email);
  if (role) {
    setStatus(`Already signed in as ${user.email}.`, "#166534");
  }
});
