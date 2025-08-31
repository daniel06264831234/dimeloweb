const socket = io('https://dimelo-kvvj.onrender.com', { transports: ['websocket', 'polling'] });

const chatDiv = document.getElementById('chat');
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const imageInput = document.getElementById('imageInput');
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
    usersDiv.innerHTML = `<span class="users-title">Usuarios en sala:</span> ${users.map(u => `<span class="user">${u}</span>`).join(', ')}`;
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

// Solo mostrar mensajes de la sala actual
socket.on('message', function(msg) {
    if (!currentRoom) return;
    const item = document.createElement('div');
    if (msg.type === 'image') {
        // Siempre muestra la imagen, sea quien sea el usuario
        item.className = (msg.user === username) ? 'me' : '';
        item.innerHTML = `<strong>${msg.user === username ? 'Yo' : msg.user}:</strong><br><img src="${msg.data}" alt="imagen" class="chat-img">`;
    } else if (msg.user === 'Sistema') {
        item.className = 'system';
        item.textContent = msg.text;
    } else if (msg.user === username) {
        item.className = 'me';
        item.textContent = 'Yo: ' + msg.text;
    } else {
        item.textContent = msg.user + ': ' + msg.text;
        playNotification();
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
    if (currentRoom) imageInput.click();
};

imageInput.onchange = function() {
    if (!currentRoom) return;
    const file = imageInput.files && imageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        socket.emit('chat image', e.target.result);
        // Limpia el input después de enviar la imagen (mejor para móviles)
        setTimeout(() => {
            imageInput.value = '';
            // Para máxima compatibilidad móvil, reemplaza el input por uno nuevo
            const newInput = imageInput.cloneNode();
            imageInput.parentNode.replaceChild(newInput, imageInput);
            newInput.onchange = imageInput.onchange;
            imageInput = newInput;
        }, 300);
    };
    reader.readAsDataURL(file);
};

function updateRoomList() {
    socket.emit('get rooms', (rooms) => {
        roomList.innerHTML = rooms.map(r =>
            `<div>
                <b>${r.name}</b> (${r.type}${r.private ? ', privada' : ''})
                <button class="quickJoin" data-room="${r.name}" ${r.private ? '' : 'style="margin-left:8px;"'}>Entrar</button>
            </div>`
        ).join('') || '<i>No hay salas disponibles</i>';
        document.querySelectorAll('.quickJoin').forEach(btn => {
            btn.onclick = () => {
                joinRoomName.value = btn.dataset.room;
            };
        });
    });
}
updateRoomList();
setInterval(updateRoomList, 5000);

showCreateRoom.onclick = () => {
    createRoomDiv.style.display = '';
    showCreateRoom.style.display = 'none';
};
cancelCreateRoom.onclick = () => {
    createRoomDiv.style.display = 'none';
    showCreateRoom.style.display = '';
};
createRoomBtn.onclick = () => {
    const name = newRoomName.value.trim();
    const type = newRoomType.value;
    const pass = newRoomPass.value;
    if (!name) return alert('Ponle un nombre a la sala');
    socket.emit('create room', { room: name, type, password: pass }, (res) => {
        if (res.ok) {
            createRoomDiv.style.display = 'none';
            showCreateRoom.style.display = '';
            updateRoomList();
            joinRoomName.value = name;
        } else {
            alert(res.error);
        }
    });
};

joinRoomBtn.onclick = () => {
    const room = joinRoomName.value.trim();
    const pass = joinRoomPass.value;
    const name = joinUsername.value.trim();
    if (!room || !name) return alert('Pon tu nombre y el nombre de la sala');
    socket.emit('join room', { room, username: name, password: pass }, (res) => {
        if (res.ok) {
            username = name;
            currentRoom = room;
            roomSelect.style.display = 'none';
            chatDiv.style.display = '';
            messages.innerHTML = '';
            usersDiv.innerHTML = '';
            socket.emit('get users in room');
            // Enfoca el input en móviles y escritorio
            setTimeout(() => { input.focus(); }, 300);
        } else {
            alert(res.error);
        }
    });
};

// Solicita usuarios al entrar y cuando el servidor lo indique
socket.on('update users', () => {
    socket.emit('get users in room');
});

socket.on('connect', () => {
    if (currentRoom) socket.emit('get users in room');
});

socket.emit('get users in room');

socket.on('room closed', function() {
    alert('La sala se cerró por inactividad.');
    chatDiv.style.display = 'none';
    roomSelect.style.display = '';
    currentRoom = '';
    messages.innerHTML = '';
    usersDiv.innerHTML = '';
});
