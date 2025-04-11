function openWindow(name) {
  document
    .querySelectorAll(".window")
    .forEach((win) => (win.style.display = "none"));
  const win = document.getElementById(`window-${name}`);
  if (win) {
    win.style.display = "block";
    win.style.zIndex = Date.now(); // bring to front
  }
}

// Drag functionality
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
