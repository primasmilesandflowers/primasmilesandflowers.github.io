let projectNames = [];

// On load, make sure all main OS windows are hidden.
// Only the popups from popup-windows.html should be visible on load
// (that's handled separately, in the popup-loading fetch below).
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".window")
    .forEach((win) => (win.style.display = "none"));
});

// --- Click-once guard -------------------------------------------------
// Any element with an onclick attribute (or a data-tally-open trigger)
// fires its action on the FIRST click only. Further clicks are ignored
// until resetClickGuards() is explicitly called for that element again
// (we call it whenever the window/icon becomes usable again — e.g. a
// window is reopened, or a minimized window is restored from the
// taskbar).
document.addEventListener(
  "click",
  (event) => {
    const target = event.target.closest("[onclick], [data-tally-open]");
    if (!target) return;

    if (target.dataset.clickUsed === "true") {
      // Already used: block this click before its onclick handler runs.
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }

    target.dataset.clickUsed = "true";
  },
  true, // capture phase: runs before the inline onclick handler fires
);

// Clear the "used" flag on an element and everything inside it, so its
// buttons/icons can be clicked again.
function resetClickGuards(scope) {
  if (!scope) return;
  if (scope.dataset) delete scope.dataset.clickUsed;
  scope
    .querySelectorAll("[data-click-used]")
    .forEach((el) => delete el.dataset.clickUsed);
}

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
    resetClickGuards(win); // its buttons can be clicked again now that it's open
    centerInViewport(win); // center the window in the viewport on open

    // Project windows (the Projects explorer itself, plus every
    // individual project window it links to) open at a default
    // 300x300px size
    if (name === "projects" || projectNames.includes(name)) {
      win.style.width = "300px";
      win.style.height = "300px";
    }

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

// Center an element in the viewport (used for popup windows on load)
function centerInViewport(el) {
  const left = Math.max(0, (window.innerWidth - el.offsetWidth) / 2);
  const top = Math.max(0, (window.innerHeight - el.offsetHeight) / 2);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

// Position an element in the top-right corner of the viewport, with a
// small margin so it isn't flush against the edge
function positionTopRight(el, margin = 10) {
  const left = Math.max(margin, window.innerWidth - el.offsetWidth - margin);
  el.style.left = `${left}px`;
  el.style.top = `${margin}px`;
}

// Load popup windows from popup-windows.html
let popupPath = "popup-windows.html";
fetch(popupPath)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to load popup-windows.html");
    }
    return response.text();
  })
  .then((html) => {
    const popupContainer = document.getElementById("popup-windows-container");

    // Parse the full HTML document string from popup-windows.html
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract ONLY the .winpopup elements
    const popups = doc.querySelectorAll(".winpopup");

    // Clear container and append only the extracted popup elements
    popupContainer.innerHTML = "";
    popups.forEach((popup) => {
      popup.style.display = "block"; // Make popup visible on load
      popupContainer.appendChild(popup);

      // The image popup goes in the top-right corner; everything else
      // stays centered in the viewport on load
      if (popup.id === "popup-image") {
        positionTopRight(popup);
      } else {
        centerInViewport(popup);
      }
    });
  })
  .catch((error) => {
    console.error("Error loading popup-windows.html:", error);
  });

// Load content into a window
function loadWindowContent(windowId, filePath) {
  const windowElement = document.getElementById(windowId);
  const contentElement = windowElement.querySelector(".window-content");

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
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      let insert = "";

      const section = doc.querySelector("section.window");
      if (section) {
        const tmp = document.createElement("div");
        tmp.innerHTML = section.innerHTML;
        const hdr = tmp.querySelector("h1.window-header");
        if (hdr) hdr.remove();
        insert = tmp.innerHTML;
      } else {
        insert = doc.body.innerHTML;
      }

      contentElement.innerHTML = insert;
    })
    .catch((error) => {
      contentElement.innerHTML = `<p>Error loading content: ${error.message}</p>`;
    });
}

// Maximize or restore a popup window
function maximizeWindow(button) {
  const win = button.closest(".winpopup, .window");

  if (win.classList.contains("maximized")) {
    // restore to non-maximized size
    win.classList.remove("maximized");

    const viewportWidth = window.innerWidth;

    if (viewportWidth >= 400 && viewportWidth <= 800) {
      win.style.width = "300px";
      win.style.height = "300px";
      win.style.top = "20px";
      win.style.left = "50px";
    } else {
      // Standard restore dimensions
      win.style.width = "400px";
      win.style.height = "400px";
      win.style.top = "150px";
      win.style.left = "200px";
    }
  } else {
    // maximize to full screen
    win.classList.add("maximized");
    win.style.width = "390px";
    win.style.height = "90%";
    win.style.top = "5px";
    win.style.left = "5px";
    win.style.bottom = "5px";
  }
}

// Minimize a popup window
function minimizeWindow(button) {
  const windowElement = button.closest(".window, .winpopup");
  let contentElement = windowElement.querySelector(
    ".window-content, .file-explorer",
  );
  if (!contentElement) {
    contentElement = windowElement;
  }

  // Hide window content, shrink, and fully remove from flow
  contentElement.style.display = "none";
  windowElement.style.width = "0px";
  windowElement.style.height = "0px";
  windowElement.style.display = "none";

  // Only add/manage the taskbar button if viewport width is 800px or greater
  if (window.innerWidth >= 800) {
    let taskbarButtons = document.getElementById("taskbar-buttons");
    if (!taskbarButtons) {
      const nav = document.querySelector(".taskbar");
      if (nav) {
        taskbarButtons = document.createElement("ul");
        taskbarButtons.id = "taskbar-buttons";
        nav.appendChild(taskbarButtons);
      }
    }

    let taskbarButton = document.querySelector(
      `[data-window-id="${windowElement.id}"]`,
    );
    if (!taskbarButton) {
      taskbarButton = document.createElement("button");
      taskbarButton.className = "taskbar-button";
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
        windowElement.style.display = "block";
        contentElement.style.display = "block";
        windowElement.style.width = "400px";
        windowElement.style.height = "400px";
        resetClickGuards(windowElement); // its buttons work again now that it's restored
        if (taskbarButton.parentElement) {
          taskbarButton.parentElement.remove();
        } else {
          taskbarButton.remove();
        }
      };
      const li = document.createElement("li");
      li.appendChild(taskbarButton);
      taskbarButtons.appendChild(li);
    }
  }
}

// Maps a window's id to the nav icon (if any) that opens it, so closing
// the window makes that icon clickable again.
const navIconForWindow = {
  "window-about": "about-icon",
  "window-projects": "projects-icon",
};

// Close a popup window
function closeWindow(button) {
  const windowElement = button.closest(".winpopup, .window");
  windowElement.style.display = "none";

  const id = windowElement.id || "";

  const navIconId = navIconForWindow[id];
  if (navIconId) {
    resetClickGuards(document.getElementById(navIconId));
  }

  const projectWindowIds = projectNames.map((name) => `window-${name}`);
  if (projectWindowIds.includes(id)) {
    setTimeout(() => openWindow("projects"), 10);
  }
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

    // Parse the fetched document and pull out just the file rows —
    // don't inject the whole raw document (its own <html>/<head>/<ul>)
    // into our existing list.
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const rows = doc.querySelectorAll(".file-row");

    fileExplorer.innerHTML = "";
    rows.forEach((row) => {
      fileExplorer.appendChild(row);

      // After loading, parse project names for dynamic loading
      const onclickAttr = row.getAttribute("onclick") || "";
      const match = onclickAttr.match(/openWindow\('([^']+)'\)/);
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
  Tally.openPopup("wMG8O8", {
    width: 385,
    onClose: () => resetClickGuards(document.getElementById("chat-icon")),
  });
}
