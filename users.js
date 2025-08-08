import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase.js";

const params = new URLSearchParams(window.location.search);
let discordId = params.get("id");

if (!discordId) {
  const enteredId = prompt("Please enter a Discord ID:");
  if (enteredId) {
    const newUrl = `${window.location.pathname}?id=${encodeURIComponent(enteredId)}`;
    window.location.href = newUrl;
  } else {
    alert("A Discord ID is required to view this page.");
  }
}

async function init() {
  try {
    const db = getDatabase(app);
    const userRef = ref(db, `users/${discordId}/settings`);
    const [userSnap, settingsListRes] = await Promise.all([
      get(userRef),
      fetch("settingslist.json"),
    ]);

    if (!userSnap.exists()) {
      alert("User not found.");
      throw new Error("No user data found.");
    }

    const data = userSnap.val();
    const settingsList = await settingsListRes.json();

    document.getElementById("fn-username").textContent = data.fortniteUsername || "N/A";
    document.getElementById("discord-username").textContent = data.discordUsername || "N/A";
    document.getElementById("platform").textContent = data.platform || "N/A";

    const keybindsList = document.getElementById("keybinds-list");
    keybindsList.innerHTML = "";

    if (data.keybinds && typeof data.keybinds === "object") {
      let foundAny = false;

      settingsList.forEach((settingName) => {
        const key = settingName.toLowerCase().replace(/\s+/g, "-");
        const bind = data.keybinds[key];

        if (bind) {
          const li = document.createElement("li");
          li.textContent = `${settingName} → ${bind}`;
          keybindsList.appendChild(li);
          foundAny = true;
        }
      });

      if (!foundAny) {
        keybindsList.innerHTML = "<li>No keybinds found.</li>";
      }
    } else {
      keybindsList.innerHTML = "<li>No keybinds found.</li>";
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    alert("There was a problem loading the user settings.");
  }
}

init();
