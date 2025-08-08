import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { app } from "./firebase.js";

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsList = document.getElementById("results");

searchButton.addEventListener("click", async () => {
  const query = searchInput.value.trim().toLowerCase();
  resultsList.innerHTML = "";

  if (!query) {
    alert("Please enter a Discord ID or username.");
    return;
  }

  try {
    const db = getDatabase(app);
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      resultsList.innerHTML = "<li class='text-red-400'>No users found.</li>";
      return;
    }

    const users = snapshot.val();
    const matches = [];

    for (const [id, userData] of Object.entries(users)) {
      const username = (userData.settings?.discordUsername || "").toLowerCase();

      if (id === query || username.includes(query)) {
        matches.push({ id, username });
      }
    }

    if (matches.length === 0) {
      resultsList.innerHTML = "<li class='text-yellow-400'>No matching users found.</li>";
      return;
    }

    matches.forEach((user) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <a href="users.html?id=${encodeURIComponent(user.id)}"
          class="block p-4 bg-gray-800 rounded hover:bg-gray-700 transition">
          <span class="font-semibold">${user.username}</span><br>
          <span class="text-sm text-gray-400">ID: ${user.id}</span>
        </a>
      `;
      resultsList.appendChild(li);
    });

  } catch (err) {
    console.error("Search error:", err);
    resultsList.innerHTML = "<li class='text-red-500'>Error searching users.</li>";
  }
});
