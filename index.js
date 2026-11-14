const API_URL = 'https://api.pokemontcg.io/v2';
// Pas de clé d'API : le code est servi tel quel au navigateur, une clé y serait publique.
// L'API fonctionne sans clé, avec un quota réduit.
const REQUEST_TIMEOUT_MS = 15000;

const { escapeHtml, buildNameQuery, buildIdsQuery, readList, writeList, toggleId, sortByIds, renderCard, listOrNone } = CardLib;

const $ = (id) => document.getElementById(id);
let currentCard = null;
let loadingCount = 0;

// --- Affichage de l'état (chargement, erreurs, confirmations) ---

function setLoading(on) {
    loadingCount = Math.max(0, loadingCount + (on ? 1 : -1));
    $('loading-overlay').style.display = loadingCount > 0 ? 'flex' : 'none';
}

function showStatus(message, isError) {
    const status = $('status');
    status.textContent = message;
    status.className = 'alert ' + (isError ? 'alert-danger' : 'alert-success');
    status.style.display = message ? 'block' : 'none';
    clearTimeout(showStatus.timer);
    if (message && !isError) showStatus.timer = setTimeout(() => showStatus(''), 3000);
}

// --- Accès à l'API ---

async function apiGet(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(`${API_URL}${path}`, { signal: controller.signal });
        if (response.status === 429) throw new Error('Trop de requêtes : réessaie dans une minute.');
        if (!response.ok) throw new Error(`Erreur de l'API (${response.status}).`);
        return (await response.json()).data;
    } catch (error) {
        if (error.name === 'AbortError') throw new Error("L'API met trop de temps à répondre.");
        if (error instanceof TypeError) throw new Error('Connexion impossible. Vérifie ta connexion internet.');
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

/** Lance une opération avec spinner et message d'erreur lisible. */
async function withLoading(task) {
    setLoading(true);
    try {
        return await task();
    } catch (error) {
        showStatus(error.message, true);
    } finally {
        setLoading(false);
    }
}

function showCards(containerId, cards) {
    $(containerId).innerHTML = cards.map(renderCard).join('');
}

// --- Onglets ---

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.add('d-none'));
    $(tabId).classList.remove('d-none');
    if (tabId === 'collection') loadSavedCards();
}

document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        document.querySelector('.nav-item.active').classList.remove('active');
        link.parentElement.classList.add('active');
        showTab(link.getAttribute('href').substring(1));
    });
});

// --- Accueil, sets, recherche ---

function fetchRandomCards() {
    // Une page au hasard parmi les premières, plutôt que toujours les mêmes cartes.
    const page = 1 + Math.floor(Math.random() * 50);
    return withLoading(async () => {
        const cards = await apiGet(`/cards?pageSize=9&page=${page}&select=id,name,images,set`);
        showCards('random-cards-container', cards);
    });
}

function fetchSets() {
    return withLoading(async () => {
        const sets = await apiGet('/sets?select=id,name&orderBy=-releaseDate');
        $('set-select').innerHTML =
            '<option value="">Sélectionner un set</option>' +
            sets.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
    });
}

function fetchSetCards() {
    const setId = $('set-select').value;
    if (!setId) return;
    return withLoading(async () => {
        const cards = await apiGet(`/cards?q=${encodeURIComponent(`set.id:"${setId}"`)}&select=id,name,images,set`);
        showCards('set-container', cards);
    });
}

function searchCards() {
    const query = buildNameQuery($('search-input').value);
    if (!query) return;
    return withLoading(async () => {
        const cards = await apiGet(`/cards?q=${encodeURIComponent(query)}&pageSize=60&select=id,name,images,set`);
        showCards('cards-container', cards);
        $('error-message').style.display = cards.length === 0 ? 'block' : 'none';
    });
}

// --- Détails d'une carte ---

async function showCardDetails(cardId) {
    const card = await withLoading(() => apiGet(`/cards/${encodeURIComponent(cardId)}`));
    if (!card) return;
    currentCard = card;
    $('modal-card-image').src = card.images.large;
    $('modal-card-image').alt = card.name;
    $('modal-card-name').textContent = card.name;
    $('modal-card-set').textContent = card.set.name;
    $('modal-card-type').textContent = listOrNone(card.types);
    $('modal-card-rarity').textContent = card.rarity || 'Inconnue';
    $('modal-card-hp').textContent = card.hp || 'Inconnu';
    $('modal-card-attacks').textContent = listOrNone(card.attacks, (a) => a.name);
    $('modal-card-weaknesses').textContent = listOrNone(card.weaknesses, (w) => `${w.type} (${w.value})`);
    $('modal-card-resistances').textContent = listOrNone(card.resistances, (r) => `${r.type} (${r.value})`);
    $('modal-card-retreat-cost').textContent = listOrNone(card.retreatCost);
    updateModalButtons();
    window.jQuery('#cardModal').modal('show');
}

// --- Collection et deck (stockés dans le navigateur) ---

const LISTS = { collection: 'collection', deck: 'decks' };

function updateModalButtons() {
    const inCollection = readList(localStorage, LISTS.collection).includes(currentCard.id);
    const inDeck = readList(localStorage, LISTS.deck).includes(currentCard.id);
    $('collection-button').textContent = inCollection ? 'Supprimer de la collection' : 'Ajouter à la collection';
    $('deck-button').textContent = inDeck ? 'Supprimer du deck' : 'Ajouter au deck';
}

function toggleSaved(kind, label) {
    if (!currentCard) return;
    const key = LISTS[kind];
    const before = readList(localStorage, key);
    const after = toggleId(before, currentCard.id);
    if (!writeList(localStorage, key, after)) {
        showStatus("Impossible d'enregistrer : le stockage du navigateur est indisponible.", true);
        return;
    }
    showStatus(after.length > before.length ? `Carte ajoutée ${label}.` : `Carte retirée ${label}.`, false);
    window.jQuery('#cardModal').modal('hide');
    loadSavedCards();
}

async function loadSavedList(kind, containerId) {
    const ids = readList(localStorage, LISTS[kind]);
    if (ids.length === 0) {
        $(containerId).innerHTML = '<p class="text-muted">Rien ici pour l\'instant.</p>';
        return;
    }
    // Une seule requête pour toute la liste.
    const cards = await apiGet(`/cards?q=${encodeURIComponent(buildIdsQuery(ids))}&pageSize=${ids.length}&select=id,name,images,set`);
    showCards(containerId, sortByIds(cards, ids));
}

function loadSavedCards() {
    return withLoading(async () => {
        await loadSavedList('collection', 'collection-container');
        await loadSavedList('deck', 'deck-container');
    });
}

// --- Branchements ---

// Un seul écouteur pour toutes les vignettes, présentes et futures.
document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-card-id]');
    if (card) showCardDetails(card.dataset.cardId);
});
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest && event.target.closest('[data-card-id]');
    if (card) {
        event.preventDefault();
        showCardDetails(card.dataset.cardId);
    }
});

$('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    searchCards();
});
$('set-select').addEventListener('change', fetchSetCards);
$('collection-button').addEventListener('click', () => toggleSaved('collection', 'à la collection'));
$('deck-button').addEventListener('click', () => toggleSaved('deck', 'au deck'));

$('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    $('theme-toggle').textContent = isDark ? 'Mode clair' : 'Mode sombre';
    $('theme-toggle').setAttribute('aria-pressed', String(isDark));
});

document.addEventListener('DOMContentLoaded', () => {
    fetchRandomCards();
    fetchSets();
});
