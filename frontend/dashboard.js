
const userName = document.getElementById("user-name");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileCreated = document.getElementById("profile-created");
const dashboardStatus = document.getElementById("dashboard-status");
const logoutButton = document.getElementById("logout-button");

async function loadDashboard() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "same-origin",
    });

    if (response.status === 401) {
      window.location.replace("/");
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to load your account.");
    }

    const data = await response.json();
    const user = data.user;

    // Use textContent for user-provided data to prevent HTML injection.
    userName.textContent = user.name;
    profileName.textContent = user.name;
    profileEmail.textContent = user.email;

    profileCreated.textContent = user.created_at
      ? new Date(user.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not available";
  } catch (error) {
    console.error("Dashboard loading failed:", error);
    dashboardStatus.textContent =
      "We couldn't load your account. Please refresh the page.";
  }
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Logout failed.");
    }

    window.location.replace("/");
  } catch (error) {
    console.error("Logout failed:", error);
    dashboardStatus.textContent =
      "Unable to log out. Please try again.";
    logoutButton.disabled = false;
    logoutButton.innerHTML = 'Log out <span aria-hidden="true">↗</span>';
  }
});

loadDashboard();
