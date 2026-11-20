
/* =========================================
   DK VISUALS — ADMIN DASHBOARD
========================================= */


/* =========================================
   1. SUPABASE CONNECTION
========================================= */

const SUPABASE_URL = "https://rajyuhkatjdnnsifaxuh.supabase.co";

const SUPABASE_KEY = "sb_publishable_DHz9wzifauyVzhNyyBMeWw_aJfdPGab";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================
   2. GLOBAL DATA
========================================= */

let currentUser = null;
let currentProfile = null;
let allClients = [];

const pageNames = {
    dashboard: "Dashboard",
    clients: "Clients",
    projects: "Projects",
    invoices: "Invoices",
    messages: "Messages",
    files: "Files",
    settings: "Settings"
};


/* =========================================
   3. INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {
initializeProjectManagement();
initializeNavigation();
initializeModals();
initializeMobileMenu();
initializeButtons();
initializeSearch();
initializeClientCreation();
initializeSettings();

    await checkAdminAccess();

});


/* =========================================
   4. AUTHENTICATION
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

            showToast("Je hebt geen toegang tot het admin dashboard.");

            await supabaseClient.auth.signOut();

            window.location.href = "clientportal.html";
            return;
        }

        currentProfile = profile;

        updateAdminProfile();

        await loadDashboard();
        await loadClients();

        console.log("DK VISUALS Admin Dashboard connected.");

    } catch (error) {

        console.error("Authentication error:", error);

        showToast("Er ging iets mis bij het laden van je account.");

    }

}


/* =========================================
   5. ADMIN PROFILE
========================================= */

function updateAdminProfile() {

    if (!currentProfile) return;

    const name = currentProfile.full_name || "Administrator";

    const initials = name
        .trim()
        .split(/\s+/)
        .map(part => part.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase();

    const nameElement = document.getElementById("adminName");
    const avatarElement = document.getElementById("sidebarAvatar");
    const topbarAvatar = document.getElementById("topbarAvatar");

    if (nameElement) {
        nameElement.textContent = name;
    }

    if (avatarElement) {
        avatarElement.textContent = initials;
    }

    if (topbarAvatar) {
        topbarAvatar.textContent = initials;
    }

}


/* =========================================
   6. LOGOUT
========================================= */

async function logout() {

    const logoutButton = document.getElementById("logoutBtn");

    if (logoutButton) {
        logoutButton.disabled = true;
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {

        console.error("Logout error:", error);

        showToast("Uitloggen is niet gelukt.");

        if (logoutButton) {
            logoutButton.disabled = false;
        }

        return;
    }

    window.location.href = "clientportal.html";

}


/* =========================================
   7. NAVIGATION
========================================= */

function initializeNavigation() {

    const navLinks = document.querySelectorAll(".nav-item[data-page]");

    navLinks.forEach(link => {

        link.addEventListener("click", event => {

            event.preventDefault();

            const page = link.dataset.page;

            if (page) {
                showPage(page);
            }

        });

    });

    showPage("dashboard");

}


function showPage(pageName) {

    const targetPage = document.getElementById(`page-${pageName}`);

    if (!targetPage) {
        console.error("Page not found:", pageName);
        return;
    }

    // Hide all pages
    document.querySelectorAll(".admin-page").forEach(page => {
        page.classList.remove("active");
    });

    // Show selected page
    targetPage.classList.add("active");

    // Update navigation
    document.querySelectorAll(".nav-item[data-page]").forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );

    });

    // Update breadcrumb
    const breadcrumb = document.getElementById("breadcrumbPage");

    if (breadcrumb) {
        breadcrumb.textContent = pageNames[pageName] || pageName;
    }

    closeSidebar();

}


/* =========================================
   8. MODALS
========================================= */

function initializeModals() {

    // Open modal
    document.querySelectorAll("[data-open-modal]").forEach(button => {

        button.addEventListener("click", () => {

            const modalId = button.dataset.openModal;

            openModal(modalId);

        });

    });


    // Close modal
    document.querySelectorAll("[data-close-modal]").forEach(button => {

        button.addEventListener("click", () => {

            const modal = button.closest(".modal-overlay");

            if (modal) {
                closeModal(modal.id);
            }

        });

    });


    // Click outside modal
    document.querySelectorAll(".modal-overlay").forEach(overlay => {

        overlay.addEventListener("click", event => {

            if (event.target === overlay) {
                closeModal(overlay.id);
            }

        });

    });


    // Escape key
    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            document.querySelectorAll(".modal-overlay.active").forEach(modal => {
                closeModal(modal.id);
            });

        }

    });

}


function openModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) {
        console.warn("Modal not found:", modalId);
        return;
    }

    modal.classList.add("active");

    document.body.style.overflow = "hidden";

}


function closeModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.remove("active");

    if (!document.querySelector(".modal-overlay.active")) {
        document.body.style.overflow = "";
    }

}


/* =========================================
   9. MOBILE SIDEBAR
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

    document.getElementById("sidebar")?.classList.add("open");

}


function closeSidebar() {

    document.getElementById("sidebar")?.classList.remove("open");

}


/* =========================================
   10. BUTTONS
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

    const refreshButton = document.getElementById("refreshBtn");

    if (refreshButton) {
        refreshButton.disabled = true;
    }

    try {

        await loadDashboard();
        await loadClients();

        showToast("Dashboard bijgewerkt.");

    } catch (error) {

        console.error("Refresh error:", error);

        showToast("Dashboard kon niet worden vernieuwd.");

    }

    if (refreshButton) {
        refreshButton.disabled = false;
    }

}


/* =========================================
   11. DASHBOARD STATISTICS
========================================= */

async function loadDashboard() {

    // Client count
    const { count, error } = await supabaseClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client");

    const clientElement = document.getElementById("totalClients");

    if (clientElement) {

        clientElement.textContent = error
            ? "—"
            : count ?? 0;

    }

    // Other statistics will be connected
    // when their Supabase table structures are confirmed.

    const pendingInvoices = document.getElementById("pendingInvoices");
    const activeProjects = document.getElementById("activeProjects");
    const newMessages = document.getElementById("newMessages");

    if (activeProjects) activeProjects.textContent = "—";
    if (pendingInvoices) pendingInvoices.textContent = "—";
    if (newMessages) newMessages.textContent = "—";

}


/* =========================================
   12. CLIENTS
========================================= */

async function loadClients() {

    const table = document.getElementById("clientsTable");

    if (!table) return;

    const tbody = table.querySelector("tbody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                Klanten laden...
            </td>
        </tr>
    `;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, company_name, role")
        .eq("role", "client")
        .order("full_name", { ascending: true });

    if (error) {

        console.error("Clients loading error:", error);

        showTableMessage(
            table,
            "Klanten konden niet worden geladen."
        );

        return;
    }

    allClients = data || [];

    renderClients(allClients);

    const navCount = document.getElementById("clientNavCount");

    if (navCount) {
        navCount.textContent = allClients.length;
    }

}


function renderClients(clients) {

    const table = document.getElementById("clientsTable");

    if (!table) return;

    const tbody = table.querySelector("tbody");

    if (!tbody) return;

    if (!clients.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <h3>Geen klanten gevonden</h3>
                        <p>Nieuwe klanten verschijnen hier.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = clients.map(client => {

        const name = escapeHTML(client.full_name || "Naam onbekend");

        const company = escapeHTML(client.company_name || "—");

        const id = escapeHTML(client.id);

        return `
            <tr>
                <td>
                    <strong>${name}</strong>
                </td>

                <td>${company}</td>

                <td>—</td>

                <td>
                    <span class="status status-active">
                        Client
                    </span>
                </td>

                <td>
                    <span class="status status-active">
                        Active
                    </span>
                </td>

                <td>
                    <div class="table-actions">
                        <button
                            class="icon-btn"
                            type="button"
                            title="Client ID"
                            data-copy-client="${id}">
                            ↗
                        </button>
                    </div>
                </td>
            </tr>
        `;

    }).join("");

}


/* =========================================
   13. CLIENT SEARCH & FILTER
========================================= */

function initializeSearch() {

    const clientSearch = document.getElementById("clientSearch");

    const clientFilter = document.getElementById("clientFilter");

    if (clientSearch) {
        clientSearch.addEventListener("input", filterClients);
    }

    if (clientFilter) {
        clientFilter.addEventListener("change", filterClients);
    }

    // Search fields for other sections.
    // Their table data will be connected later.

    const searchFields = [
        "projectSearch",
        "messageSearch",
        "fileSearch"
    ];

    searchFields.forEach(id => {

        const field = document.getElementById(id);

        if (field) {
            field.addEventListener("input", () => {
                filterVisibleTable(id);
            });
        }

    });

    // Client ID copy button
    document.addEventListener("click", event => {

        const button = event.target.closest("[data-copy-client]");

        if (!button) return;

        const clientId = button.dataset.copyClient;

        copyToClipboard(clientId);

    });

}


function filterClients() {

    const searchValue = (
        document.getElementById("clientSearch")?.value || ""
    ).toLowerCase();

    const filterValue =
        document.getElementById("clientFilter")?.value || "";

    let filtered = allClients.filter(client => {

        const name = (client.full_name || "").toLowerCase();

        const company = (client.company_name || "").toLowerCase();

        return name.includes(searchValue) ||
            company.includes(searchValue);

    });

    if (filterValue && filterValue !== "all") {

        filtered = filtered.filter(client => {
            return client.role === filterValue;
        });

    }

    renderClients(filtered);

}


function filterVisibleTable(inputId) {

    const input = document.getElementById(inputId);

    if (!input) return;

    const tableIds = {
        projectSearch: "projectsTable",
        messageSearch: "messagesTable",
        fileSearch: "filesTable"
    };

    const table = document.getElementById(tableIds[inputId]);

    if (!table) return;

    const search = input.value.toLowerCase();

    table.querySelectorAll("tbody tr").forEach(row => {

        row.style.display = row.textContent.toLowerCase().includes(search)
            ? ""
            : "none";

    });

}


/* =========================================
   14. SETTINGS
========================================= */

/* =========================================
   CREATE CLIENT ACCOUNT
========================================= */

function initializeClientCreation() {

    const form = document.getElementById("clientForm");

    if (!form) return;

    const result = document.getElementById("clientResult");
    const passwordInput = document.getElementById("generatedPassword");
    const createButton = document.getElementById("createClientBtn");
    const copyButton = document.getElementById("copyPasswordBtn");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const formData = new FormData(form);

        const clientData = {
            full_name: formData.get("full_name").trim(),
            company_name: formData.get("company_name").trim(),
            email: formData.get("email").trim()
        };

        createButton.disabled = true;
        createButton.textContent = "Creating account...";

        result.style.display = "none";

        try {

            const { data, error } = await supabaseClient.functions.invoke(
                "create-client",
                {
                    body: clientData
                }
            );

if (error) {
    let details = {};

    try {
        details = await error.context.json();
    } catch (e) {
        console.error("Could not read server response:", e);
    }

    console.error("Edge Function response:", details);

    throw new Error(
        details.error ||
        details.message ||
        error.message
    );
}

            if (!data || !data.success) {
                throw new Error(data?.error || "Account creation failed.");
            }

            passwordInput.value = data.temporary_password;

            result.style.display = "block";

            createButton.textContent = "Client created";
            
            showToast("Client account successfully created.");

            await loadClients();

            form.querySelector('[name="full_name"]').value = "";
            form.querySelector('[name="company_name"]').value = "";
            form.querySelector('[name="email"]').value = "";

        } catch (error) {

            console.error("Client creation error:", error);

            showToast(error.message || "Something went wrong.");

            createButton.textContent = "Create client account";

        } finally {

            createButton.disabled = false;

        }

    });

    if (copyButton) {

        copyButton.addEventListener("click", async () => {

            try {

                await navigator.clipboard.writeText(passwordInput.value);

                showToast("Temporary password copied.");

            } catch (error) {

                showToast("Could not copy password.");

            }

        });

    }

}

function initializeSettings() {

    const saveButton = document.getElementById("saveSettings");

    if (!saveButton) return;

    saveButton.addEventListener("click", saveSettings);

    loadSettings();

}


function loadSettings() {

    if (!currentProfile) return;

    const nameInput = document.getElementById("settingsName");

    const emailInput = document.getElementById("settingsEmail");

    const roleInput = document.getElementById("settingsRole");

    if (nameInput) {
        nameInput.value = currentProfile.full_name || "";
    }

    if (emailInput) {
        emailInput.value = currentUser?.email || "";
    }

    if (roleInput) {
        roleInput.value = currentProfile.role || "";
    }

}


async function saveSettings() {

    if (!currentUser || !currentProfile) return;

    const nameInput = document.getElementById("settingsName");

    if (!nameInput) return;

    const fullName = nameInput.value.trim();

    if (!fullName) {
        showToast("Vul een naam in.");
        return;
    }

    const saveButton = document.getElementById("saveSettings");

    saveButton.disabled = true;

    const { data, error } = await supabaseClient
        .from("profiles")
        .update({
            full_name: fullName
        })
        .eq("id", currentUser.id)
        .select("id, full_name, company_name, role")
        .single();

    if (error) {

        console.error("Settings error:", error);

        showToast("Instellingen konden niet worden opgeslagen.");

        saveButton.disabled = false;

        return;
    }

    currentProfile = data;

    updateAdminProfile();

    showToast("Instellingen opgeslagen.");

    saveButton.disabled = false;

}


/* =========================================
   15. TABLE HELPERS
========================================= */

function showTableMessage(table, message) {

    const tbody = table.querySelector("tbody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    <h3>${escapeHTML(message)}</h3>
                </div>
            </td>
        </tr>
    `;

}


/* =========================================
   16. TOAST NOTIFICATIONS
========================================= */

function showToast(message) {

    const container = document.getElementById("toastContainer");

    if (!container) {
        console.log(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = "toast";

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform = "translateY(5px)";

        setTimeout(() => {
            toast.remove();
        }, 250);

    }, 3000);

}


/* =========================================
   17. CLIPBOARD
========================================= */

async function copyToClipboard(text) {

    try {

        await navigator.clipboard.writeText(text);

        showToast("Client ID gekopieerd.");

    } catch (error) {

        console.error("Clipboard error:", error);

        showToast("Kopiëren is niet gelukt.");

    }

}


/* =========================================
   18. HTML SECURITY HELPER
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






async function initializeProjectManagement() {
    const form = document.getElementById("projectForm");

    if (!form) return;

    const projectButton = document.querySelector(
        '[data-open-modal="projectModal"]'
    );

    if (projectButton) {
        projectButton.addEventListener("click", loadProjectClients);
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);

        const project = {
            client_id: formData.get("client_id"),
            name: formData.get("project_name"),
            description: formData.get("description"),
            start_date: formData.get("start_date") || null,
            due_date: formData.get("deadline") || null,
            status: formData.get("status") || "pending",
            progress: 0
        };

        const { error } = await supabaseClient
            .from("projects")
            .insert(project);

        if (error) {
            console.error("Project creation error:", error);
            showToast(error.message);
            return;
        }

        showToast("Project successfully created.");

        form.reset();

        const modal = document.getElementById("projectModal");
        if (modal) modal.classList.remove("active");

        await loadProjects();
    });

    await loadProjects();
}

async function loadProjectClients() {
    const select = document.getElementById("projectClientSelect");

    if (!select) return;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, company_name")
        .eq("role", "client")
        .order("full_name");

    if (error) {
        console.error(error);
        showToast("Could not load clients.");
        return;
    }

    select.innerHTML = '<option value="">Select a client</option>';

    (data || []).forEach(client => {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent =
            client.company_name || client.full_name || "Unnamed client";

        select.appendChild(option);
    });
}

async function loadProjects() {
    const table = document.getElementById("projectsTable");

    if (!table) return;

    const { data, error } = await supabaseClient
        .from("projects")
        .select(`
            id,
            name,
            description,
            status,
            progress,
            start_date,
            due_date,
            client_id,
            profiles (
                full_name,
                company_name
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Loading projects:", error);
        showToast("Could not load projects.");
        return;
    }

    const rows = data || [];

    table.innerHTML = rows.map(project => {
        const client = project.profiles || {};
        const clientName =
            client.company_name || client.full_name || "Unknown client";

        return `
            <tr>
                <td>
                    <strong>${escapeHTML(project.name)}</strong>
                    <small>${escapeHTML(project.description || "")}</small>
                </td>
                <td>${escapeHTML(clientName)}</td>
                <td>
                    <select onchange="updateProjectStatus('${project.id}', this.value)">
                        ${["pending", "in_progress", "review", "completed"].map(status => `
                            <option value="${status}" ${project.status === status ? "selected" : ""}>
                                ${status.replace("_", " ")}
                            </option>
                        `).join("")}
                    </select>
                </td>
                <td>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value="${project.progress ?? 0}"
                        style="width:65px"
                        onchange="updateProjectProgress('${project.id}', this.value)"
                    > %
                </td>
                <td>${project.due_date || "—"}</td>
                <td>
                    <button onclick="deleteProject('${project.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    if (!rows.length) {
        table.innerHTML = `
            <tr><td colspan="6">No projects yet.</td></tr>
        `;
    }
}

async function updateProjectStatus(id, status) {
    const { error } = await supabaseClient
        .from("projects")
        .update({ status })
        .eq("id", id);

    if (error) {
        showToast(error.message);
        return;
    }

    showToast("Project status updated.");
}

async function updateProjectProgress(id, progress) {
    const value = Math.max(0, Math.min(100, Number(progress)));

    const { error } = await supabaseClient
        .from("projects")
        .update({ progress: value })
        .eq("id", id);

    if (error) {
        showToast(error.message);
        return;
    }

    showToast("Project progress updated.");
}

async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("projects")
        .delete()
        .eq("id", id);

    if (error) {
        showToast(error.message);
        return;
    }

    showToast("Project deleted.");
    await loadProjects();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

window.updateProjectStatus = updateProjectStatus;
window.updateProjectProgress = updateProjectProgress;
window.deleteProject = deleteProject;
