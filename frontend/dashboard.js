
const userName = document.getElementById("user-name");
const profileName = document.getElementById("profile-name");
const profileUsername = document.getElementById("profile-username");
const profileEmail = document.getElementById("profile-email");
const profileCreated = document.getElementById("profile-created");
const dashboardStatus = document.getElementById("dashboard-status");

const logoutButton = document.getElementById("logout-button");
const openProfileButton = document.getElementById("open-profile-button");
const securityEditButton = document.getElementById("security-edit-button");
const closeProfileButton = document.getElementById("close-profile-button");
const profileModal = document.getElementById("profile-modal");

const settingsMenu = document.getElementById("settings-menu");
const showProfileOption = document.getElementById("show-profile-option");
const showPasswordOption = document.getElementById("show-password-option");
const profileEditSection = document.getElementById("profile-edit-section");
const passwordEditSection = document.getElementById("password-edit-section");
const backFromProfile = document.getElementById("back-from-profile");
const backFromPassword = document.getElementById("back-from-password");

const profileForm = document.getElementById("profile-form");
const editUsername = document.getElementById("edit-username");
const editEmail = document.getElementById("edit-email");
const saveProfileButton = document.getElementById("save-profile-button");

const passwordForm = document.getElementById("password-form");
const currentPassword = document.getElementById("current-password");
const newPassword = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");
const changePasswordButton = document.getElementById("change-password-button");

const successToast = document.getElementById("success-toast");

let toastTimer;

function showStatus(element, message, isError = false) {
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("is-error", isError);
  element.classList.toggle("is-success", !isError && Boolean(message));
}

function showPopup(message, isError = false) {
  successToast.textContent = message;
  successToast.classList.toggle("toast-error", isError);
  successToast.classList.toggle("toast-success", !isError);
  successToast.classList.add("show");

  window.clearTimeout(toastTimer);

  toastTimer = window.setTimeout(() => {
    successToast.classList.remove("show");
  }, 3500);
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status}).`
    );
  }

  return data;
}

async function requestCurrentUser() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin"
  });

  if (response.status === 401) {
    window.location.replace("/");
    throw new Error("Your session has expired. Please sign in again.");
  }

  const data = await readResponse(response);

  if (!data.user) {
    throw new Error("Account details were not returned by the server.");
  }

  return data.user;
}

function displayUser(user) {
  userName.textContent = user.name || "there";
  profileName.textContent = user.name || "Not available";
  profileUsername.textContent = user.username || "Not available";
  profileEmail.textContent = user.email || "Not available";

  editUsername.value = user.username || "";
  editEmail.value = user.email || "";

  profileCreated.textContent = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Not available";
}

async function loadDashboard() {
  try {
    const user = await requestCurrentUser();
    displayUser(user);
  } catch (error) {
    console.error("Dashboard loading failed:", error);

    if (!dashboardStatus) return;

    showStatus(
      dashboardStatus,
      error.message || "Unable to load your account. Please refresh.",
      true
    );
  }
}

/* Modal navigation */

function showSettingsMenu() {
  settingsMenu.hidden = false;
  profileEditSection.hidden = true;
  passwordEditSection.hidden = true;
}

function openSettings() {
  showSettingsMenu();
  profileModal.hidden = false;
  showProfileOption.focus();
}

function closeSettings() {
  profileModal.hidden = true;
  openProfileButton.focus();
}

openProfileButton.addEventListener("click", openSettings);
securityEditButton.addEventListener("click", openSettings);

closeProfileButton.addEventListener("click", closeSettings);

profileModal.addEventListener("click", event => {
  if (event.target === profileModal) {
    closeSettings();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !profileModal.hidden) {
    closeSettings();
  }
});

showProfileOption.addEventListener("click", () => {
  settingsMenu.hidden = true;
  passwordEditSection.hidden = true;
  profileEditSection.hidden = false;

  editUsername.focus();
});

showPasswordOption.addEventListener("click", () => {
  settingsMenu.hidden = true;
  profileEditSection.hidden = true;
  passwordEditSection.hidden = false;

  currentPassword.focus();
});

backFromProfile.addEventListener("click", showSettingsMenu);
backFromPassword.addEventListener("click", showSettingsMenu);

/* Update username and email */

profileForm.addEventListener("submit", async event => {
  event.preventDefault();

  const username = editUsername.value.trim();
  const email = editEmail.value.trim();

  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    showPopup(
      "Username must be 3–30 characters and contain only letters, numbers, and underscores.",
      true
    );
    return;
  }

  if (!email || !editEmail.validity.valid) {
    showPopup("Please enter a valid email address.", true);
    return;
  }

  saveProfileButton.disabled = true;
  saveProfileButton.textContent = "Saving...";

  try {
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, email })
    });

    const data = await readResponse(response);

    // Refresh from the server so the dashboard shows persisted values.
    const user = await requestCurrentUser();
    displayUser(user);

    showSettingsMenu();
    closeSettings();

    showPopup(data.message || "Profile updated successfully!");
  } catch (error) {
    console.error("Profile update failed:", error);
    showPopup(error.message || "Unable to update your profile.", true);
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "Save Changes";
  }
});

/* Change password */

passwordForm.addEventListener("submit", async event => {
  event.preventDefault();

  const current = currentPassword.value;
  const next = newPassword.value;
  const confirmation = confirmPassword.value;

  if (next.length < 8) {
    showPopup("Your new password must be at least 8 characters.", true);
    return;
  }

  if (next !== confirmation) {
    showPopup("The new passwords do not match.", true);
    return;
  }

  if (current === next) {
    showPopup("Choose a password different from your current one.", true);
    return;
  }

  changePasswordButton.disabled = true;
  changePasswordButton.textContent = "Updating...";

  try {
    const response = await fetch("/api/auth/change-password", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword: current,
        newPassword: next
      })
    });

    const data = await readResponse(response);

    passwordForm.reset();
    showSettingsMenu();
    closeSettings();

    showPopup(data.message || "Password changed successfully!");
  } catch (error) {
    console.error("Password change failed:", error);
    showPopup(error.message || "Unable to change your password.", true);
  } finally {
    changePasswordButton.disabled = false;
    changePasswordButton.textContent = "Update Password";
  }
});

/* Logout */

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });

    await readResponse(response);
    window.location.replace("/");
  } catch (error) {
    console.error("Logout failed:", error);

    showStatus(
      dashboardStatus,
      "Unable to log out. Please try again.",
      true
    );

    logoutButton.disabled = false;
    logoutButton.innerHTML = 'Log out <span aria-hidden="true">↗</span>';
  }
});

loadDashboard();
