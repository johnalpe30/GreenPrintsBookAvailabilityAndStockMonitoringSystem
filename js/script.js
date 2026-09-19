/* =====================================================
   GreenPrints — script.js
   Powers the prototype interface, including the
   Login / Sign Up popup with a client-side-only OTP
   step. No real backend or email service is connected.

   Data validation (Task 6): every field is checked with
   both HTML5 constraint attributes (in index.html) and
   matching JavaScript validators here, so invalid input is
   caught before submission whether or not the browser's
   built-in validation fires. Each field gets its own inline
   error message and a valid/invalid border color.
   ===================================================== */

const INSTITUTIONAL_DOMAIN = "@online.htcgsc.edu.ph";
const INSTITUTIONAL_EMAIL_PATTERN = /^[a-zA-Z0-9_.+-]+@online\.htcgsc\.edu\.ph$/i;
const NAME_PART_PATTERN = /^[A-Za-z '-]+$/;
const SUFFIX_PATTERN = /^[A-Za-z.]+$/;
const OTP_PATTERN = /^[0-9]{6}$/;

// Sample book data, just to preview what the real
// stock-checking feature will look like on screen.
const sampleBooks = [
  { title: "Introduction to Database Systems", subject: "IT 101", status: "in" },
  { title: "Data Structures and Algorithms", subject: "CS 202", status: "low" },
  { title: "Systems Analysis and Design", subject: "IT 305", status: "out" },
];

let currentMode = "login"; // "login" or "signup"

// Turns a status code into a readable label
function getStatusLabel(status) {
  if (status === "in") return "In Stock";
  if (status === "low") return "Low Stock";
  return "Out of Stock";
}

// Builds the preview list inside the stock card
function renderStockPreview() {
  const list = document.getElementById("stockList");
  if (!list) return;

  sampleBooks.forEach((book) => {
    const row = document.createElement("li");
    row.className = "stock-row";

    row.innerHTML = `
      <div>
        <p class="stock-row__title">${book.title}</p>
        <p class="stock-row__subject">${book.subject}</p>
      </div>
      <span class="status-badge status-badge--${book.status}">
        ${getStatusLabel(book.status)}
      </span>
    `;

    list.appendChild(row);
  });
}

/* ---------- Field validators ----------
   Each returns null when the value is valid, or a
   user-facing error message when it isn't. */

const validators = {
  firstName(rawValue) {
    const value = rawValue.trim();
    if (!value) return "First name is required.";
    if (value.length < 2) return "First name must be at least 2 characters.";
    if (value.length > 50) return "First name must be under 50 characters.";
    if (!NAME_PART_PATTERN.test(value)) {
      return "Use letters, spaces, apostrophes, or hyphens only.";
    }
    return null;
  },

  lastName(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Last name is required.";
    if (value.length < 2) return "Last name must be at least 2 characters.";
    if (value.length > 50) return "Last name must be under 50 characters.";
    if (!NAME_PART_PATTERN.test(value)) {
      return "Use letters, spaces, apostrophes, or hyphens only.";
    }
    return null;
  },

  // Optional — only validated if the student actually filled it in.
  middleName(rawValue) {
    const value = rawValue.trim();
    if (!value) return null;
    if (value.length > 50) return "Middle name must be under 50 characters.";
    if (!NAME_PART_PATTERN.test(value)) {
      return "Use letters, spaces, apostrophes, or hyphens only.";
    }
    return null;
  },

  // Optional — only validated if the student actually filled it in.
  suffix(rawValue) {
    const value = rawValue.trim();
    if (!value) return null;
    if (value.length > 10) return "Suffix must be under 10 characters.";
    if (!SUFFIX_PATTERN.test(value)) return "Use letters and periods only (e.g. Jr., III).";
    return null;
  },

  program(value) {
    if (!value) return "Please select your program or course.";
    return null;
  },

  email(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Institutional email is required.";
    if (!INSTITUTIONAL_EMAIL_PATTERN.test(value)) {
      return `Email must be a valid address ending in ${INSTITUTIONAL_DOMAIN}`;
    }
    return null;
  },

  otpCode(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Verification code is required.";
    if (!OTP_PATTERN.test(value)) return "Enter the 6-digit numeric code sent to your email.";
    return null;
  },
};

/* ---------- Field validation UI helpers ---------- */

// Fields wired up for live validation: [inputId, errorId, validatorKey]
const AUTH_FIELDS = [
  ["firstName", "firstNameError", "firstName"],
  ["middleName", "middleNameError", "middleName"],
  ["lastName", "lastNameError", "lastName"],
  ["suffix", "suffixError", "suffix"],
  ["program", "programError", "program"],
  ["email", "emailError", "email"],
];
const OTP_FIELDS = [["otpCode", "otpError", "otpCode"]];

function setFieldState(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  if (!input || !errorEl) return true;

  if (message) {
    input.classList.add("input-invalid");
    input.classList.remove("input-valid");
    errorEl.textContent = message;
    return false;
  }

  input.classList.remove("input-invalid");
  input.classList.add("input-valid");
  errorEl.textContent = "";
  return true;
}

function clearFieldState(inputId, errorId) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  if (input) input.classList.remove("input-invalid", "input-valid");
  if (errorEl) errorEl.textContent = "";
}

function validateField(inputId, errorId, validatorKey) {
  const input = document.getElementById(inputId);
  const message = validators[validatorKey](input.value);
  return setFieldState(inputId, errorId, message);
}

// Wires live validation (as-you-type + on blur) for a set of fields.
function attachLiveValidation(fields) {
  fields.forEach(([inputId, errorId, validatorKey]) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    const revalidate = () => validateField(inputId, errorId, validatorKey);
    input.addEventListener("blur", revalidate);
    input.addEventListener("input", revalidate);
    input.addEventListener("change", revalidate);
  });
}

/* ---------- Modal open / close ---------- */

function openModal() {
  document.getElementById("modalOverlay").classList.add("modal-overlay--open");
  resetModal();
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("modal-overlay--open");
}

function resetModal() {
  // Always land back on the login tab and the form step
  setMode("login");
  showStep("form");
  document.getElementById("authForm").reset();
  document.getElementById("otpForm").reset();
  AUTH_FIELDS.forEach(([inputId, errorId]) => clearFieldState(inputId, errorId));
  OTP_FIELDS.forEach(([inputId, errorId]) => clearFieldState(inputId, errorId));
}

function showStep(step) {
  document.getElementById("stepForm").classList.toggle("modal__step--hidden", step !== "form");
  document.getElementById("stepOtp").classList.toggle("modal__step--hidden", step !== "otp");
}

/* ---------- Tab switching ---------- */

function setMode(mode) {
  currentMode = mode;

  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  tabLogin.classList.toggle("modal__tab--active", mode === "login");
  tabSignup.classList.toggle("modal__tab--active", mode === "signup");

  document.getElementById("fieldNameGroup").classList.toggle("signup-only--visible", mode === "signup");
  document.getElementById("fieldProgram").classList.toggle("signup-only--visible", mode === "signup");

  // Sign Up-only fields don't apply on the Log In tab — clear any
  // leftover error state from them so it doesn't linger out of view.
  if (mode === "login") {
    clearFieldState("firstName", "firstNameError");
    clearFieldState("middleName", "middleNameError");
    clearFieldState("lastName", "lastNameError");
    clearFieldState("suffix", "suffixError");
    clearFieldState("program", "programError");
  }
}

/* ---------- Form submission ---------- */

function handleFormSubmit(event) {
  event.preventDefault();

  const fieldsToCheck = currentMode === "signup" ? AUTH_FIELDS : [["email", "emailError", "email"]];

  let firstInvalidInput = null;
  let allValid = true;

  fieldsToCheck.forEach(([inputId, errorId, validatorKey]) => {
    const isValid = validateField(inputId, errorId, validatorKey);
    if (!isValid) {
      allValid = false;
      if (!firstInvalidInput) firstInvalidInput = document.getElementById(inputId);
    }
  });

  if (!allValid) {
    firstInvalidInput.focus();
    return;
  }

  const email = document.getElementById("email").value.trim();
  document.getElementById("otpEmailDisplay").textContent = email;
  showStep("otp");
}

function handleOtpSubmit(event) {
  event.preventDefault();

  const isValid = validateField("otpCode", "otpError", "otpCode");
  if (!isValid) {
    document.getElementById("otpCode").focus();
    return;
  }

  // Prototype only — no real verification service is connected yet.
  // Once verified, take the student straight to their dashboard.
  const email = document.getElementById("otpEmailDisplay").textContent;
  const firstName = document.getElementById("firstName").value.trim();
  const middleName = document.getElementById("middleName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const suffix = document.getElementById("suffix").value.trim();
  const program = document.getElementById("program").value;
  const programLabel = program
    ? document.querySelector(`#program option[value="${program}"]`).textContent
    : "";

  // Composed for display only — the underlying Student record keeps
  // these as separate atomic columns (FirstName, MiddleName, LastName, Suffix).
  const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(" ");

  sessionStorage.setItem("gp_student_email", email);
  if (firstName) {
    sessionStorage.setItem("gp_student_fullName", fullName);
    sessionStorage.setItem("gp_student_firstName", firstName);
    sessionStorage.setItem("gp_student_middleName", middleName);
    sessionStorage.setItem("gp_student_lastName", lastName);
    sessionStorage.setItem("gp_student_suffix", suffix);
    sessionStorage.setItem("gp_student_program", programLabel);
  }
  closeModal();
  window.location.href = "dashboard.html";
}

/* ---------- Wiring everything up ---------- */

function setupModal() {
  const buttonIds = ["getStartedTop", "getStartedHero", "getStartedCta"];
  buttonIds.forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.addEventListener("click", openModal);
  });

  document.getElementById("modalClose").addEventListener("click", closeModal);

  // Clicking the dark overlay itself (not the modal box) also closes it
  document.getElementById("modalOverlay").addEventListener("click", (event) => {
    if (event.target.id === "modalOverlay") closeModal();
  });

  document.getElementById("tabLogin").addEventListener("click", () => setMode("login"));
  document.getElementById("tabSignup").addEventListener("click", () => setMode("signup"));

  document.getElementById("authForm").addEventListener("submit", handleFormSubmit);
  document.getElementById("otpForm").addEventListener("submit", handleOtpSubmit);

  document.getElementById("backToForm").addEventListener("click", () => showStep("form"));
  document.getElementById("resendCode").addEventListener("click", () => {
    alert("This is a prototype. A new code would be sent to your email in a later version.");
  });

  attachLiveValidation(AUTH_FIELDS);
  attachLiveValidation(OTP_FIELDS);
}

document.addEventListener("DOMContentLoaded", () => {
  renderStockPreview();
  setupModal();
});