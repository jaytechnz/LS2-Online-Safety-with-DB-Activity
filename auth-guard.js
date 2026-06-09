import { requireRole } from "./auth-utils.js";

function goToLogin() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  window.location.href = `login.html?next=${encodeURIComponent(page)}`;
}

const fallbackTimer = setTimeout(goToLogin, 5000);

requireRole(["student", "teacher", "superadmin"])
  .then(() => clearTimeout(fallbackTimer))
  .catch(() => {
    clearTimeout(fallbackTimer);
    goToLogin();
  });
