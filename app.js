// Firebase-konfiguration (byt ut mot din egen från Firebase-konsolen)
const firebaseConfig = {
  apiKey: "AIzaSyB4HRxYwy66GWdIn8wmJTfyg84-ulDJMp4",
  authDomain: "hemsida-40d0e.firebaseapp.com",
  databaseURL: "https://hemsida-40d0e-default-rtdb.firebaseio.com",
  projectId: "hemsida-40d0e",
  storageBucket: "hemsida-40d0e.appspot.com",
  messagingSenderId: "21312766371",
  appId: "1:21312766371:web:0c83f86591d75da16",
  measurementId: "G-KYKFN5TC7Y"
};

// Initiera Firebase
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

// Anonym inloggning
auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    status.textContent = `Inloggad anonymt (uid: ${user.uid})`;
    loadMyProfile();
    listenFriends();
  } else {
    try {
      await auth.signInAnonymously();
    } catch (e) {
      status.textContent = 'Fel vid anonym inloggning: ' + e.message;
    }
  }
});

// Spara användarnamn
saveNameBtn.onclick = async () => {
  const name = usernameInput.value.trim();
  if (!name) return alert('Skriv ett användarnamn');
  const uRef = db.ref('users/' + currentUser.uid);
  await uRef.set({ username: name, createdAt: Date.now() });
  status.textContent = 'Användarnamn sparat: ' + name;
};

// Sök användare och lägg till som vän
searchBtn.onclick = async () => {
  const q = searchInput.value.trim();
  if (!q) return;
  const usersRef = db.ref('users');
  const snapshot = await usersRef.orderByChild('username').equalTo(q).once('value');
  if (!snapshot.exists()) return alert('Hittade ingen användare med det namnet');
  const result = snapshot.val();
  const uid = Object.keys(result)[0];
  if (uid === currentUser.uid) return alert('Det är du — kan ej lägga till dig själv');
  const friendData = result[uid];
  await db.ref(`friends/${currentUser.uid}/${uid}`).set({ username: friendData.username, addedAt: Date.now() });
  alert('Lagt till som vän: ' + friendData.username);
};

// Lyssna på friendlistan
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

// Öppna chatt
function chatIdFor(u1, u2) {
  return [u1, u2].sort().join('_');
}
function openChat(friendUid, friendName) {
  currentFriend = { uid: friendUid, name: friendName };
  currentChatId = chatIdFor(currentUser.uid, friendUid);
  chatWith.textContent = 'Chatt mot: ' + friendName;
  composer.style.display = 'block';
  messagesDiv.innerHTML = '';
  const msgsRef = db.ref('chats/' + currentChatId + '/messages').limitToLast(100);
  msgsRef.off();
  msgsRef.on('child_added', snap => {
    const msg = snap.val();
    const d = document.createElement('div');
    d.className = 'message';
    d.innerHTML = `<span class="${msg.from===currentUser.uid? 'me':''}">${msg.username}:</span> ${escapeHtml(msg.text)}`;
    messagesDiv.appendChild(d);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// Skicka meddelande
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

// Ladda min profil
async function loadMyProfile() {
  const snap = await db.ref('users/' + currentUser.uid).once('value');
  if (snap.exists()) {
    const d = snap.val();
    usernameInput.value = d.username || '';
  }
}
