import { requireRole, renderAuthBar } from "./auth-utils.js";

const container = document.getElementById("summaryContainer");
const pdfButton = document.getElementById("printPdfButton");
const reloadButton = document.getElementById("reloadResponsesButton");
const pdfStatus = document.getElementById("pdfStatus");

let loadedResponses = [];

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
  if (!pdfStatus) return;
  pdfStatus.textContent = message;
  pdfStatus.style.color = colour;
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
  loadedResponses = [];
  if (pdfButton) pdfButton.disabled = true;
  setStatus("PDF unavailable until responses load.", "#b91c1c");
  container.innerHTML = `
    <div class="error-message">
      <h2>${escapeHTML(title)}</h2>
      <p><strong>Error:</strong> ${escapeHTML(message)}</p>
      <p>Check that Firebase Auth is enabled, Firestore rules are deployed, and the current account is a CGA teacher or superadmin.</p>
      <p>Superadmin: <strong>j.smith@cga.school</strong></p>
    </div>
  `;
}

function configLooksIncomplete(firebaseConfig) {
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

function renderResponse(response) {
  return `
    <article class="summary-card">
      <h2>${escapeHTML(response.groupName)}</h2>
      <p><strong>Submitted:</strong> ${escapeHTML(formatDate(response.submittedAt, response.submittedAtLocal))}</p>
      <p><strong>Submitted by:</strong> ${escapeHTML(response.submittedByEmail || "Unknown")}</p>
      ${renderCaseBlock(caseTitles.case1, "case1", response.case1)}
      ${renderCaseBlock(caseTitles.case2, "case2", response.case2)}
      ${renderCaseBlock(caseTitles.case3, "case3", response.case3)}
    </article>
  `;
}

function normalisePdfText(text) {
  return String(text || "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function wrapText(text, maxLength = 92) {
  const words = normalisePdfText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function pdfEscape(text) {
  return normalisePdfText(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdfLines() {
  const lines = ["Online Safety and Privacy - Teacher Dashboard Responses", ""];

  loadedResponses.forEach((response, index) => {
    if (index > 0) lines.push("", "----------------------------------------", "");
    lines.push(response.groupName || `Group ${index + 1}`);
    lines.push(`Submitted: ${formatDate(response.submittedAt, response.submittedAtLocal)}`);
    lines.push(`Submitted by: ${response.submittedByEmail || "Unknown"}`);

    ["case1", "case2", "case3"].forEach((caseKey) => {
      const caseData = response[caseKey] || {};
      lines.push("", caseTitles[caseKey]);
      questions[caseKey].forEach((question, questionIndex) => {
        const answer = caseData[`q${questionIndex + 1}`] || "No response";
        lines.push(`${questionIndex + 1}. ${question}`);
        wrapText(answer).forEach((line) => lines.push(`   ${line}`));
      });
    });
  });

  return lines;
}

function createPdfBlob(lines) {
  const pageHeight = 792;
  const pageWidth = 612;
  const marginTop = 42;
  const marginLeft = 42;
  const lineHeight = 13;
  const linesPerPage = Math.floor((pageHeight - 84) / lineHeight);
  const pages = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];

  pages.forEach((pageLines) => {
    const textLines = pageLines.map((line, index) => {
      const y = pageHeight - marginTop - index * lineHeight;
      return `BT /F1 10 Tf ${marginLeft} ${y} Td (${pdfEscape(line)}) Tj ET`;
    }).join("\n");
    const contentId = addObject(`<< /Length ${textLines.length} >>\nstream\n${textLines}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((content, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadResponsesPdf() {
  if (loadedResponses.length === 0) {
    setStatus("No student submissions have loaded yet, so there is nothing to save as PDF.", "#b91c1c");
    return;
  }
  const blob = createPdfBlob(buildPdfLines());
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "online-safety-student-responses.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`Downloaded PDF with ${loadedResponses.length} student response set${loadedResponses.length === 1 ? "" : "s"}.`, "#166534");
}

async function loadResponses() {
  if (pdfButton) pdfButton.disabled = true;
  try {
    const session = await requireRole(["teacher", "superadmin"]);
    renderAuthBar("authBar", session.user, session.role);

    setStatus("Loading Firebase config...", "#1d4ed8");
    const configModule = await withTimeout(
      import("./firebase-config.js"),
      8000,
      "Could not load firebase-config.js."
    );

    const { firebaseConfig, collectionName } = configModule;
    if (!firebaseConfig || !collectionName) {
      throw new Error("firebase-config.js must export firebaseConfig and collectionName.");
    }
    if (configLooksIncomplete(firebaseConfig)) {
      throw new Error("firebase-config.js still contains placeholder or blank values.");
    }

    setStatus("Loading Firebase libraries...", "#1d4ed8");
    const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js");

    const db = firestoreModule.getFirestore((await import("./auth-utils.js")).app);
    await withTimeout(
      firestoreModule.enableNetwork(db),
      8000,
      "Could not connect to Firestore. Check network access and Firebase setup."
    );

    const q = firestoreModule.query(
      firestoreModule.collection(db, collectionName),
      firestoreModule.orderBy("submittedAt", "desc")
    );

    setStatus("Reading student submissions from Firestore...", "#1d4ed8");
    const snapshot = await withTimeout(
      firestoreModule.getDocs(q),
      12000,
      "Firestore did not return responses after 12 seconds. Check rules, project ID, and collection name."
    );

    loadedResponses = snapshot.docs
      .map((docSnapshot) => docSnapshot.data())
      .filter((response) => !response.testDocument);

    if (loadedResponses.length === 0) {
      container.innerHTML = '<p class="empty-message">Firebase is connected, but no student responses have been submitted yet.</p>';
      setStatus("No student responses found yet.", "#b91c1c");
      return;
    }

    container.innerHTML = loadedResponses.map(renderResponse).join("");
    if (pdfButton) pdfButton.disabled = false;
    setStatus(`${loadedResponses.length} student response set${loadedResponses.length === 1 ? "" : "s"} loaded. PDF download is ready.`, "#166534");
  } catch (error) {
    console.error(error);
    showError("Could not load student responses", error.message);
  }
}

if (pdfButton) {
  pdfButton.disabled = true;
  pdfButton.addEventListener("click", downloadResponsesPdf);
}

if (reloadButton) {
  reloadButton.addEventListener("click", loadResponses);
}

loadResponses();
