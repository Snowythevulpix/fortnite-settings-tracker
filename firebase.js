import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDi25od6pFWcqFi1xecXHCkcDzQjvsMpqs",
  authDomain: "fortnite-settings-tracker.firebaseapp.com",
  databaseURL: "https://fortnite-settings-tracker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fortnite-settings-tracker",
  storageBucket: "fortnite-settings-tracker.appspot.com",
  messagingSenderId: "490998943746",
  appId: "1:490998943746:web:88c948bea44d5db120171b",
  measurementId: "G-J23RLDDQ8X"
};

const app = initializeApp(firebaseConfig);


// Now you can safely use database APIs
const db = getDatabase(app);


export async function saveSettingsToRealtimeDB(data) {
  const userId = localStorage.getItem("discord_id");
  if (!userId) throw new Error("No Discord ID found. User must be logged in.");

  const userRef = ref(db, `users/${userId}/settings`);

  await set(userRef, data);
}

export { app };
