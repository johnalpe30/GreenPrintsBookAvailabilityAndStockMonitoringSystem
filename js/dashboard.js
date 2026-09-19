/* =====================================================
   GreenPrints — dashboard.js
   Powers the student dashboard: catalog search/filter, and
   the resulting restock watch list. Client-side prototype
   only — book data and requests are held in memory and reset
   on reload. In the real system this maps onto the Book
   Catalog, Stock Monitoring, and Restock Notification
   modules, backed by the Book and Restock_Request tables.
   Clicking "Notify me" on a catalog card is what creates a
   Restock_Request row, shown under the Restock Requests tab.
   ===================================================== */

// Signed-in student. Set by script.js at login and passed
// along via sessionStorage since there's no real session/
// backend yet. Falls back to placeholders if this page is
// opened directly without signing up first (or if the student
// only logged in, which doesn't collect name/program).
const currentStudent = {
  fullName: sessionStorage.getItem("gp_student_fullName") || "Juan Dela Cruz",
  firstName: sessionStorage.getItem("gp_student_firstName") || "Juan",
  middleName: sessionStorage.getItem("gp_student_middleName") || "",
  lastName: sessionStorage.getItem("gp_student_lastName") || "Dela Cruz",
  suffix: sessionStorage.getItem("gp_student_suffix") || "",
  program: sessionStorage.getItem("gp_student_program") || "",
  email: sessionStorage.getItem("gp_student_email") || "juandelacruz@online.htcgsc.edu.ph",
};

// Sample catalog, modeled on the Book table from the
// normalization report (BookID, Title, Author, Edition, Subject, Price, Quantity).
const catalog = [
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

// Restock_Request records: { requestId, studentEmail, bookId, requestDate, notificationStatus }
// Mirrors the Restock_Request table (RequestID, StudentID FK, BookID FK,
// Request_Date, Notification_Status) from the normalization report.
const restockRequests = [];
let requestCounter = 1;

let activeStatusFilter = "all";
let activeSubjectFilter = "all";
let searchTerm = "";

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

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/* ---------- Populate filters/selects ---------- */

function populateSubjectFilter() {
  const select = document.getElementById("subjectFilter");
  const subjects = [...new Set(catalog.map((b) => b.subject))].sort();

  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    select.appendChild(option);
  });
}

/* ---------- Filtering ---------- */

function getFilteredCatalog() {
  return catalog.filter((book) => {
    const status = getStatus(book.quantity);

    if (activeStatusFilter !== "all" && status !== activeStatusFilter) return false;
    if (activeSubjectFilter !== "all" && book.subject !== activeSubjectFilter) return false;

    if (searchTerm) {
      const haystack = `${book.title} ${book.author} ${book.subject}`.toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }

    return true;
  });
}

/* ---------- Rendering: catalog grid ---------- */

function hasPendingRequest(bookId) {
  return restockRequests.some(
    (req) => req.bookId === bookId && req.studentEmail === currentStudent.email
  );
}

function renderCatalog() {
  const grid = document.getElementById("bookGrid");
  const emptyState = document.getElementById("catalogEmpty");
  const countLabel = document.getElementById("resultsCount");

  const results = getFilteredCatalog();
  grid.innerHTML = "";

  countLabel.textContent = `${results.length} title${results.length === 1 ? "" : "s"} found`;
  emptyState.classList.toggle("empty-state--hidden", results.length !== 0);

  results.forEach((book) => {
    const status = getStatus(book.quantity);
    const isWatching = hasPendingRequest(book.id);

    const card = document.createElement("article");
    card.className = "book-card";

    // Only genuinely out-of-stock titles get a notify option —
    // Low Stock still has copies available, so there's nothing to wait on.
    const showNotify = status === "out";

    card.innerHTML = `
      <div class="book-card__top">
        <div>
          <p class="book-card__title">${book.title}</p>
          <p class="book-card__meta">${book.author} · ${book.edition} · ${book.subject}</p>
        </div>
        <span class="status-badge status-badge--${status}">${getStatusLabel(status)}</span>
      </div>
      <div class="book-card__bottom">
        <span class="book-card__price">₱${book.price.toLocaleString()}</span>
        ${
          showNotify
            ? `<button class="notify-btn ${isWatching ? "notify-btn--active" : ""}" data-book-id="${book.id}">
                 ${isWatching ? "Notified ✓" : "Notify me"}
               </button>`
            : ""
        }
      </div>
    `;

    grid.appendChild(card);
  });

  // Wire up the notify buttons just rendered
  grid.querySelectorAll(".notify-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const bookId = btn.dataset.bookId;
      if (hasPendingRequest(bookId)) {
        removeRestockRequest(bookId);
      } else {
        addRestockRequest(bookId);
        const book = catalog.find((b) => b.id === bookId);
        if (book) openNotifyModal(book.title);
      }
    });
  });
}

/* ---------- Notify confirmation modal ---------- */

function openNotifyModal(bookTitle) {
  document.getElementById("notifyModalBook").textContent = bookTitle;
  document.getElementById("notifyModalOverlay").classList.add("modal-overlay--open");
}

function closeNotifyModal() {
  document.getElementById("notifyModalOverlay").classList.remove("modal-overlay--open");
}

function setupNotifyModal() {
  document.getElementById("notifyModalClose").addEventListener("click", closeNotifyModal);
  document.getElementById("notifyModalOk").addEventListener("click", closeNotifyModal);
  document.getElementById("notifyModalOverlay").addEventListener("click", (event) => {
    if (event.target.id === "notifyModalOverlay") closeNotifyModal();
  });
}

/* ---------- Restock_Request logic ---------- */

function addRestockRequest(bookId) {
  if (hasPendingRequest(bookId)) return; // already requested — avoid duplicate rows

  restockRequests.push({
    requestId: `R${String(requestCounter++).padStart(3, "0")}`,
    studentEmail: currentStudent.email,
    bookId,
    requestDate: todayISO(),
    notificationStatus: "Pending",
  });

  renderCatalog();
  renderWatchlist();
  renderStats();
}

function removeRestockRequest(bookId) {
  const index = restockRequests.findIndex(
    (req) => req.bookId === bookId && req.studentEmail === currentStudent.email
  );
  if (index === -1) return;

  restockRequests.splice(index, 1);
  renderCatalog();
  renderWatchlist();
  renderStats();
}

function renderWatchlist() {
  const list = document.getElementById("watchlistList");
  const emptyState = document.getElementById("watchlistEmpty");

  list.innerHTML = "";

  const myRequests = restockRequests.filter((req) => req.studentEmail === currentStudent.email);

  if (myRequests.length === 0) {
    emptyState.textContent = "You're not watching any titles yet. Tap Notify me on a book in the Book Catalog tab to add it here.";
    emptyState.classList.remove("empty-state--hidden");
    return;
  }
  emptyState.classList.add("empty-state--hidden");

  myRequests.forEach((req) => {
    const book = catalog.find((b) => b.id === req.bookId);
    if (!book) return;

    const row = document.createElement("li");
    row.className = "watchlist-row";
    row.innerHTML = `
      <div>
        <p class="watchlist-row__title">${book.title}</p>
        <p class="watchlist-row__meta">Requested ${req.requestDate} · Status: ${req.notificationStatus}</p>
      </div>
      <button class="watchlist-row__remove" data-book-id="${book.id}">Remove</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll(".watchlist-row__remove").forEach((btn) => {
    btn.addEventListener("click", () => removeRestockRequest(btn.dataset.bookId));
  });
}

/* ---------- Summary stats ---------- */

function renderStats() {
  document.getElementById("statTotal").textContent = catalog.length;
  document.getElementById("statOut").textContent = catalog.filter((b) => getStatus(b.quantity) === "out").length;
  document.getElementById("statWatching").textContent = restockRequests.filter(
    (req) => req.studentEmail === currentStudent.email
  ).length;
}

/* ---------- Toolbar wiring ---------- */

function setupToolbar() {
  document.getElementById("searchInput").addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderCatalog();
  });

  document.getElementById("subjectFilter").addEventListener("change", (event) => {
    activeSubjectFilter = event.target.value;
    renderCatalog();
  });

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("filter-chip--active"));
      chip.classList.add("filter-chip--active");
      activeStatusFilter = chip.dataset.status;
      renderCatalog();
    });
  });
}

/* ---------- Sidebar navigation ---------- */

function setupSidebar() {
  const links = document.querySelectorAll("#studentSidebarNav .app-sidebar__link");
  const panels = document.querySelectorAll("[data-tab-panel]");

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

/* ---------- Profile panel ---------- */
// Read-only view of the Student record captured at sign-up.
// A student who only logged in (no sign-up this session) won't
// have these in sessionStorage — falls back to em dashes rather
// than guessing at data we were never given.

function renderProfile() {
  document.getElementById("profileFirstName").textContent = currentStudent.firstName || "—";
  document.getElementById("profileMiddleName").textContent = currentStudent.middleName || "—";
  document.getElementById("profileLastName").textContent = currentStudent.lastName || "—";
  document.getElementById("profileSuffix").textContent = currentStudent.suffix || "—";
  document.getElementById("profileProgram").textContent = currentStudent.program || "—";
  document.getElementById("profileEmail").textContent = currentStudent.email || "—";
}

/* ---------- Logout ---------- */

function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("gp_student_fullName");
    sessionStorage.removeItem("gp_student_firstName");
    sessionStorage.removeItem("gp_student_middleName");
    sessionStorage.removeItem("gp_student_lastName");
    sessionStorage.removeItem("gp_student_suffix");
    sessionStorage.removeItem("gp_student_program");
    sessionStorage.removeItem("gp_student_email");
    window.location.href = "index.html";
  });
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("studentNameLabel").textContent = currentStudent.fullName;
  document.getElementById("studentFirstName").textContent = currentStudent.firstName;

  populateSubjectFilter();
  setupToolbar();
  setupSidebar();
  setupNotifyModal();
  setupLogout();
  renderProfile();
  renderCatalog();
  renderWatchlist();
  renderStats();
});