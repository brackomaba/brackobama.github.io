// ====== KONFIG ======
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_APIKEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  // resten (messagingSenderId, appId) kan finnas men är inte obligatoriska för detta exempel
};
// ====================

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const status = document.getElementById('status');
const usernameInput = document.getElementById('usernameInput');
const saveNameBtn = document.getElementById('saveName');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const friendsList = document.getElementById('friendsList');

const chatWith = document.getElementById('chatWith');
const messagesDiv = document.getElementById('messages');
const composer = document.getElementById('composer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

let currentUser = null;
let currentChatId = null;
let currentFriend = null;

// 1) Anonym inloggning
auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    status.textContent = `Inloggad anonymt (uid: ${user.uid})`;
    loadMyProfile();
    listenFriends();
  } else {
    // logga in anonymt
    try {
      await auth.signInAnonymously();
    } catch (e) {
      status.textContent = 'Fel vid anonym inloggning: ' + e.message;
    }
  }
});

// 2) Spara användarnamn
saveNameBtn.onclick = async () => {
  const name = usernameInput.value.trim();
  if (!name) return alert('Skriv ett användarnamn');
  // Spara under /users/{uid} = { username, createdAt }
  const uRef = db.ref('users/' + currentUser.uid);
  await uRef.set({ username: name, createdAt: Date.now() });
  status.textContent = 'Användarnamn sparat: ' + name;
};

// 3) Sök efter användare och lägg till som vän
searchBtn.onclick = async () => {
  const q = searchInput.value.trim();
  if (!q) return;
  // Sök i users där username == q
  const usersRef = db.ref('users');
  const snapshot = await usersRef.orderByChild('username').equalTo(q).once('value');
  if (!snapshot.exists()) return alert('Hittade ingen användare med det namnet');
  const result = snapshot.val();
  const uid = Object.keys(result)[0];
  if (uid === currentUser.uid) return alert('Det är du — kan ej lägga till dig själv');
  // Lägg till som vän: /friends/{myUid}/{friendUid} = { username, addedAt }
  const friendData = result[uid];
  await db.ref(`friends/${currentUser.uid}/${uid}`).set({ username: friendData.username, addedAt: Date.now() });
  alert('Lagt till som vän: ' + friendData.username);
};

// 4) Lyssna på friendlistan
function listenFriends() {
  const fRef = db.ref('friends/' + currentUser.uid);
  fRef.on('value', snap => {
    friendsList.innerHTML = '';
    if (!snap.exists()) return;
    const data = snap.val();
    Object.keys(data).forEach(uid => {
      const el = document.createElement('div');
      el.className = 'friend';
      el.textContent = data[uid].username;
      el.onclick = () => openChat(uid, data[uid].username);
      friendsList.appendChild(el);
    });
  });
}

// 5) Öppna chatt (skapa chatId som lexicografiskt sorterat uids för enkel unik id)
function chatIdFor(u1, u2) {
  return [u1, u2].sort().join('_');
}
function openChat(friendUid, friendName) {
  currentFriend = { uid: friendUid, name: friendName };
  currentChatId = chatIdFor(currentUser.uid, friendUid);
  chatWith.textContent = 'Chatt mot: ' + friendName;
  composer.style.display = 'block';
  messagesDiv.innerHTML = '';
  // Lyssna på meddelanden
  const msgsRef = db.ref('chats/' + currentChatId + '/messages').limitToLast(100);
  msgsRef.off(); // ta bort tidigare lyssnare
  msgsRef.on('child_added', snap => {
    const msg = snap.val();
    const d = document.createElement('div');
    d.className = 'message';
    d.innerHTML = `<span class="${msg.from===currentUser.uid? 'me':''}">${msg.username}:</span> ${escapeHtml(msg.text)}`;
    messagesDiv.appendChild(d);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// 6) Skicka meddelande
sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text || !currentChatId) return;
  const msgsRef = db.ref('chats/' + currentChatId + '/messages');
  const myProfileSnap = await db.ref('users/' + currentUser.uid).once('value');
  const myProfile = myProfileSnap.val() || { username: 'Anonym' };
  await msgsRef.push({
    from: currentUser.uid,
    username: myProfile.username,
    text: text,
    ts: Date.now()
  });
  messageInput.value = '';
};

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// 7) Ladda min profil (fyll i username-input om satt)
async function loadMyProfile() {
  const snap = await db.ref('users/' + currentUser.uid).once('value');
  if (snap.exists()) {
    const d = snap.val();
    usernameInput.value = d.username || '';
  }
}
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4HRxYwy66GWdIn8wmJTfyg84-ulDJMp4",
  authDomain: "hemsida-40d0e.firebaseapp.com",
  projectId: "hemsida-40d0e",
  storageBucket: "hemsida-40d0e.firebasestorage.app",
  messagingSenderId: "21312766371",
  appId: "1:21312766371:web:0c83f86591d3876d75da16",
  measurementId: "G-KYKFN5TC7Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
