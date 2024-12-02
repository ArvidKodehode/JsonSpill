// Oppdaterer CSS-klasser for å vise hvilken knapp som skal trykkes
function highlightButton(buttonId) {
    document.getElementById('roll-dice').classList.remove('highlight');
    document.getElementById('next-event').classList.remove('highlight');
    document.getElementById(buttonId).classList.add('highlight');
}

// Spilldata lagres i gameData-objektet
const gameData = {
    health: 100, // Spillerens helse
    inventory: [], // Spilleren har plass til 3 gjenstander
    distance: 0, // Distanse tilbakelagt av spilleren
    bonusRoll: 0, // Bonus på terningkast fra venner
    maxDistance: 50, // Distanse som må fullføres for å vinne
    nextAction: null, // Neste handling som må fullføres (f.eks. fiendekamp)
    awaitingNextEvent: false, // Sjekker om en hendelse venter på fullføring
};

// Liste over mulige hendelser i spillet
const events = [
    { type: 'enemy', name: 'Goblin', damage: 10 },
    { type: 'enemy', name: 'Skelettkriger', damage: 20 },
    { type: 'enemy', name: 'Demon', damage: 30 },
    { type: 'friend', name: 'Trollmann', bonus: 2 },
    { type: 'friend', name: 'Veteran', bonus: 3 },
    { type: 'item', name: 'Gylden nøkkel' },
    { type: 'item', name: 'Tidskrystall' },
    { type: 'item', name: 'Usynlighetskappe' },
    { type: 'item', name: 'Energidrikk' },
    { type: 'health', name: 'Helsepotion', value: 20 },
    { type: 'health', name: 'Livskrystall', value: 30 },
];

// Funksjon for å oppdatere bildet basert på hendelse
function updateEventImage(event) {
    const imageElement = document.getElementById('event-image');
    if (event && event.name) {
        imageElement.src = `./img/car/${event.name}.png`; // Forventet bildeplassering
        imageElement.alt = event.name;
        imageElement.style.display = 'block'; // Viser bildet
    } else {
        imageElement.src = '';
        imageElement.alt = '';
        imageElement.style.display = 'none'; // Skjuler bildet
    }
}

// Oppdaterer visning av spillstatistikk i HTML
function updateStats() {
    document.getElementById('health').innerText = `${gameData.health}%`;
    document.getElementById('inventory').innerText = `[${gameData.inventory.join(', ') || 'Tom'}]`;
    document.getElementById('distance').innerText = gameData.distance;
}

// Viser hendelsesmeldinger i loggen
function logEvent(message) {
    const log = document.getElementById('event-log');
    log.innerHTML = `<li>${message}</li>`; // Kun siste melding vises
}

// Simulerer et terningkast (1–6 som standard)
function rollDice(max = 6) {
    return Math.floor(Math.random() * max) + 1;
}

// Tilbakestiller spillet
function resetGame() {
    gameData.health = 100;
    gameData.inventory = [];
    gameData.distance = 0;
    gameData.bonusRoll = 0;
    gameData.nextAction = null;
    gameData.awaitingNextEvent = false;

    document.getElementById('roll-dice').disabled = false;
    document.getElementById('next-event').disabled = true;

    highlightButton('roll-dice'); // Marker "Trill terning"-knappen ved spillstart
    logEvent('Spillet har startet på nytt.');
    updateStats();
    updateEventImage(null); // Skjul bilde ved spillstart
}

// Viser en sluttmelding og gir spilleren valg
function showEndMessage(message) {
    const endMessage = document.createElement('div');
    endMessage.id = 'end-message';
    endMessage.innerHTML = `
        <div class="overlay">
            <div class="message-box">
                <h1>${message}</h1>
                <p>Vil du starte en ny runde?</p>
                <button id="new-game">Ja</button>
                <button id="exit-game">Nei</button>
            </div>
        </div>
    `;
    document.body.appendChild(endMessage);

    // Event listeners for knappene
    document.getElementById('new-game').addEventListener('click', () => {
        document.body.removeChild(endMessage);
        resetGame(); // Starter spillet på nytt
    });

    document.getElementById('exit-game').addEventListener('click', () => {
        window.location.href = 'https://www.dagbladet.no'; // Omdiriger til Dagbladet
    });
}

// Håndterer en fiendekamp
function handleEnemy(enemy) {
    logEvent(`Du møter en ${enemy.name}! Klikk "Neste" for å trille terning.`);
    highlightButton('next-event');
    gameData.nextAction = () => {
        const playerRoll = rollDice();
        const enemyRoll = rollDice();

        logEvent(`Du trillet ${playerRoll}, og ${enemy.name} trillet ${enemyRoll}.`);

        if (playerRoll > enemyRoll) {
            logEvent(`Du beseiret ${enemy.name}!`);
            gameData.awaitingNextEvent = false;
            gameData.nextAction = null;
            highlightButton('roll-dice');
        } else {
            gameData.health -= enemy.damage;
            logEvent(`${enemy.name} skadet deg for ${enemy.damage}!`);
            if (gameData.health <= 0) {
                showEndMessage('Spillet er over! Du tapte!');
                document.getElementById('roll-dice').disabled = true;
                document.getElementById('next-event').disabled = true;
                return;
            }
            gameData.nextAction = () => handleEnemy(enemy);
        }
    };
}

// Håndterer en tilfeldig hendelse
function handleEvent(event) {
    gameData.awaitingNextEvent = true;
    highlightButton('next-event');
    document.getElementById('next-event').disabled = false;

    updateEventImage(event); // Oppdater bildet for hendelsen

    if (event.type === 'enemy') {
        handleEnemy(event);
    } else if (event.type === 'friend') {
        logEvent(`Du møter en venn: ${event.name}. Du får +${event.bonus} på terning neste runde.`);
        gameData.bonusRoll += event.bonus;
        gameData.awaitingNextEvent = false;
        gameData.nextAction = null;
        highlightButton('roll-dice');
    } else if (event.type === 'item') {
        logEvent(`Du fant ${event.name}.`);
        gameData.nextAction = () => {
            const addItem = confirm(`Vil du legge ${event.name} i inventaret?`);
            if (addItem) {
                if (gameData.inventory.length < 3) {
                    gameData.inventory.push(event.name);
                    logEvent(`${event.name} er lagt til i inventaret.`);
                } else {
                    logEvent(`Inventaret er fullt. Du kan ikke legge til ${event.name}.`);
                }
            } else {
                logEvent(`Du valgte å ignorere ${event.name}.`);
            }
            gameData.awaitingNextEvent = false;
            gameData.nextAction = null;
            highlightButton('roll-dice');
            document.getElementById('next-event').disabled = true;
        };
        highlightButton('next-event');
    } else if (event.type === 'health') {
        if (gameData.health < 100) {
            const heal = Math.min(100 - gameData.health, event.value);
            gameData.health += heal;
            logEvent(`Du bruker ${event.name} og gjenoppretter ${heal} helse.`);
        } else {
            logEvent(`Du fant ${event.name}, men har allerede full helse.`);
        }
        gameData.awaitingNextEvent = false;
        gameData.nextAction = null;
        highlightButton('roll-dice');
    }
}

// Når spilleren klikker "Trill terning"-knappen
document.getElementById('roll-dice').addEventListener('click', () => {
    if (gameData.awaitingNextEvent) {
        logEvent('Fullfør hendelsen ved å klikke "Neste".');
        return;
    }

    const diceRoll = rollDice() + gameData.bonusRoll;
    gameData.bonusRoll = 0;
    logEvent(`Du triller ${diceRoll} og går fremover.`);
    gameData.distance += diceRoll;

    if (gameData.distance >= gameData.maxDistance) {
        gameData.distance = gameData.maxDistance; // Sikrer at distansen ikke overskrider maksimalgrensen
        updateStats();
        showEndMessage('Gratulerer! Du vant!');
        document.getElementById('roll-dice').disabled = true;
        document.getElementById('next-event').disabled = true;
        return;
    }

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    handleEvent(randomEvent);
    updateStats();
});

// Når spilleren klikker "Neste"-knappen
document.getElementById('next-event').addEventListener('click', () => {
    if (gameData.nextAction) {
        gameData.nextAction();
        updateStats();
        if (!gameData.awaitingNextEvent) {
            document.getElementById('next-event').disabled = true;
            highlightButton('roll-dice');
        }
    } else {
        logEvent('Ingen handling tilgjengelig. Trill terning først!');
    }
});

// Starter spillet
resetGame();
