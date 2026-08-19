const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const grey = document.getElementById("grey");


/* =========================
   SCROLL DETECTION
   ========================= */

function updateHeader() {
    if (window.scrollY > 50) {
        document.body.classList.add("scrolled");
    } else {
        document.body.classList.remove("scrolled");
    }
}


/* Check immediately when page loads */

updateHeader();


/* Check whenever user scrolls */

window.addEventListener("scroll", updateHeader);


/* =========================
   OPEN / CLOSE MENU
   ========================= */

menuBtn.addEventListener("click", () => {

    menuBtn.classList.toggle("active");

    sidebar.classList.toggle("active");

    grey.classList.toggle("active");

});


/* =========================
   CLOSE MENU BY CLICKING
   GREY OVERLAY
   ========================= */

grey.addEventListener("click", () => {

    menuBtn.classList.remove("active");

    sidebar.classList.remove("active");

    grey.classList.remove("active");

});