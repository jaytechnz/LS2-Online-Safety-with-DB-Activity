import { requireRole } from "./auth-utils.js";

requireRole(["student", "teacher", "superadmin"]);
