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
const API_KEY = '82b1953f-af42-4e3a-9700-16444065f44b';
const API_URL = 'https://api.pokemontcg.io/v2';

// Fonction pour obtenir des cartes aléatoires et les afficher dans l'accueil
async function fetchRandomCards() {
    showSpinner();
    const response = await fetch(`${API_URL}/cards?pageSize=9`, {
        headers: { 'X-Api-Key': API_KEY }
    });
    const data = await response.json();
    hideSpinner();
    const container = document.getElementById('random-cards-container');
    container.innerHTML = '';
    data.data.forEach(card => {
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
    container.innerHTML = '';
    data.data.forEach(card => {
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

// Charger des cartes aléatoires et les sets au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    fetchRandomCards();
    fetchSets();
});

// Fonction pour basculer entre les thèmes clair et sombre
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('theme-toggle').textContent = isDark ? 'Mode clair' : 'Mode sombre';
});
