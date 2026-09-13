/* =====================================================
   GreenPrints — staff.js
   Powers the staff login, the Manage Books form + inventory
   table, and the Registered Students table. Prototype only:
   staff auth is a seeded username/password pair (staff manage
   the system, so they get a password — students stay
   passwordless via email + OTP). Book and student data are
   held in memory and reset on reload.

   Books here map directly onto the Book table (BookID, Title,
   Author, Edition, Subject, Price, Quantity) from the
   normalization report. Students map onto the Student table
   (StudentID, StudentName, Institutional_Email, Program).
   ===================================================== */

const STATIC_STAFF_ACCOUNTS = [
  { username: "adminstaff", password: "oneadminstaff1" },
];

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

/* ---------- Staff login (staff-login.html) ---------- */

function setupStaffLogin() {
  const form = document.getElementById("staffLoginForm");
  if (!form) return; // not on the login page

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("staffUsername").value.trim();
    const password = document.getElementById("staffPassword").value;
    const errorEl = document.getElementById("staffLoginError");

    if (!username || !password) {
      errorEl.textContent = "Please enter your username and password.";
      return;
    }

    const account = STATIC_STAFF_ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (!account) {
      errorEl.textContent = "Incorrect username or password.";
      return;
    }

    errorEl.textContent = "";
    sessionStorage.setItem("gp_staff_username", account.username);
    window.location.href = "staff-dashboard.html";
  });
}

/* ---------- Manage Books form ---------- */

function resetBookForm() {
  document.getElementById("bookId").value = "";
  document.getElementById("bookTitle").value = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookEdition").value = "";
  document.getElementById("bookSubject").value = "";
  document.getElementById("bookPrice").value = "";
  document.getElementById("bookQuantity").value = "";
  document.getElementById("bookFormSubmit").textContent = "Add Book";
  document.getElementById("bookFormCancel").style.display = "none";
  document.getElementById("bookFormError").textContent = "";
}

function loadBookIntoForm(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  document.getElementById("bookId").value = book.id;
  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookEdition").value = book.edition;
  document.getElementById("bookSubject").value = book.subject;
  document.getElementById("bookPrice").value = book.price;
  document.getElementById("bookQuantity").value = book.quantity;
  document.getElementById("bookFormSubmit").textContent = "Save Changes";
  document.getElementById("bookFormCancel").style.display = "inline-flex";
  document.getElementById("bookFormError").textContent = "";

  document.getElementById("bookForm").scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleBookFormSubmit(event) {
  event.preventDefault();

  const errorEl = document.getElementById("bookFormError");
  const editingId = document.getElementById("bookId").value;

  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const edition = document.getElementById("bookEdition").value.trim();
  const subject = document.getElementById("bookSubject").value.trim();
  const price = Number(document.getElementById("bookPrice").value);
  const quantity = Number(document.getElementById("bookQuantity").value);

  if (!title || !author || !edition || !subject) {
    errorEl.textContent = "Please fill in title, author, edition, and subject.";
    return;
  }
  if (Number.isNaN(price) || price < 0) {
    errorEl.textContent = "Please enter a valid price.";
    return;
  }
  if (Number.isNaN(quantity) || quantity < 0) {
    errorEl.textContent = "Please enter a valid quantity.";
    return;
  }

  errorEl.textContent = "";

  if (editingId) {
    const book = books.find((b) => b.id === editingId);
    if (book) {
      Object.assign(book, { title, author, edition, subject, price, quantity });
    }
  } else {
    books.push({
      id: `B${bookIdCounter++}`,
      title, author, edition, subject, price, quantity,
    });
  }

  resetBookForm();
  renderBookTable();
  renderStats();
}

function setupBookForm() {
  const form = document.getElementById("bookForm");
  if (!form) return; // not on the staff dashboard

  form.addEventListener("submit", handleBookFormSubmit);
  document.getElementById("bookFormCancel").addEventListener("click", resetBookForm);
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
    btn.addEventListener("click", () => loadBookIntoForm(btn.dataset.bookId));
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
  const statBookOut = document.getElementById("statBookOut");
  const statStudentTotal = document.getElementById("statStudentTotal");

  if (statBookTotal) statBookTotal.textContent = books.length;
  if (statBookOut) statBookOut.textContent = books.filter((b) => getStatus(b.quantity) === "out").length;
  if (statStudentTotal) statStudentTotal.textContent = registeredStudents.length;
}

/* ---------- Tabs ---------- */

function setupTabs() {
  const tabs = document.querySelectorAll("#staffTabs .page-tab");
  const panels = document.querySelectorAll("[data-tab-panel]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("page-tab--active"));
      tab.classList.add("page-tab--active");

      panels.forEach((panel) => {
        panel.classList.toggle("tab-panel--hidden", panel.dataset.tabPanel !== tab.dataset.tab);
      });
    });
  });
}

/* ---------- Staff dashboard (staff-dashboard.html) ---------- */

function setupStaffDashboard() {
  const bookTbody = document.getElementById("bookTableBody");
  if (!bookTbody) return; // not on the dashboard page

  // Guard: bounce back to login if no staff session exists.
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
  setupTabs();
  renderBookTable();
  renderStudentTable();
  renderStats();
}

document.addEventListener("DOMContentLoaded", () => {
  setupStaffLogin();
  setupStaffDashboard();
});