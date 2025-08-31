const socket = io('https://dimelo-kvvj.onrender.com', { transports: ['websocket', 'polling'] });

const chatDiv = document.getElementById('chat');
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
let imageInput = document.getElementById('imageInput'); // let, no const
const imgBtn = document.getElementById('imgBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const roomSelect = document.getElementById('roomSelect');
const roomList = document.getElementById('roomList');
const showCreateRoom = document.getElementById('showCreateRoom');
const createRoomDiv = document.getElementById('createRoomDiv');
const createRoomBtn = document.getElementById('createRoomBtn');
const cancelCreateRoom = document.getElementById('cancelCreateRoom');
const newRoomName = document.getElementById('newRoomName');
const newRoomType = document.getElementById('newRoomType');
const newRoomPass = document.getElementById('newRoomPass');
const joinRoomDiv = document.getElementById('joinRoomDiv');
const joinRoomName = document.getElementById('joinRoomName');
const joinRoomPass = document.getElementById('joinRoomPass');
const joinUsername = document.getElementById('joinUsername');
const joinRoomBtn = document.getElementById('joinRoomBtn');

let username = '';
let currentRoom = '';

// Emoji list (puedes agregar más)
const emojis = [
    "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","😘","🥰","😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🤑","😲","☹️","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","😡","😠","🤬","😷","🤒","🤕","🤢","🤮","🥴","😇","🥳"
];

// Emoji picker logic
emojiBtn.onclick = (e) => {
    e.preventDefault();
    if (emojiPicker.style.display === "none") {
        emojiPicker.innerHTML = emojis.map(e => `<button type="button" class="emoji">${e}</button>`).join('');
        const rect = emojiBtn.getBoundingClientRect();
        emojiPicker.style.display = "block";
        emojiPicker.style.left = rect.left + "px";
        emojiPicker.style.top = (rect.top - 180) + "px";
    } else {
        emojiPicker.style.display = "none";
    }
};
emojiPicker.onclick = function(ev) {
    if (ev.target.classList.contains('emoji')) {
        input.value += ev.target.textContent;
        emojiPicker.style.display = "none";
        input.focus();
    }
};
document.body.addEventListener('click', function(e) {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.style.display = "none";
    }
});

const usersDiv = document.createElement('div');
usersDiv.id = 'usersDiv';
usersDiv.className = 'users-div';
chatDiv.insertBefore(usersDiv, messages);

const leaveBtn = document.createElement('button');
leaveBtn.textContent = 'Salir de la sala';
leaveBtn.className = 'secondary leave-btn';
leaveBtn.style.marginBottom = '10px';
chatDiv.insertBefore(leaveBtn, chatDiv.firstChild);

let usersInRoom = [];

leaveBtn.onclick = () => {
    socket.emit('leave room');
    chatDiv.style.display = 'none';
    roomSelect.style.display = '';
    currentRoom = '';
    messages.innerHTML = '';
    usersDiv.innerHTML = '';
};

socket.on('users in room', function(users) {
    usersInRoom = users;
    usersDiv.innerHTML = `<span class="users-title">Usuarios en sala:</span> <span class="user-count">${users.length}</span>`;
});

function playNotification() {
    if (window.Notification && Notification.permission === "granted") {
        new Notification("Nuevo mensaje en el chat");
    } else {
        const audio = new Audio("https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c82.mp3");
        audio.volume = 0.2;
        audio.play();
    }
}

// Solicitar permiso de notificaciones al cargar la página
if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

function showBrowserNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

// Solo mostrar mensajes de la sala actual
socket.on('message', function(msg) {
    if (!currentRoom) return;
    const item = document.createElement('div');
    if (msg.type === 'image') {
        item.className = (msg.user === username) ? 'me' : '';
        item.innerHTML = `<strong>${msg.user === username ? 'Yo' : msg.user}:</strong><br><img src="${msg.data}" alt="imagen" class="chat-img">`;
        if (msg.user !== username && msg.user !== 'Sistema') {
            showBrowserNotification(`${msg.user} envió una imagen`, 'Haz clic para ver en el chat');
        }
    } else if (msg.user === 'Sistema') {
        item.className = 'system';
        item.textContent = msg.text;
    } else if (msg.user === username) {
        item.className = 'me';
        item.textContent = 'Yo: ' + msg.text;
    } else {
        item.textContent = msg.user + ': ' + msg.text;
        playNotification();
        showBrowserNotification(`${msg.user} dice:`, msg.text);
    }
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value && currentRoom) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

imgBtn.onclick = () => {
    if (currentRoom) {
        // Muestra un aviso antes de abrir el input
        if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
            alert("Para enviar una foto, tu navegador puede pedir permiso para acceder a archivos o la cámara. Por favor acepta el permiso si aparece.");
        }
        imageInput = document.getElementById('imageInput');
        imageInput.click();
    }
};
