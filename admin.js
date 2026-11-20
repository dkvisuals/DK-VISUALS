
/* =========================================
   DK VISUALS — ADMIN DASHBOARD
========================================= */

// SUPABASE CONNECTION
const SUPABASE_URL = "https://rajyuhkatjdnnsifaxuh.supabase.co";
const SUPABASE_KEY = "sb_publishable_DHz9wzifauyVzhNyyBMeWw_aJfdPGab";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// GLOBAL DATA
let currentUser = null;
let currentProfile = null;
let allClients = [];


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {
    initializeNavigation();
    initializeModals();
    initializeMobileMenu();
    initializeButtons();
    initializeClientSearch();

    await checkAdminAccess();
});


/* =========================================
   AUTHENTICATION & ADMIN ACCESS
========================================= */

async function checkAdminAccess() {
    try {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) {
            window.location.href = "clientportal.html";
            return;
        }

        currentUser = data.user;

        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, company_name, role")
                .eq("id", currentUser.id)
                .single();

        if (profileError || !profile || profile.role !== "admin") {
            alert("Je hebt geen toegang tot het admin dashboard.");
            await supabaseClient.auth.signOut();
            window.location.href = "clientportal.html";
            return;
        }

        currentProfile = profile;

        updateAdminProfile();
        await loadDashboard();
        await loadClients();

    } catch (error) {
        console.error("Authentication error:", error);
        alert("Er ging iets mis bij het controleren van je account.");
    }
}


function updateAdminProfile() {
    const name = currentProfile.full_name || "Administrator";
    const initials = name
        .split(" ")
        .map(part => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    const nameElement = document.querySelector(".admin-profile strong");
    const roleElement = document.querySelector(".admin-profile span");
    const avatarElement = document.querySelector(".admin-avatar");

    if (nameElement) nameElement.textContent = name;
    if (roleElement) roleElement.textContent = "Administrator";
    if (avatarElement) avatarElement.textContent = initials;
}


/* =========================================
   LOGOUT
========================================= */

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Uitloggen is niet gelukt.");
        console.error(error);
        return;
    }

    window.location.href = "clientportal.html";
}


/* =========================================
   NAVIGATION
========================================= */

function initializeNavigation() {
    const navLinks = document.querySelectorAll("[data-page]");

    navLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            const page = link.dataset.page;
            if (!page) return;

            showPage(page);
        });
    });
}


function showPage(pageName) {
    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    const targetPage = document.getElementById(pageName);

    if (targetPage) {
        targetPage.classList.add("active");
    }

    document.querySelectorAll("[data-page]").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

    const breadcrumb = document.querySelector(".breadcrumb strong");

    if (breadcrumb) {
        breadcrumb.textContent =
            pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }

    closeSidebar();
}


/* =========================================
   MODALS
========================================= */

function initializeModals() {
    document.querySelectorAll("[data-open-modal]").forEach(button => {
        button.addEventListener("click", () => {
            const modalId = button.dataset.openModal;
            openModal(modalId);
        });
    });

    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => {
            const modal = button.closest(".modal");
            if (modal) closeModal(modal.id);
        });
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".modal.active").forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}


function openModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.add("active");
    }
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove("active");
    }
}


/* =========================================
   MOBILE SIDEBAR
========================================= */

function initializeMobileMenu() {
    const menuButton = document.getElementById("mobileMenu");
    const closeButton = document.getElementById("sidebarClose");

    if (menuButton) {
        menuButton.addEventListener("click", openSidebar);
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeSidebar);
    }
}


function openSidebar() {
    document.querySelector(".sidebar")?.classList.add("open");
}


function closeSidebar() {
    document.querySelector(".sidebar")?.classList.remove("open");
}


/* =========================================
   BUTTONS
========================================= */

function initializeButtons() {
    const logoutButton = document.getElementById("logoutBtn");
    const refreshButton = document.getElementById("refreshBtn");
    const dashboardRefresh = document.getElementById("dashboardRefresh");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", refreshDashboard);
    }

    if (dashboardRefresh) {
        dashboardRefresh.addEventListener("click", refreshDashboard);
    }
}


async function refreshDashboard() {
    await loadDashboard();
    await loadClients();
}


/* =========================================
   DASHBOARD STATISTICS
========================================= */

async function loadDashboard() {
    await Promise.all([
        loadStat("profiles", "totalClients", "role"),
        loadStat("projects", "activeProjects"),
        loadStat("invoices", "pendingInvoices"),
        loadStat("messages", "newMessages")
    ]);
}


async function loadStat(table, elementId, filterColumn = null) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let query = supabaseClient
        .from(table)
        .select("*", { count: "exact", head: true });

    if (table === "profiles") {
        query = query.eq("role", "client");
    }

    if (table === "invoices" && filterColumn) {
        query = query.eq(filterColumn, "pending");
    }

    if (table === "messages" && filterColumn) {
        query = query.eq(filterColumn, "false");
    }

    const { count, error } = await query;

    if (error) {
        console.warn(`Could not load ${table}:`, error.message);
        element.textContent = "—";
        return;
    }

    element.textContent = count ?? 0;
}


/* =========================================
   CLIENTS
========================================= */

async function loadClients() {
    const table = document.getElementById("clientsTable");
    if (!table) return;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, company_name, role")
        .eq("role", "client")
        .order("full_name", { ascending: true });

    if (error) {
        console.error("Clients could not be loaded:", error);
        showTableMessage(table, "Klanten konden niet worden geladen.");
        return;
    }

    allClients = data || [];
    renderClients(allClients);
}


function renderClients(clients) {
    const table = document.getElementById("clientsTable");
    if (!table) return;

    const tbody = table.tagName === "TBODY"
        ? table
        : table.querySelector("tbody");

    if (!tbody) return;

    if (clients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <h3>Geen klanten gevonden</h3>
                        <p>Nieuwe klanten verschijnen hier.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>
                <span class="table-primary">
                    ${escapeHTML(client.full_name || "Naam onbekend")}
                </span>
            </td>
            <td>${escapeHTML(client.company_name || "—")}</td>
            <td>
                <span class="status status-active">Client</span>
            </td>
            <td>
                <span class="table-secondary">
                    ${escapeHTML(client.id)}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn"
                        title="Bekijk klant"
                        data-client-id="${escapeHTML(client.id)}">
                        ↗
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}


/* =========================================
   CLIENT SEARCH & FILTER
========================================= */

function initializeClientSearch() {
    const search = document.getElementById("clientSearch");
    const filter = document.getElementById("clientFilter");

    if (search) {
        search.addEventListener("input", filterClients);
    }

    if (filter) {
        filter.addEventListener("change", filterClients);
    }
}


function filterClients() {
    const searchValue =
        document.getElementById("clientSearch")?.value.toLowerCase() || "";

    const filterValue =
        document.getElementById("clientFilter")?.value || "";

    let filtered = allClients.filter(client => {
        const name = (client.full_name || "").toLowerCase();
        const company = (client.company_name || "").toLowerCase();

        return name.includes(searchValue) ||
            company.includes(searchValue);
    });

    if (filterValue && filterValue !== "all") {
        filtered = filtered.filter(client =>
            client.role === filterValue
        );
    }

    renderClients(filtered);
}


/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


function showTableMessage(table, message) {
    const tbody = table.tagName === "TBODY"
        ? table
        : table.querySelector("tbody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="empty-state">
                    <h3>${escapeHTML(message)}</h3>
                </div>
            </td>
        </tr>
    `;
}
