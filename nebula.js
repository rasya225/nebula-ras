// nebula.js — Server Game Online 2D versi HTTPS/HTTP otomatis
// By Rasya & GPT-5 🚀

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==== Coba baca sertifikat lokal (kalau ada) ====
let server;
try {
  const key = fs.readFileSync(path.join(__dirname, 'server.key'));
  const cert = fs.readFileSync(path.join(__dirname, 'server.cert'));
  console.log('🔐 Sertifikat HTTPS ditemukan, menjalankan server dengan HTTPS...');
  server = https.createServer({ key, cert }, app);
} catch (err) {
  console.warn('⚠️ Sertifikat tidak ditemukan. Menjalankan HTTP server biasa...');
  server = http.createServer(app);
}

// ==== Setup Socket.io ====
const io = new Server(server);

// ==== Arahkan folder client ====
app.use(express.static("public")(path.join(__dirname, '..', 'nebula-client')));

// ==== Logika pemain (multiplayer) ====
const players = {};

io.on('connection', (socket) => {
  console.log(`🟢 Player connected: ${socket.id}`);

  // Tambahkan pemain baru dengan posisi acak
  players[socket.id] = {
    x: Math.floor(Math.random() * 800),
    y: Math.floor(Math.random() * 600),
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
  };

  // Kirim daftar pemain ke semua klien
  io.emit('players', players);

  // Update posisi pemain
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x += data.x;
      players[socket.id].y += data.y;
      io.emit('players', players);
    }
  });

  // Pemain keluar
  socket.on('disconnect', () => {
    console.log(`🔴 Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('players', players);
  });
});

// ==== Jalankan server ====
server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
  console.log(`🚀 Server running at ${protocol}://localhost:${PORT}`);
});

