// =========================
// discord.js (as module)
// =========================

const clientId = "1403159925244428368";
const redirectUri = "https://fortnite-settings-tracker.vercel.app/";

// Login button click handler
document.getElementById("discord-login")?.addEventListener("click", async () => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem("discord_code_verifier", codeVerifier);

  const authUrl = `https://discord.com/oauth2/authorize?response_type=code&client_id=${clientId}&scope=identify&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  window.location.href = authUrl;
});

// Handle redirect from Discord OAuth
window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    const codeVerifier = localStorage.getItem("discord_code_verifier");
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    // Store in localStorage
    localStorage.setItem("discord_id", userData.id);
    localStorage.setItem("discord_username", userData.username);
    localStorage.setItem("discord_avatar", userData.avatar);

    // Clean the URL
    window.history.replaceState({}, document.title, "/");
    location.reload();
  }

  // Check if logged in
  const userId = localStorage.getItem("discord_id");
  const username = localStorage.getItem("discord_username");
  const avatarHash = localStorage.getItem("discord_avatar");

  if (userId && username && avatarHash) {
    const userInfoDiv = document.getElementById("user-info");
    const loginBtn = document.getElementById("discord-login");
    const avatarContainer = document.getElementById("user-controls");
    const avatarImg = document.getElementById("header-avatar-img");

    // Hide login, show avatar + logout
    if (loginBtn) loginBtn.style.display = "none";
    if (avatarContainer) avatarContainer.classList.remove("hidden");

    // Try .gif, fallback to .png
    const gifUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.gif`;
    const pngUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;

    try {
      const res = await fetch(gifUrl);
      if (res.ok) {
        avatarImg.src = gifUrl;
      } else {
        avatarImg.src = pngUrl;
      }
    } catch {
      avatarImg.src = pngUrl;
    }

    // Welcome message (without discriminator)
    if (userInfoDiv) {
      userInfoDiv.innerHTML = `<p class="mt-4 text-green-400">Welcome back, ${username}</p>`;
    }
  }
});

// Logout button
document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem("discord_id");
  localStorage.removeItem("discord_username");
  localStorage.removeItem("discord_avatar");
  localStorage.removeItem("discord_code_verifier");
  location.reload();
});

// PKCE helpers
function generateCodeVerifier() {
  const array = new Uint32Array(56);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
