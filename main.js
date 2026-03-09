let projectNames = [];

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

    // Load content for project windows when they open
    if (projectNames.includes(name)) {
      const contentElement = win.querySelector(".window-content");
      if (contentElement && contentElement.children.length === 0) {
        let fileName = `${name}.html`;
        if (name === "hair") {
          fileName = "wireframeHair.html";
        }
        loadWindowContent(`window-${name}`, fileName);
      }
    }
  }
}

// Initialize all window/popup functionality (drag, resize, controls)
function initializeWindows() {
  document.querySelectorAll(".window, .winpopup").forEach((windowElement) => {
    // Initialize drag on headers
    const header = windowElement.querySelector(
      ".window-header, .winpopup-header",
    );
    if (header) {
      header.addEventListener("mousedown", (e) => {
        dragWindow(e, header);
      });
    }

    // Initialize control buttons
    windowElement
      .querySelectorAll(".window-controls button, .winpopup-controls button")
      .forEach((button) => {
        if (button.classList.contains("minimize-button")) {
          button.addEventListener("click", () => minimizeWindow(button));
        } else if (button.classList.contains("maximize-button")) {
          button.addEventListener("click", () => maximizeWindow(button));
        } else if (button.classList.contains("close-button")) {
          button.addEventListener("click", () => closeWindow(button));
        }
      });

    // Bring window to front on mousedown
    windowElement.addEventListener("mousedown", () => {
      z = z + 1;
      windowElement.style.zIndex = z;
    });
  });
}

// Load popup windows from popup-windows.html
// if the HTML was moved into a `projects/` directory adjust path accordingly
let popupPath = "popup-windows.html";
fetch(popupPath)
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

    // Initialize windows after popup windows are loaded
    initializeWindows();
  })
  .catch((error) => {
    console.error("Error loading popup-windows.html:", error);
  });

// Initialize windows on page load for static windows
window.addEventListener("DOMContentLoaded", () => {
  initializeWindows();
});

// Load content into a window
function loadWindowContent(windowId, filePath) {
  const windowElement = document.getElementById(windowId);
  const contentElement = windowElement.querySelector(".window-content");

  // if the file path is just a name (like "5-8site.html") and your
  // project detail pages live under projects/, add that prefix
  if (!filePath.includes("/") && !filePath.startsWith("http")) {
    filePath = `projects/${filePath}`;
  }

  fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load content from ${filePath}`);
      }
      return response.text();
    })
    .then((html) => {
      // parse the returned HTML and extract inner content to avoid
      // duplicating <html>/<body> or <section> wrappers inside our window
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      let insert = "";

      // if the fragment has a section.window, use its innerHTML
      const section = doc.querySelector("section.window");
      if (section) {
        // remove any duplicated header since the host window already
        // has its own <h1 class="window-header">
        const tmp = document.createElement("div");
        tmp.innerHTML = section.innerHTML;
        const hdr = tmp.querySelector("h1.window-header");
        if (hdr) hdr.remove();
        insert = tmp.innerHTML;
      } else {
        // otherwise fall back to entire body
        insert = doc.body.innerHTML;
      }

      contentElement.innerHTML = insert;
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
  const win = button.closest(".winpopup, .window");
  const taskbarHeight = 40;

  if (win.classList.contains("maximized")) {
    // restore to default size
    win.classList.remove("maximized");
    win.style.width = "400px";
    win.style.height = "400px";
    win.style.top = "150px";
    win.style.left = "200px";
  } else {
    // maximize to full screen
    win.classList.add("maximized");
    win.style.width = "100%";
    win.style.height = `calc(100% - ${taskbarHeight}px)`;
    win.style.top = "0";
    win.style.left = "0";
  }
}

// Minimize a popup window
function minimizeWindow(button) {
  const windowElement = button.closest(".winpopup, .window");
  // use the first matching content container; if none exists (projects window
  // still uses bare <ul>), fall back to the window element itself so we can
  // still hide/restore without adding extra markup.
  let contentElement = windowElement.querySelector(
    ".window-content, .winpopup-content",
  );
  if (!contentElement) {
    contentElement = windowElement;
  }
  let taskbarButtons = document.getElementById("taskbar-buttons");
  // if container doesn't exist (legacy pages), create one on the taskbar
  if (!taskbarButtons) {
    const nav = document.querySelector(".taskbar");
    if (nav) {
      taskbarButtons = document.createElement("ul");
      taskbarButtons.id = "taskbar-buttons";
      nav.appendChild(taskbarButtons);
    }
  }

  // Hide window content, shrink, and fully remove from flow
  contentElement.style.display = "none";
  windowElement.style.width = "0px";
  windowElement.style.height = "0px";
  windowElement.style.display = "none"; // make it disappear entirely

  // Add a button to the taskbar if not already present
  let taskbarButton = document.querySelector(
    `[data-window-id="${windowElement.id}"]`,
  );
  if (!taskbarButton) {
    taskbarButton = document.createElement("button");
    taskbarButton.className = "taskbar-button";
    // only grab the <cite> content as the button label
    const cite = windowElement.querySelector(
      ".window-header cite, .winpopup-header cite",
    );
    taskbarButton.textContent = cite
      ? cite.textContent.trim()
      : windowElement
          .querySelector(".window-header, .winpopup-header")
          .textContent.trim();
    taskbarButton.setAttribute("data-window-id", windowElement.id);
    taskbarButton.onclick = () => {
      // Restore window when clicked
      windowElement.style.display = "block";
      contentElement.style.display = "block";
      windowElement.style.width = "400px";
      windowElement.style.height = "400px";
      // remove the list item wrapper if we added one
      if (taskbarButton.parentElement) {
        taskbarButton.parentElement.remove();
      } else {
        taskbarButton.remove();
      }
    };
    // wrap button in <li> to match static taskbar items
    const li = document.createElement("li");
    li.appendChild(taskbarButton);
    taskbarButtons.appendChild(li);
  }
}

// Close a popup window
function closeWindow(button) {
  const windowElement = button.closest(".winpopup, .window");
  windowElement.style.display = "none";

  // if the closed window is one of the *project* detail windows,
  // reopen the explorer. avoid reopening when other windows (about,
  // popups, etc.) are closed.
  const id = windowElement.id || "";
  const projectWindowIds = projectNames.map(name => `window-${name}`);
  if (projectWindowIds.includes(id)) {
    // open projects window after a slight delay to avoid flicker
    setTimeout(() => openWindow("projects"), 10);
  }
}

// Return to the homepage
function returnToHome() {
  window.location.href = "index.html";
}

// Load projects from projects.html
fetch("projects.html")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to load projects.html");
    }
    return response.text();
  })
  .then((html) => {
    const fileExplorer = document.querySelector(
      "#window-projects .file-explorer",
    );
    fileExplorer.innerHTML = html;

    // After loading, parse project names for dynamic loading
    fileExplorer.querySelectorAll("[onclick^='openWindow']").forEach(el => {
        const match = el.getAttribute('onclick').match(/openWindow\('([^']+)'\)/);
        if (match && match[1]) {
            projectNames.push(match[1]);
        }
    });
  })
  .catch((error) => {
    console.error("Error loading projects.html:", error);
  });

// Tally Form Integration
function openTallyPopup() {
  // width fixed to 385 as per data attribute
  Tally.openPopup("wMG8O8", { width: 385 });
}

let currentIndex = 0;

function updateCarousel() {
  const slidesContainer = document.querySelector(".carousel-slides");
  if (slidesContainer) {
    const slideWidth = slidesContainer.clientWidth;
    slidesContainer.scrollLeft = currentIndex * slideWidth;
  }
}

function prevImage() {
  const slides = document.querySelectorAll(".slide");
  if (slides.length > 0) {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel();
  }
}

function nextImage() {
  const slides = document.querySelectorAll(".slide");
  if (slides.length > 0) {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  }
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
