// Fonction pour montrer le spinner
function showSpinner() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

// Fonction pour cacher le spinner
function hideSpinner() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Fonction pour basculer entre les onglets
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('d-none'));
    document.getElementById(tabId).classList.remove('d-none');
}

// Écouter les clics sur les onglets de navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();
        document.querySelector('.nav-item.active').classList.remove('active');
        this.parentElement.classList.add('active');
        showTab(this.getAttribute('href').substring(1));
    });
});

// Clé API (remplace 'YOUR_API_KEY' par ta clé API)
const API_KEY = 'YOUR_API_KEY';
const API_URL = 'https://api.pokemontcg.io/v2';

// Fonction pour obtenir des cartes aléatoires et les afficher dans l'accueil
async function fetchRandomCards() {
    showSpinner();
    const response = await fetch(`${API_URL}/cards?pageSize=10`, {
        headers: { 'X-Api-Key': API_KEY }
    });
    const data = await response.json();
    hideSpinner();
    const container = document.getElementById('random-cards-container');
    container.innerHTML = '';
    data.data.forEach(card => {
        container.innerHTML += `
            <div class="card" onclick="showCardDetails('${card.id}')">
                <img src="${card.images.small}" class="card-img-top" alt="${card.name}">
                <div class="card-body">
                    <h5 class="card-title">${card.name}</h5>
                    <p class="card-text">${card.set.name}</p>
                </div>
            </div>
        `;
    });
}

// Fonction pour obtenir tous les sets et remplir la liste déroulante
async function fetchSets() {
    showSpinner();
    const response = await fetch(`${API_URL}/sets`, {
        headers: { 'X-Api-Key': API_KEY }
    });
    const data = await response.json();
    hideSpinner();
    const select = document.getElementById('set-select');
    data.data.forEach(set => {
        select.innerHTML += `<option value="${set.id}">${set.name}</option>`;
    });
}

// Fonction pour obtenir les cartes d'un set sélectionné
async function fetchSetCards() {
    const setId = document.getElementById('set-select').value;
    if (!setId) return;
    showSpinner();
    const response = await fetch(`${API_URL}/cards?q=set.id:${setId}`, {
        headers: { 'X-Api-Key': API_KEY }
    });
    const data = await response.json();
    hideSpinner();
    const container = document.getElementById('set-container');
    container.innerHTML = '';
    data.data.forEach(card => {
        container.innerHTML += `
            <div class="card" onclick="showCardDetails('${card.id}')">
                <img src="${card.images.small}" class="card-img-top" alt="${card.name}">
                <div class="card-body">
                    <h5 class="card-title">${card.name}</h5>
                    <p class="card-text">${card.set.name}</p>
                </div>
            </div>
        `;
    });
}

// Fonction pour chercher des cartes par nom de Pokémon
async function searchCards() {
    const query = document.getElementById('search-input').value;
    if (!query) return;
    showSpinner();
    const response = await fetch(`${API_URL}/cards?q=name:${query}`, {
        headers: { 'X-Api-Key': API_KEY }
    });
    const data = await response.json();
    hideSpinner();
    const container = document.getElementById('cards-container');
    const errorMessage = document.getElementById('error-message');
    container.innerHTML = '';
    if (data.data.length === 0) {
        errorMessage.style.display = 'block';
    } else {
        errorMessage.style.display = 'none';
        data.data.forEach(card => {
            container.innerHTML += `
                <div class="card" onclick="showCardDetails('${card.id}')">
                    <img src="${card.images.small}" class="card-img-top" alt="${card.name}">
                    <div class="card-body">
                        <h5 class="card-title">${card.name}</h5>
                        <p class="card-text">${card.set.name}</p>
                    </div>
                </div>
            `;
        });
    }
}

// Fonction pour montrer les détails d'une carte dans une modal
async function showCardDetails(cardId) {
    showSpinner();
    const response = await fetch(`${API_URL}/cards/${cardId}`, {
        headers: { 'X-Api-Key': API_KEY }
    });
    const data = await response.json();
    hideSpinner();
    const card = data.data;
    document.getElementById('modal-card-image').src = card.images.large;
    document.getElementById('modal-card-name').textContent = card.name;
    document.getElementById('modal-card-set').textContent = card.set.name;
    document.getElementById('modal-card-type').textContent = card.types ? card.types.join(', ') : 'Unknown';
    document.getElementById('modal-card-rarity').textContent = card.rarity ? card.rarity : 'Unknown';
    document.getElementById('modal-card-hp').textContent = card.hp ? card.hp : 'Unknown';
    document.getElementById('modal-card-attacks').textContent = card.attacks ? card.attacks.map(attack => attack.name).join(', ') : 'None';
    document.getElementById('modal-card-weaknesses').textContent = card.weaknesses ? card.weaknesses.map(weakness => weakness.type + ' (' + weakness.value + ')').join(', ') : 'None';
    document.getElementById('modal-card-resistances').textContent = card.resistances ? card.resistances.map(resistance => resistance.type + ' (' + resistance.value + ')').join(', ') : 'None';
    document.getElementById('modal-card-id').textContent = card.id; // Ajout de l'ID de la carte dans la modal
    $('#cardModal').modal('show');
}

// Fonction pour basculer entre les thèmes clair et sombre
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('theme-toggle').textContent = isDark ? 'Mode clair' : 'Mode sombre';
});

// Fonction pour charger les cartes aléatoires et les sets au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    fetchRandomCards();
    fetchSets();
    loadCollection();
    loadDecks();
});

// Fonctions pour la collection et les decks
function addToCollection() {
    const cardId = document.getElementById('modal-card-id').textContent;
    let collection = JSON.parse(localStorage.getItem('collection')) || [];
    if (!collection.includes(cardId)) {
        collection.push(cardId);
        localStorage.setItem('collection', JSON.stringify(collection));
        alert('Carte ajoutée à la collection!');
        loadCollection();
    } else {
        alert('Cette carte est déjà dans la collection.');
    }
}

function addToDeck() {
    const cardId = document.getElementById('modal-card-id').textContent;
    let decks = JSON.parse(localStorage.getItem('decks')) || [];
    if (!decks.includes(cardId)) {
        decks.push(cardId);
        localStorage.setItem('decks', JSON.stringify(decks));
        alert('Carte ajoutée au deck!');
        loadDecks();
    } else {
        alert('Cette carte est déjà dans le deck.');
    }
}

function loadCollection() {
    const collection = JSON.parse(localStorage.getItem('collection')) || [];
    const container = document.getElementById('collection-container');
    container.innerHTML = '';
    collection.forEach(async cardId => {
        const response = await fetch(`${API_URL}/cards/${cardId}`, {
            headers: { 'X-Api-Key': API_KEY }
        });
        const data = await response.json();
        const card = data.data;
        container.innerHTML += `
            <div class="card">
                <img src="${card.images.small}" class="card-img-top" alt="${card.name}">
                <div class="card-body">
                    <h5 class="card-title">${card.name}</h5>
                    <p class="card-text">${card.set.name}</p>
                </div>
            </div>
        `;
    });
}

function loadDecks() {
    const decks = JSON.parse(localStorage.getItem('decks')) || [];
    const container = document.getElementById('deck-container');
    container.innerHTML = '';
    decks.forEach(async cardId => {
        const response = await fetch(`${API_URL}/cards/${cardId}`, {
            headers: { 'X-Api-Key': API_KEY }
        });
        const data = await response.json();
        const card = data.data;
        container.innerHTML += `
            <div class="card">
                <img src="${card.images.small}" class="card-img-top" alt="${card.name}">
                <div class="card-body">
                    <h5 class="card-title">${card.name}</h5>
                    <p class="card-text">${card.set.name}</p>
                </div>
            </div>
        `;
    });
}