// Connect to server
function connectToServer() {
    socket = io('http://localhost:3000');

    socket.on('init', (data) => {
        playerId = data.playerId;
        players = data.players;
        bullets = data.bullets;
        bombs = data.bombs;
        initGame();
    });

    socket.on('updatePlayers', (data) => {
        players = data.players;
        updatePlayerCount();
    });

    // Add all other socket event handlers from your original code
    // ...
    socket.on('playerJoined', (data) => {
        players[data.playerId] = data.player;
        createPlayerModel(data.playerId, data.player);
        updatePlayerCount();
    });

    socket.on('playerLeft', (data) => {
        if (players[data.playerId] && players[data.playerId].mesh) {
            players[data.playerId].mesh.dispose();
        }
        delete players[data.playerId];
        updatePlayerCount();
    });

    socket.on('playerMoved', (data) => {
        if (players[data.playerId] && players[data.playerId].mesh) {
            players[data.playerId].mesh.position.set(data.x, data.y, data.z);
            players[data.playerId].mesh.rotation.y = data.rotation;
        }
    });

    socket.on('playerHit', (data) => {
        if (players[data.playerId]) {
            players[data.playerId].health = data.health;
            updatePlayerHealthBar(data.playerId);

            if (data.playerId === playerId) {
                showHitEffect(data.damage);
                updateHealthBar();
            }
        }
    });

    socket.on('playerDied', (data) => {
        if (players[data.playerId]) {
            players[data.playerId].health = 0;
            updatePlayerHealthBar(data.playerId);

            if (data.playerId === playerId) {
                gameOver(false);
                deaths++;
                document.getElementById('deathCount').textContent = deaths;
            }

            if (data.killerId === playerId) {
                kills++;
                document.getElementById('killCount').textContent = kills;
            }
        }
    });

    socket.on('playerRespawned', (data) => {
        if (players[data.playerId]) {
            players[data.playerId].health = 100;
            updatePlayerHealthBar(data.playerId);

            if (data.playerId === playerId) {
                isGameOver = false;
                document.getElementById("gameOver").style.display = "none";
                camera.position = new BABYLON.Vector3(0, 1.8, 0);
                updateHealthBar();
            }
        }
    });

    socket.on('bulletCreated', (data) => {
        bullets[data.id] = data;
        createBullet(data);
    });

    socket.on('bulletRemoved', (id) => {
        if (bullets[id] && bullets[id].mesh) {
            bullets[id].mesh.dispose();
            delete bullets[id];
        }
    });

    socket.on('bombCreated', (data) => {
        bombs[data.id] = data;
        createBomb(data);
    });

    socket.on('bombExploded', (data) => {
        if (bombs[data.id] && bombs[data.id].mesh) {
            createExplosion(bombs[data.id].mesh.position, data.damage, data.radius);
            bombs[data.id].mesh.dispose();
            delete bombs[data.id];
        }
    });
}

function updatePlayerCount() {
    document.getElementById('playerCount').textContent = Object.keys(players).length;
}