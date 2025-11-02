const socket = io('https://69073463d8051384745f6b8b--nebula-games.netlify.app/');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const local = { id: null, x: 100, y: 100, size: 24, speed: 200, color: '#00ffff' };
const others = {};
let keys = {};
let lastTime = performance.now();

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

socket.on('connect', () => {
  local.id = socket.id;
});

socket.on('currentPlayers', (players) => {
  for (const id in players) {
    if (id === local.id) {
      local.x = players[id].x;
      local.y = players[id].y;
      local.color = players[id].color;
    } else {
      others[id] = players[id];
    }
  }
});

socket.on('newPlayer', (player) => {
  others[player.id] = player;
});

socket.on('playerMoved', (player) => {
  if (player.id !== local.id) others[player.id] = player;
});

socket.on('playerDisconnected', (id) => {
  delete others[id];
});

function update(dt) {
  let moved = false;
  const s = local.speed;

  if (keys['w'] || keys['arrowup']) { local.y -= s * dt; moved = true; }
  if (keys['s'] || keys['arrowdown']) { local.y += s * dt; moved = true; }
  if (keys['a'] || keys['arrowleft']) { local.x -= s * dt; moved = true; }
  if (keys['d'] || keys['arrowright']) { local.x += s * dt; moved = true; }

  local.x = Math.max(local.size/2, Math.min(canvas.width - local.size/2, local.x));
  local.y = Math.max(local.size/2, Math.min(canvas.height - local.size/2, local.y));

  if (moved) {
    socket.emit('playerMovement', { x: Math.round(local.x), y: Math.round(local.y) });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // stars background
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  for (const id in others) {
    const p = others[id];
    drawShip(p.x, p.y, p.color || '#ff0099', p.name || id);
  }

  drawShip(local.x, local.y, local.color, 'YOU');
}

function drawShip(x, y, color, name) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(10, 10);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = '12px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 0, 20);
  ctx.restore();
}

function loop(ts) {
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
