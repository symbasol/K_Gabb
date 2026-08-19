const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const grey = document.getElementById("grey");
const swimming = document.getElementById("swimming"), 
    piano = document.getElementById("piano"), 
    programming = document.getElementById("programming"), 
    maker = document.getElementById("maker"), 
    snowboarding = document.getElementById("snowboarding"), 
    saxophone = document.getElementById("saxophone"), 
    soccer = document.getElementById("soccer"), 
    tennis = document.getElementById("tennis");
const track = document.getElementById("gallery-track");
const images = track.querySelectorAll("img");

let currentIndex = 0;

document.getElementById("next").addEventListener("click", () => {
    currentIndex++;

    if (currentIndex >= images.length) {
        currentIndex = 0;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;
});

document.getElementById("prev").addEventListener("click", () => {
    currentIndex--;

    if (currentIndex < 0) {
        currentIndex = images.length - 1;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;
});

swimming.style.cursor = "pointer";
piano.style.cursor = "pointer";
programming.style.cursor = "pointer";
maker.style.cursor = "pointer";
snowboarding.style.cursor = "pointer";
saxophone.style.cursor = "pointer";
soccer.style.cursor = "pointer";
tennis.style.cursor = "pointer";

swimming.addEventListener("click", () => {
    window.location.href = "./pages/Swimming.html";
})

piano.addEventListener("click", () => {
    window.location.href = "./pages/Piano.html";
})

programming.addEventListener("click", () => {
    window.location.href = "./pages/Programming.html";
})

maker.addEventListener("click", () => {
    window.location.href = "./pages/Maker.html";
})

snowboarding.addEventListener("click", () => {
    window.location.href = "./pages/Snowboarding.html";
})

saxophone.addEventListener("click", () => {
    window.location.href = "./pages/Saxophone.html";
})

soccer.addEventListener("click", () => {
    window.location.href = "./pages/Soccer.html";
})

tennis.addEventListener("click", () => {
    window.location.href = "./pages/Tennis.html";
})


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

const slides = setInterval(() => {
    currentIndex++;

    if (currentIndex >= images.length) {
        currentIndex = 0;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;
}, 4000)