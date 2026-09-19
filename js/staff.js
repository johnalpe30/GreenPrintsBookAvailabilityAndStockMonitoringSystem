/* =====================================================
   GreenPrints — staff.js
   Powers the staff login, the Add a Book form, the Current
   Stocks table (with an Edit popup for updating existing
   titles in place), and the Registered Students table.
   Prototype only: staff auth is a seeded username/password
   pair (staff manage the system, so they get a password —
   students stay passwordless via email + OTP). Book and
   student data are held in memory and reset on reload.

   Books here map directly onto the Book table (BookID, Title,
   Author, Edition, Subject, Price, Quantity) from the
   normalization report. Students map onto the Student table
   (StudentID, StudentName, Institutional_Email, Program).

   Data validation (Task 6): the Staff Log In form, the Add a
   Book form, and the Edit Book popup are all checked with
   HTML5 constraint attributes (in staff-login.html /
   staff-dashboard.html) and matching JavaScript validators
   here — one inline error per field, plus a valid/invalid
   border color, same pattern as the student Login/Sign Up
   forms.
   ===================================================== */

const STATIC_STAFF_ACCOUNTS = [
  { username: "adminstaff", password: "oneadminstaff1" },
];

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
const BOOK_AUTHOR_PATTERN = /^[A-Za-z .,'-]+$/;
const BOOK_EDITION_PATTERN = /^[A-Za-z0-9. ]+$/;
const BOOK_SUBJECT_PATTERN = /^[A-Za-z]{2,10}[0-9]{2,4}$/;

// Book table — same starting catalog as the student dashboard,
// but mutable here since staff can add, edit, and (eventually)
// restock these rows.
const books = [
  { id: "B010", title: "Introduction to Database Systems", author: "Elmasri", edition: "7th Ed.", subject: "IT101", price: 850, quantity: 58 },
  { id: "B015", title: "Data Structures and Algorithms", author: "Cormen", edition: "3rd Ed.", subject: "CS202", price: 920, quantity: 6 },
  { id: "B022", title: "Systems Analysis and Design", author: "Kendall", edition: "9th Ed.", subject: "IT305", price: 780, quantity: 0 },
  { id: "B031", title: "Principles of Marketing", author: "Kotler", edition: "17th Ed.", subject: "BSBA201", price: 995, quantity: 22 },
  { id: "B037", title: "Financial Accounting", author: "Weygandt", edition: "12th Ed.", subject: "BSA110", price: 1050, quantity: 0 },
  { id: "B042", title: "Child and Adolescent Development", author: "Santrock", edition: "6th Ed.", subject: "BSED150", price: 690, quantity: 4 },
  { id: "B048", title: "Front Office Operations", author: "Bardi", edition: "5th Ed.", subject: "BSHM120", price: 610, quantity: 15 },
  { id: "B053", title: "Object-Oriented Programming", author: "Deitel", edition: "11th Ed.", subject: "CS210", price: 875, quantity: 0 },
  { id: "B061", title: "Human-Computer Interaction", author: "Preece", edition: "4th Ed.", subject: "IT330", price: 730, quantity: 9 },
  { id: "B067", title: "Managerial Economics", author: "Mankiw", edition: "8th Ed.", subject: "BSBA240", price: 860, quantity: 31 },
  { id: "B072", title: "Fundamentals of Nursing", author: "Kozier", edition: "10th Ed.", subject: "BSN100", price: 1200, quantity: 12 },
  { id: "B079", title: "Educational Psychology", author: "Woolfolk", edition: "13th Ed.", subject: "BSED210", price: 705, quantity: 3 },
];
let bookIdCounter = 80;

// Student table — sample registered students.
const registeredStudents = [
  { fullName: "Juan Dela Cruz", email: "juandelacruz@online.htcgsc.edu.ph", program: "BS Information Technology" },
  { fullName: "John Alpe Olaer", email: "2024_cete_olaerjohn@online.htcgsc.edu.ph", program: "BS Computer Science" },
  { fullName: "Maria Santos", email: "mariasantos@online.htcgsc.edu.ph", program: "BS Business Administration" },
  { fullName: "Angelica Reyes", email: "angelicareyes@online.htcgsc.edu.ph", program: "BS Education" },
  { fullName: "Mark Villanueva", email: "markvillanueva@online.htcgsc.edu.ph", program: "BS Hospitality Management" },
  { fullName: "Kristine Bautista", email: "kristinebautista@online.htcgsc.edu.ph", program: "BS Accountancy" },
];

let bookSearchTerm = "";
let studentSearchTerm = "";

/* ---------- Stock status helpers ---------- */

function getStatus(quantity) {
  if (quantity <= 0) return "out";
  if (quantity < 10) return "low";
  return "in";
}

function getStatusLabel(status) {
  if (status === "in") return "In Stock";
  if (status === "low") return "Low Stock";
  return "Out of Stock";
}

/* ---------- Shared field validation UI helpers ----------
   Same pattern as script.js: each validator returns null when
   valid, or a user-facing message when it isn't. */

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

function validateWith(inputId, errorId, validatorFn) {
  const input = document.getElementById(inputId);
  const message = validatorFn(input.value);
  return setFieldState(inputId, errorId, message);
}

function attachLiveValidation(fields) {
  fields.forEach(([inputId, errorId, validatorFn]) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    const revalidate = () => validateWith(inputId, errorId, validatorFn);
    input.addEventListener("blur", revalidate);
    input.addEventListener("input", revalidate);
  });
}

/* ---------- Staff login (modal on index.html) ---------- */

const staffLoginValidators = {
  username(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Username is required.";
    if (value.length < 3) return "Username must be at least 3 characters.";
    if (value.length > 20) return "Username must be under 20 characters.";
    if (!USERNAME_PATTERN.test(value)) return "Use letters, numbers, or underscores only.";
    return null;
  },
  password(rawValue) {
    if (!rawValue) return "Password is required.";
    if (rawValue.length < 8) return "Password must be at least 8 characters.";
    if (rawValue.length > 50) return "Password must be under 50 characters.";
    return null;
  },
};

const STAFF_LOGIN_FIELDS = [
  ["staffUsername", "staffUsernameError", staffLoginValidators.username],
  ["staffPassword", "staffPasswordError", staffLoginValidators.password],
];

/* ---------- Password show/hide toggle ---------- */
// Reusable for any password field: pass the input's id and the
// toggle button's id. Swaps type="password" <-> type="text" and
// updates the eye icon/label to reflect the current state.
function setupPasswordToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  toggle.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggle.textContent = isHidden ? "🙈" : "👁️";
    toggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
}

function setupStaffLogin() {
  const form = document.getElementById("staffLoginForm");
  if (!form) return; // not on the login page

  attachLiveValidation(STAFF_LOGIN_FIELDS);
  setupPasswordToggle("staffPassword", "staffPasswordToggle");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let allValid = true;
    let firstInvalidInput = null;

    STAFF_LOGIN_FIELDS.forEach(([inputId, errorId, validatorFn]) => {
      const isValid = validateWith(inputId, errorId, validatorFn);
      if (!isValid) {
        allValid = false;
        if (!firstInvalidInput) firstInvalidInput = document.getElementById(inputId);
      }
    });

    const errorEl = document.getElementById("staffLoginError");

    if (!allValid) {
      errorEl.textContent = "";
      firstInvalidInput.focus();
      return;
    }

    const username = document.getElementById("staffUsername").value.trim();
    const password = document.getElementById("staffPassword").value;

    const account = STATIC_STAFF_ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (!account) {
      errorEl.textContent = "Incorrect username or password.";
      return;
    }

    errorEl.textContent = "";
    sessionStorage.setItem("gp_staff_username", account.username);
    closeStaffModal();
    window.location.href = "staff-dashboard.html";
  });
}

/* ---------- Staff login modal (on staff-login.html) ----------
   Standalone page that duplicates the homepage content, with this
   modal auto-opened on load — so the site is visible behind it
   instead of a blank page, while still living in its own file. */

function openStaffModal() {
  const overlay = document.getElementById("staffModalOverlay");
  if (!overlay) return;
  overlay.classList.add("modal-overlay--open");
  resetStaffLoginForm();
}

function closeStaffModal() {
  const overlay = document.getElementById("staffModalOverlay");
  if (overlay) overlay.classList.remove("modal-overlay--open");
}

function resetStaffLoginForm() {
  const form = document.getElementById("staffLoginForm");
  if (form) form.reset();
  STAFF_LOGIN_FIELDS.forEach(([inputId, errorId]) => clearFieldState(inputId, errorId));
  const errorEl = document.getElementById("staffLoginError");
  if (errorEl) errorEl.textContent = "";

  // form.reset() restores the value but not a manually-changed type
  // attribute, so put the password field back to hidden each time.
  const passwordInput = document.getElementById("staffPassword");
  const passwordToggle = document.getElementById("staffPasswordToggle");
  if (passwordInput) passwordInput.type = "password";
  if (passwordToggle) {
    passwordToggle.textContent = "👁️";
    passwordToggle.setAttribute("aria-label", "Show password");
  }
}

function setupStaffModalTriggers() {
  const openBtn = document.getElementById("openStaffLogin");
  const overlay = document.getElementById("staffModalOverlay");
  if (!openBtn || !overlay) return; // not on a page with this modal

  openBtn.addEventListener("click", openStaffModal);
  document.getElementById("staffModalClose").addEventListener("click", closeStaffModal);
  overlay.addEventListener("click", (event) => {
    if (event.target.id === "staffModalOverlay") closeStaffModal();
  });

  // staff-login.html's whole purpose is this modal, so open it
  // immediately rather than making staff click the footer link first.
  if (document.body.dataset.autoOpenStaffModal === "true") {
    openStaffModal();
  }
}

/* ---------- Add a Book form (add-only) ---------- */

const bookFormValidators = {
  title(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Title is required.";
    if (value.length < 2) return "Title must be at least 2 characters.";
    if (value.length > 150) return "Title must be under 150 characters.";
    return null;
  },
  author(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Author is required.";
    if (value.length < 2) return "Author must be at least 2 characters.";
    if (value.length > 100) return "Author must be under 100 characters.";
    if (!BOOK_AUTHOR_PATTERN.test(value)) return "Use letters, spaces, periods, commas, apostrophes, or hyphens only.";
    return null;
  },
  edition(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Edition is required.";
    if (value.length > 20) return "Edition must be under 20 characters.";
    if (!BOOK_EDITION_PATTERN.test(value)) return "Use letters, numbers, periods, and spaces only (e.g. 7th Ed.).";
    return null;
  },
  subject(rawValue) {
    const value = rawValue.trim();
    if (!value) return "Subject / course code is required.";
    if (!BOOK_SUBJECT_PATTERN.test(value)) return "Use a course code like IT101 — letters followed by numbers.";
    return null;
  },
  price(rawValue) {
    if (rawValue === "") return "Price is required.";
    const value = Number(rawValue);
    if (Number.isNaN(value)) return "Enter a valid price.";
    if (value < 0) return "Price cannot be negative.";
    if (value > 99999) return "Price must be under ₱99,999.";
    return null;
  },
  quantity(rawValue) {
    if (rawValue === "") return "Quantity is required.";
    const value = Number(rawValue);
    if (Number.isNaN(value)) return "Enter a valid quantity.";
    if (!Number.isInteger(value)) return "Quantity must be a whole number.";
    if (value < 0) return "Quantity cannot be negative.";
    if (value > 99999) return "Quantity must be under 99,999.";
    return null;
  },
};

const BOOK_FORM_FIELDS = [
  ["bookTitle", "bookTitleError", bookFormValidators.title],
  ["bookAuthor", "bookAuthorError", bookFormValidators.author],
  ["bookEdition", "bookEditionError", bookFormValidators.edition],
  ["bookSubject", "bookSubjectError", bookFormValidators.subject],
  ["bookPrice", "bookPriceError", bookFormValidators.price],
  ["bookQuantity", "bookQuantityError", bookFormValidators.quantity],
];

// The edit popup has its own set of fields (editBook*) so it can be
// open at the same time the Add a Book form exists elsewhere in the DOM,
// without id collisions — same validators, different inputs.
const EDIT_BOOK_FORM_FIELDS = [
  ["editBookTitle", "editBookTitleError", bookFormValidators.title],
  ["editBookAuthor", "editBookAuthorError", bookFormValidators.author],
  ["editBookEdition", "editBookEditionError", bookFormValidators.edition],
  ["editBookSubject", "editBookSubjectError", bookFormValidators.subject],
  ["editBookPrice", "editBookPriceError", bookFormValidators.price],
  ["editBookQuantity", "editBookQuantityError", bookFormValidators.quantity],
];

function resetBookForm() {
  document.getElementById("bookTitle").value = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookEdition").value = "";
  document.getElementById("bookSubject").value = "";
  document.getElementById("bookPrice").value = "";
  document.getElementById("bookQuantity").value = "";
  BOOK_FORM_FIELDS.forEach(([inputId, errorId]) => clearFieldState(inputId, errorId));
}

function handleBookFormSubmit(event) {
  event.preventDefault();

  let allValid = true;
  let firstInvalidInput = null;

  BOOK_FORM_FIELDS.forEach(([inputId, errorId, validatorFn]) => {
    const isValid = validateWith(inputId, errorId, validatorFn);
    if (!isValid) {
      allValid = false;
      if (!firstInvalidInput) firstInvalidInput = document.getElementById(inputId);
    }
  });

  if (!allValid) {
    firstInvalidInput.focus();
    return;
  }

  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const edition = document.getElementById("bookEdition").value.trim();
  const subject = document.getElementById("bookSubject").value.trim();
  const price = Number(document.getElementById("bookPrice").value);
  const quantity = Number(document.getElementById("bookQuantity").value);

  books.push({
    id: `B${bookIdCounter++}`,
    title, author, edition, subject, price, quantity,
  });

  resetBookForm();
  renderBookTable();
  renderStats();
}

function setupBookForm() {
  const form = document.getElementById("bookForm");
  if (!form) return; // not on the staff dashboard

  attachLiveValidation(BOOK_FORM_FIELDS);
  form.addEventListener("submit", handleBookFormSubmit);
}

/* ---------- Edit Book popup (opened from the Current Stocks table) ----------
   Lets staff update a title without scrolling away from the table,
   so they can move between rows quickly. */

function openEditModal(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  document.getElementById("editBookId").value = book.id;
  document.getElementById("editBookTitle").value = book.title;
  document.getElementById("editBookAuthor").value = book.author;
  document.getElementById("editBookEdition").value = book.edition;
  document.getElementById("editBookSubject").value = book.subject;
  document.getElementById("editBookPrice").value = book.price;
  document.getElementById("editBookQuantity").value = book.quantity;
  EDIT_BOOK_FORM_FIELDS.forEach(([inputId, errorId]) => clearFieldState(inputId, errorId));

  document.getElementById("editBookModalOverlay").classList.add("modal-overlay--open");
}

function closeEditModal() {
  document.getElementById("editBookModalOverlay").classList.remove("modal-overlay--open");
}

function handleEditBookFormSubmit(event) {
  event.preventDefault();

  let allValid = true;
  let firstInvalidInput = null;

  EDIT_BOOK_FORM_FIELDS.forEach(([inputId, errorId, validatorFn]) => {
    const isValid = validateWith(inputId, errorId, validatorFn);
    if (!isValid) {
      allValid = false;
      if (!firstInvalidInput) firstInvalidInput = document.getElementById(inputId);
    }
  });

  if (!allValid) {
    firstInvalidInput.focus();
    return;
  }

  const editingId = document.getElementById("editBookId").value;
  const book = books.find((b) => b.id === editingId);
  if (book) {
    Object.assign(book, {
      title: document.getElementById("editBookTitle").value.trim(),
      author: document.getElementById("editBookAuthor").value.trim(),
      edition: document.getElementById("editBookEdition").value.trim(),
      subject: document.getElementById("editBookSubject").value.trim(),
      price: Number(document.getElementById("editBookPrice").value),
      quantity: Number(document.getElementById("editBookQuantity").value),
    });
  }

  closeEditModal();
  renderBookTable();
  renderStats();
}

function setupEditModal() {
  const form = document.getElementById("editBookForm");
  if (!form) return; // not on the staff dashboard

  attachLiveValidation(EDIT_BOOK_FORM_FIELDS);
  form.addEventListener("submit", handleEditBookFormSubmit);
  document.getElementById("editBookFormCancel").addEventListener("click", closeEditModal);
  document.getElementById("editBookModalClose").addEventListener("click", closeEditModal);
  document.getElementById("editBookModalOverlay").addEventListener("click", (event) => {
    if (event.target.id === "editBookModalOverlay") closeEditModal();
  });
}

function deleteBook(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  if (!confirm(`Remove "${book.title}" from the catalog?`)) return;

  const index = books.findIndex((b) => b.id === bookId);
  books.splice(index, 1);
  renderBookTable();
  renderStats();
}

/* ---------- Book inventory table ---------- */

function getFilteredBooks() {
  if (!bookSearchTerm) return books;
  return books.filter((book) => {
    const haystack = `${book.title} ${book.author} ${book.subject}`.toLowerCase();
    return haystack.includes(bookSearchTerm);
  });
}

function renderBookTable() {
  const tbody = document.getElementById("bookTableBody");
  if (!tbody) return;

  const emptyState = document.getElementById("bookEmpty");
  const countLabel = document.getElementById("bookResultsCount");

  const results = getFilteredBooks();
  tbody.innerHTML = "";

  countLabel.textContent = `${results.length} title${results.length === 1 ? "" : "s"} found`;
  emptyState.classList.toggle("empty-state--hidden", results.length !== 0);

  results.forEach((book) => {
    const status = getStatus(book.quantity);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author} · ${book.edition}</td>
      <td>${book.subject}</td>
      <td>₱${book.price.toLocaleString()}</td>
      <td>${book.quantity}</td>
      <td><span class="status-badge status-badge--${status}">${getStatusLabel(status)}</span></td>
      <td>
        <button class="staff-table-action staff-table-action--edit" data-book-id="${book.id}">Edit</button>
        <button class="staff-table-action staff-table-action--delete" data-book-id="${book.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll(".staff-table-action--edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.bookId));
  });
  tbody.querySelectorAll(".staff-table-action--delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteBook(btn.dataset.bookId));
  });
}

/* ---------- Registered students table ---------- */

function getFilteredStudents() {
  if (!studentSearchTerm) return registeredStudents;
  return registeredStudents.filter((student) => {
    const haystack = `${student.fullName} ${student.email} ${student.program}`.toLowerCase();
    return haystack.includes(studentSearchTerm);
  });
}

function renderStudentTable() {
  const tbody = document.getElementById("studentTableBody");
  if (!tbody) return;

  const emptyState = document.getElementById("studentEmpty");
  const countLabel = document.getElementById("studentResultsCount");

  const results = getFilteredStudents();
  tbody.innerHTML = "";

  countLabel.textContent = `${results.length} student${results.length === 1 ? "" : "s"} found`;
  emptyState.classList.toggle("empty-state--hidden", results.length !== 0);

  results.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.fullName}</td>
      <td>${student.email}</td>
      <td>${student.program}</td>
    `;
    tbody.appendChild(row);
  });
}

/* ---------- Summary stats ---------- */

function renderStats() {
  const statBookTotal = document.getElementById("statBookTotal");
  const statBookTotalStocks = document.getElementById("statBookTotalStocks");
  const statBookOut = document.getElementById("statBookOut");
  const statStudentTotal = document.getElementById("statStudentTotal");

  if (statBookTotal) statBookTotal.textContent = books.length;
  if (statBookTotalStocks) statBookTotalStocks.textContent = books.length;
  if (statBookOut) statBookOut.textContent = books.filter((b) => getStatus(b.quantity) === "out").length;
  if (statStudentTotal) statStudentTotal.textContent = registeredStudents.length;
}

/* ---------- Sidebar navigation ---------- */

function setupSidebar() {
  const links = document.querySelectorAll("#staffSidebarNav .app-sidebar__link");
  const panels = document.querySelectorAll("[data-tab-panel]");
  if (!links.length) return; // not on the dashboard page

  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((l) => l.classList.remove("app-sidebar__link--active"));
      link.classList.add("app-sidebar__link--active");

      panels.forEach((panel) => {
        panel.classList.toggle("tab-panel--hidden", panel.dataset.tabPanel !== link.dataset.tab);
      });
    });
  });
}

/* ---------- Staff dashboard (staff-dashboard.html) ---------- */

function setupStaffDashboard() {
  const bookTbody = document.getElementById("bookTableBody");
  if (!bookTbody) return; // not on the dashboard page

  // Guard: bounce back to the Staff Log In page if no staff session exists.
  if (!sessionStorage.getItem("gp_staff_username")) {
    window.location.href = "staff-login.html";
    return;
  }

  document.getElementById("staffUsernameLabel").textContent = sessionStorage.getItem("gp_staff_username");

  document.getElementById("bookSearchInput").addEventListener("input", (event) => {
    bookSearchTerm = event.target.value.trim().toLowerCase();
    renderBookTable();
  });

  document.getElementById("studentSearchInput").addEventListener("input", (event) => {
    studentSearchTerm = event.target.value.trim().toLowerCase();
    renderStudentTable();
  });

  document.getElementById("staffLogoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("gp_staff_username");
    window.location.href = "staff-login.html";
  });

  setupBookForm();
  setupEditModal();
  setupSidebar();
  renderBookTable();
  renderStudentTable();
  renderStats();
}

document.addEventListener("DOMContentLoaded", () => {
  setupStaffLogin();
  setupStaffModalTriggers();
  setupStaffDashboard();
});