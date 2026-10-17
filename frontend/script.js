
const form = document.getElementById("auth-form");
const nameField = document.getElementById("name-field");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordHint = document.getElementById("password-hint");

const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");
const submitButton = document.getElementById("submit-button");
const submitLabel = document.getElementById("submit-label");
const switchCopy = document.getElementById("switch-copy");
const switchModeButton = document.getElementById("switch-mode");
const togglePasswordButton = document.getElementById("toggle-password");
const statusMessage = document.getElementById("status-message");

let mode = "login";
let isSubmitting = false;

function clearStatus() {
  statusMessage.textContent = "";
  statusMessage.className = "status-message";
  statusMessage.hidden = true;
}

function showStatus(message, type = "error") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.hidden = false;
}

function clearFieldErrors() {
  for (const id of ["name", "email", "password"]) {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);

    input.removeAttribute("aria-invalid");
    error.textContent = "";
  }
}

function setFieldError(field, message) {
  const input = document.getElementById(field);
  const error = document.getElementById(`${field}-error`);

  input.setAttribute("aria-invalid", "true");
  error.textContent = message;
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === "signup";

  clearStatus();
  clearFieldErrors();
  form.reset();

  nameField.hidden = !isSignup;
  nameInput.required = isSignup;
  passwordHint.hidden = !isSignup;

  passwordInput.autocomplete = isSignup
    ? "new-password"
    : "current-password";

  loginTab.classList.toggle("active", !isSignup);
  signupTab.classList.toggle("active", isSignup);

  loginTab.setAttribute("aria-selected", String(!isSignup));
  signupTab.setAttribute("aria-selected", String(isSignup));

  formTitle.innerHTML = isSignup
    ? 'Create your account<span class="brand-dot">.</span>'
    : 'Welcome back<span class="brand-dot">.</span>';

  formSubtitle.textContent = isSignup
    ? "Create an account to begin your journey."
    : "Enter your details to sign in to your account.";

  submitLabel.textContent = isSignup ? "Create account" : "Sign in";

  switchCopy.textContent = isSignup
    ? "Already have an account?"
    : "New to UptoSkills?";

  switchModeButton.textContent = isSignup
    ? "Sign in"
    : "Create an account";
}

loginTab.addEventListener("click", () => setMode("login"));
signupTab.addEventListener("click", () => setMode("signup"));

switchModeButton.addEventListener("click", () => {
  setMode(mode === "login" ? "signup" : "login");
});

togglePasswordButton.addEventListener("click", () => {
  const showing = passwordInput.type === "text";

  passwordInput.type = showing ? "password" : "text";
  togglePasswordButton.textContent = showing ? "Show" : "Hide";
  togglePasswordButton.setAttribute("aria-pressed", String(!showing));
});

for (const input of [nameInput, emailInput, passwordInput]) {
  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");

    const error = document.getElementById(`${input.id}-error`);
    error.textContent = "";
    clearStatus();
  });
}

function validateForm() {
  clearFieldErrors();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let valid = true;

  if (mode === "signup" && (!name || name.length > 100)) {
    setFieldError("name", "Enter a name between 1 and 100 characters.");
    valid = false;
  }

  if (
    !email ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setFieldError("email", "Enter a valid email address.");
    valid = false;
  }

  if (
    !password ||
    (mode === "signup" && (password.length < 8 || password.length > 72))
  ) {
    setFieldError(
      "password",
      mode === "signup"
        ? "Password must be 8–72 characters long."
        : "Enter your password."
    );
    valid = false;
  }

  return valid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting || !validateForm()) {
    return;
  }

  isSubmitting = true;
  clearStatus();

  submitButton.disabled = true;
  submitLabel.textContent = mode === "signup"
    ? "Creating account..."
    : "Signing in...";

  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value,
  };

  if (mode === "signup") {
    payload.name = nameInput.value.trim();
  }

  try {
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showStatus(data.message || "Request failed. Please try again.");
      return;
    }

    showStatus(
      mode === "signup"
        ? "Your account is ready! Opening your dashboard..."
        : "Login successful! Opening your dashboard...",
      "success"
    );

    window.location.assign("/dashboard.html");
  } catch (error) {
    console.error("Authentication request failed:", error);
    showStatus("Unable to connect to the server. Please try again.");
  } finally {
    isSubmitting = false;
    submitButton.disabled = false;
    submitLabel.textContent = mode === "signup"
      ? "Create account"
      : "Sign in";
  }
});

async function redirectIfAuthenticated() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "same-origin",
    });

    if (response.ok) {
      window.location.replace("/dashboard.html");
    }
  } catch (error) {
    console.error("Session check failed:", error);
  }
}

redirectIfAuthenticated();
