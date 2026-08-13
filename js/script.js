/* =====================================================
   GreenPrints — script.js
   No login functionality — this only powers the
   look and feel of the prototype interface.
   ===================================================== */

// Sample book data, just to preview what the real
// stock-checking feature will look like on screen.
const sampleBooks = [
  { title: "Introduction to Database Systems", subject: "IT 101", status: "in" },
  { title: "Data Structures and Algorithms", subject: "CS 202", status: "low" },
  { title: "Systems Analysis and Design", subject: "IT 305", status: "out" },
];

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

// Since this is a prototype, the "Get Started" buttons
// just show a short message instead of logging anyone in.
function setupGetStartedButtons() {
  const buttonIds = ["getStartedTop", "getStartedHero", "getStartedCta"];

  buttonIds.forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;

    button.addEventListener("click", () => {
      alert("This is a prototype. Full sign-in and search features are coming in a later version.");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderStockPreview();
  setupGetStartedButtons();
});
