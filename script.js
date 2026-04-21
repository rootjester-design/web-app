let menuOpen = false;

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  const overlay = document.getElementById("overlay");

  if (!menuOpen) {
    nav.style.right = "0px";
    overlay.style.display = "block";
    menuOpen = true;
  } else {
    nav.style.right = "-260px";
    overlay.style.display = "none";
    menuOpen = false;
  }
}