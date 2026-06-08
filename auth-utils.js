import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { firebaseConfig, superAdminEmail } from "./firebase-config.js";

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export function getRole(email) {
  const normalised = String(email || "").trim().toLowerCase();
  if (normalised === superAdminEmail) return "superadmin";
  if (/^[a-z]+(\.[a-z]+)+@student\.cga\.school$/i.test(normalised)) return "student";
  if (/^[a-z]\.[a-z]+@cga\.school$/i.test(normalised)) return "teacher";
  return null;
}

export function requireRole(allowedRoles) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      const role = user ? getRole(user.email) : null;
      if (!user || !role || !allowedRoles.includes(role)) {
        const next = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
        window.location.href = `login.html?next=${next}`;
        return;
      }
      resolve({ user, role });
    });
  });
}

export function renderAuthBar(targetId, user, role) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const dashboardLink = role === "student" ? "" : '<a class="button secondary" href="summaries.html">Teacher Dashboard</a>';
  target.innerHTML = `
    <span><strong>Signed in:</strong> ${user.email} (${role})</span>
    ${dashboardLink}
    <button type="button" class="secondary" id="signOutButton">Sign out</button>
  `;
  document.getElementById("signOutButton").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}
