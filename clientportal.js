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





// =====================================
// DK VISUALS AUTHENTICATION
// =====================================

// Login
async function loginUser(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Login failed: " + error.message);
        return;
    }

    console.log("Successfully logged in:", data.user.email);

    await loadUserProfile();
}

// Logout
async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    window.location.reload();
}

// Load logged-in user's profile
async function loadUserProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        console.log("No user logged in.");
        return;
    }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Profile error:", error.message);
        return;
    }

    console.log("Logged-in profile:", profile);

    if (profile.role === "admin") {
        console.log("Welcome, DK VISUALS Admin!");
    } else {
        console.log("Welcome, Client!");
    }
}






// =====================================
// DK VISUALS LOGIN
// =====================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const errorMessage = document.getElementById("loginError");
        const loginButton = document.getElementById("loginButton");

        errorMessage.textContent = "";
        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            errorMessage.textContent = error.message;
            loginButton.disabled = false;
            loginButton.innerHTML = 'Sign in <span>→</span>';
            console.error("Login error:", error.message);
            return;
        }

        console.log("Login successful:", data.user.email);

        await showPortal();
    });
}


// =====================================
// SHOW PORTAL AFTER LOGIN
// =====================================

async function showPortal() {
    const { data: { user }, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !user) {
        console.error("Could not retrieve user.");
        return;
    }

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("full_name, company_name, role")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error("Profile error:", profileError.message);
        alert("Could not load your profile.");
        return;
    }

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("portalContent").style.display = "block";

// Get user information
const fullName = profile.full_name?.trim() || user.email.split("@")[0];
const firstName = fullName.split(" ")[0];

const roleLabel = profile.role === "admin"
    ? "DK VISUALS Admin"
    : "Client account";

// Sidebar profile
document.getElementById("userName").textContent = fullName;
document.getElementById("userRole").textContent = roleLabel;

// Avatar initials
document.getElementById("userAvatar").textContent =
    fullName.split(" ").map(part => part[0]).join("").toUpperCase();

// Welcome heading
document.getElementById("welcomeName").textContent = firstName + ".";

// Settings
document.getElementById("settingsName").value = fullName;
document.getElementById("settingsEmail").value = user.email;
document.getElementById("settingsRole").value = roleLabel;

    console.log("Welcome:", profile.full_name);
    console.log("Account role:", profile.role);

    if (profile.role === "admin") {
        console.log("DK VISUALS admin account detected.");
    } else {
        console.log("Client account detected.");
    }
}


// =====================================
// CHECK EXISTING SESSION
// =====================================

async function checkLoginSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        await showPortal();
    }
}

checkLoginSession();


