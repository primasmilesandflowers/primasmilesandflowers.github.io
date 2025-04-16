// Load popup windows from popup-windows.html
fetch("popup-windows.html")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to load popup-windows.html");
    }
    return response.text();
  })
  .then((html) => {
    document.getElementById("popup-windows-container").innerHTML = html;

    // Automatically display all popup windows on page load
    document.querySelectorAll(".winpopup").forEach((win) => {
      win.style.display = "block";
    });
  })
  .catch((error) => {
    console.error("Error loading popup-windows.html:", error);
  });
