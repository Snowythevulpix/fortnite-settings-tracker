import { saveSettingsToRealtimeDB } from "./firebase.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase.js";

const platforms = ["PC", "Xbox", "PS", "Switch", "Mobile", "Samsung Smart Fridge"];

const keybindsContainer = document.getElementById("keybinds-container");
const platformSelect = document.getElementById("platform");
const form = document.getElementById("settings-form");

let settingsList = [];

const fortniteUsernameInput = document.getElementById("fortnite-username");

function formatKey(e) {
  if (e.key === " ") return "Space";
  if (e.key === "Escape") return "Escape";
  if (e.key.length === 1) return e.key.toUpperCase();
  return e.key.charAt(0).toUpperCase() + e.key.slice(1);
}

function formatMouseButton(e) {
  switch (e.button) {
    case 0: return "Left Click";
    case 1: return "Middle Click";
    case 2: return "Right Click";
    default: return `Mouse Button ${e.button}`;
  }
}

function createKeybindRow(selectedSetting = "", boundKey = "") {
  const row = document.createElement("div");
  row.className = "flex items-center space-x-4";

  // Setting select
  const settingSelect = document.createElement("select");
  settingSelect.className = "p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-grow";
  settingSelect.required = true;

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.disabled = true;
  defaultOption.selected = !selectedSetting;
  defaultOption.textContent = "Select setting";
  settingSelect.appendChild(defaultOption);

  settingsList.forEach((setting) => {
    const option = document.createElement("option");
    option.value = setting.toLowerCase().replace(/\s+/g, "-");
    option.textContent = setting;
    if (option.value === selectedSetting) option.selected = true;
    settingSelect.appendChild(option);
  });

  // Bind button
  const bindBtn = document.createElement("button");
  bindBtn.type = "button";
  bindBtn.className = "bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 font-mono";
  bindBtn.textContent = boundKey || "Click to bind";

  bindBtn.addEventListener("click", () => {
    bindBtn.textContent = "Press any key...";
    function onKeyDown(e) {
      e.preventDefault();
      const keyName = formatKey(e);
      bindBtn.textContent = keyName;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    }
    function onMouseDown(e) {
      e.preventDefault();
      const mouseButton = formatMouseButton(e);
      bindBtn.textContent = mouseButton;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
  });

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "text-red-600 hover:text-red-800 font-bold";
  removeBtn.textContent = "✕";
  removeBtn.title = "Remove this bind";
  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  row.appendChild(settingSelect);
  row.appendChild(bindBtn);
  row.appendChild(removeBtn);

  return row;
}

// Add new keybind row on button click
document.getElementById("add-keybind").addEventListener("click", () => {
  keybindsContainer.appendChild(createKeybindRow());
});

// Populate platform dropdown
platforms.forEach((plat) => {
  const option = document.createElement("option");
  option.value = plat.toLowerCase().replace(/\s+/g, "-");
  option.textContent = plat;
  platformSelect.appendChild(option);
});

// Initialize settings page
async function init() {
  try {
    const res = await fetch("settingslist.json");
    if (!res.ok) throw new Error("Failed to load settings list");
    settingsList = await res.json();
  } catch (err) {
    console.error("Error loading settings list:", err);
    alert("Failed to load settings list.");
    return;
  }

  const discordId = localStorage.getItem("discord_id");

  if (!discordId) {
    alert("You must be logged in with Discord to load your settings.");
    return;
  }

  try {
    const db = getDatabase(app);
    const userRef = ref(db, `users/${discordId}/settings`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();

      fortniteUsernameInput.value = data.fortniteUsername || "";
      platformSelect.value = data.platform || "";

      keybindsContainer.innerHTML = "";

      if (data.keybinds && typeof data.keybinds === "object") {
        Object.entries(data.keybinds).forEach(([setting, bind]) => {
          keybindsContainer.appendChild(createKeybindRow(setting, bind));
        });
      } else {
        // Add an empty row if no keybinds
        keybindsContainer.appendChild(createKeybindRow());
      }
    } else {
      // No data found for this user
      keybindsContainer.appendChild(createKeybindRow());
    }
  } catch (err) {
    console.error("Error fetching user settings:", err);
    alert("Failed to load your saved settings.");
  }
}

init();

// Save form data
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fortniteUsername = fortniteUsernameInput.value.trim();
  const platform = platformSelect.value;

  if (!fortniteUsername) {
    alert("Please enter your Fortnite username.");
    return;
  }

  if (!platform) {
    alert("Please select your platform.");
    return;
  }

  const keybinds = [];
  const rows = keybindsContainer.querySelectorAll("div.flex");
  rows.forEach((row) => {
    const setting = row.querySelector("select").value;
    const bind = row.querySelector("button").textContent;

    if (setting && bind && bind !== "Click to bind" && bind !== "Press any key...") {
      keybinds.push({ setting, bind });
    }
  });

  const discordId = localStorage.getItem("discord_id");
  const discordUsername = localStorage.getItem("discord_username");

  if (!discordId) {
    alert("You must be logged in with Discord to save settings.");
    return;
  }

  // Convert keybinds array to object
  const keybindsObject = {};
  keybinds.forEach(({ setting, bind }) => {
    keybindsObject[setting] = bind;
  });

  const dataToSave = {
    fortniteUsername,
    platform,
    keybinds: keybindsObject,
    discordUsername
  };

  try {
    await saveSettingsToRealtimeDB(dataToSave);
    alert("Settings saved successfully!");
  } catch (err) {
    console.error("Error saving settings:", err);
    alert("Failed to save settings.");
  }
});
