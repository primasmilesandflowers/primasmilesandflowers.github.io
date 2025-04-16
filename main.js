// Open a window by ID
function openWindow(name) {
  // Hide all windows
  document
    .querySelectorAll(".window")
    .forEach((win) => (win.style.display = "none"));

  // Show the selected window
  const win = document.getElementById(`window-${name}`);
  if (win) {
    win.style.display = "block";
    win.style.zIndex = Date.now(); // Bring the window to the front

    // Dynamically load content for specific windows
    if (name === "about") {
      loadWindowContent("window-about", "about.html");
    } else if (name === "projects") {
      loadWindowContent("window-projects", "projects.html");
    } else if (name === "5-8site") {
      loadWindowContent("window-5-8site", "5-8site.html");
    } else if (name === "portfolioSite") {
      loadWindowContent("window-portfolioSite", "portfolioSite.html");
    }
  }
}

// Load content into a window
function loadWindowContent(windowId, filePath) {
  const windowElement = document.getElementById(windowId);
  const contentElement = windowElement.querySelector(".window-content");

  fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load content from ${filePath}`);
      }
      return response.text();
    })
    .then((html) => {
      contentElement.innerHTML = html;
    })
    .catch((error) => {
      contentElement.innerHTML = `<p>Error loading content: ${error.message}</p>`;
    });
}

// Drag functionality for popup windows
let currentDrag = null;
let offsetX, offsetY;

function dragWindow(e, header) {
  currentDrag = header.parentElement;
  const rect = currentDrag.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  document.onmousemove = dragMove;
  document.onmouseup = stopDrag;
}

function dragMove(e) {
  if (!currentDrag) return;
  currentDrag.style.left = `${e.clientX - offsetX}px`;
  currentDrag.style.top = `${e.clientY - offsetY}px`;
}

function stopDrag() {
  document.onmousemove = null;
  document.onmouseup = null;
  currentDrag = null;
}

// Resize functionality
let currentResize = null;
let resizeDirection = null;
let startX, startY, startWidth, startHeight, startTop, startLeft;

function startResize(e, direction) {
  currentResize = e.target.closest(".winpopup, .window");
  resizeDirection = direction;

  const rect = currentResize.getBoundingClientRect();
  startX = e.clientX;
  startY = e.clientY;
  startWidth = rect.width;
  startHeight = rect.height;
  startTop = rect.top;
  startLeft = rect.left;

  document.body.classList.add("no-select");
  document.onmousemove = resizeMove;
  document.onmouseup = stopResize;
}

function resizeMove(e) {
  if (!currentResize || !resizeDirection) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  if (resizeDirection.includes("e")) {
    currentResize.style.width = `${Math.max(startWidth + dx, 200)}px`;
  }
  if (resizeDirection.includes("s")) {
    currentResize.style.height = `${Math.max(startHeight + dy, 200)}px`;
  }
  if (resizeDirection.includes("w")) {
    const newWidth = Math.max(startWidth - dx, 200);
    currentResize.style.width = `${newWidth}px`;
    currentResize.style.left = `${startLeft + (startWidth - newWidth)}px`;
  }
  if (resizeDirection.includes("n")) {
    const newHeight = Math.max(startHeight - dy, 200);
    currentResize.style.height = `${newHeight}px`;
    currentResize.style.top = `${startTop + (startHeight - newHeight)}px`;
  }
}

function stopResize() {
  document.onmousemove = null;
  document.onmouseup = null;
  currentResize = null;
  resizeDirection = null;
  document.body.classList.remove("no-select");
}

// Maximize or restore a popup window
function maximizeWindow(button) {
  const windowElement = button.closest(".winpopup, .window");
  const taskbarHeight = 40;

  if (
    windowElement.style.width === "100%" &&
    windowElement.style.height === `calc(100% - ${taskbarHeight}px)`
  ) {
    // Restore to default size
    windowElement.style.width = "400px";
    windowElement.style.height = "auto";
    windowElement.style.top = "150px";
    windowElement.style.left = "200px";
  } else {
    // Maximize to full screen
    windowElement.style.width = "100%";
    windowElement.style.height = `calc(100% - ${taskbarHeight}px)`;
    windowElement.style.top = "0";
    windowElement.style.left = "0";
  }
}

// Close a popup window
function closeWindow(button) {
  const windowElement = button.closest(".winpopup, .window");
  windowElement.style.display = "none";
}

// Return to the homepage
function returnToHome() {
  window.location.href = "index.html";
}

// Load projects dynamically
function loadProjects() {
  const projects = [
    {
      name: "Web App",
      icon: "https://img.icons8.com/ios-filled/24/folder-invoices.png",
    },
    {
      name: "Portfolio Site",
      icon: "https://img.icons8.com/ios-filled/24/folder-invoices.png",
    },
  ];

  const fileExplorer = document.querySelector(
    "#window-projects .file-explorer"
  );
  fileExplorer.innerHTML = "";

  projects.forEach((project) => {
    const fileRow = document.createElement("div");
    fileRow.className = "file-row";
    fileRow.onclick = () => window.open(project.url, "_blank");

    const img = document.createElement("img");
    img.src = project.icon;
    img.alt = "Project Icon";

    const span = document.createElement("span");
    span.textContent = project.name;

    fileRow.appendChild(img);
    fileRow.appendChild(span);
    fileExplorer.appendChild(fileRow);
  });
}

// Tally Form Integration
function openTallyPopup() {
  Tally.openPopup("wMG8O8", {
    layout: "modal",
    width: 700,
    overlay: false,
    customStyles: { bottom: "40px" },
  });
}

let currentIndex = 0;

function updateCarousel() {
  const images = document.querySelectorAll(".carousel-images img");
  const carouselImages = document.querySelector(".carousel-images");
  const imageWidth = images[0].clientWidth + 10; // Include gap
  carouselImages.style.transform = `translateX(-${
    currentIndex * imageWidth
  }px)`;
}

function prevImage() {
  const images = document.querySelectorAll(".carousel-images img");
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  updateCarousel();
}

function nextImage() {
  const images = document.querySelectorAll(".carousel-images img");
  currentIndex = (currentIndex + 1) % images.length;
  updateCarousel();
}

function openFullscreen(image) {
  const modal = document.getElementById("fullscreenModal");
  const fullscreenImage = document.getElementById("fullscreenImage");
  fullscreenImage.src = image.src;
  modal.style.display = "flex";
}

function closeFullscreen() {
  const modal = document.getElementById("fullscreenModal");
  modal.style.display = "none";
}
