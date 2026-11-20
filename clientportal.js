// =====================================
// SUPABASE CONNECTION
// =====================================

const SUPABASE_URL = "https://rajyuhkatjdnnsifaxuh.supabase.co";

const SUPABASE_KEY = "sb_publishable_DHz9wzifauyVzhNyyBMeWw_aJfdPGab";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

supabaseClient.auth.getSession()
    .then(({ data, error }) => {
        if (error) {
            console.error("Supabase error:", error.message);
        } else {
            console.log("Supabase connection successful!");
            console.log("Current session:", data.session);
        }
    });

console.log("Supabase connected!");





document.addEventListener("DOMContentLoaded", () => {

    // ICONS
    if (window.lucide) {
        lucide.createIcons();
    }

    // DATE
    const dateElement = document.getElementById("currentDate");

    if (dateElement) {
        dateElement.textContent = new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }

    // PAGE NAVIGATION
    const navLinks = document.querySelectorAll("[data-page]");
    const pages = document.querySelectorAll(".page");
    const breadcrumb = document.getElementById("breadcrumbPage");

    function showPage(pageName) {
        const target = document.getElementById(pageName);

        if (!target) return;

        pages.forEach(page => {
            page.classList.remove("active");
        });

        target.classList.add("active");

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.page === pageName
            );
        });

        const activeLink = document.querySelector(
            `.nav-link[data-page="${pageName}"]`
        );

        if (breadcrumb) {
            breadcrumb.textContent = activeLink
                ? activeLink.querySelector("span").textContent
                : pageName.charAt(0).toUpperCase() + pageName.slice(1);
        }

        closeSidebar();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            showPage(link.dataset.page);
        });
    });


    // MOBILE SIDEBAR
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const overlay = document.getElementById("mobileOverlay");

    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        document.body.style.overflow = "";
    }

    function openSidebar() {
        sidebar.classList.add("open");
        overlay.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    menuToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener("click", closeSidebar);
});


