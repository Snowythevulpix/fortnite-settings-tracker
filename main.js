import { saveUserToFirestore, getUserData } from './firebase.js';

// after successful login
saveUserToFirestore();

// get user data later
const user = await getUserData(localStorage.getItem("discord_id"));
console.log(user);
