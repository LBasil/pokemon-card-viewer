// Fonctions pures de la visionneuse : aucune dépendance au DOM, testables avec Node.
// Chargé dans le navigateur (variable globale CardLib) et par Node (module.exports).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.CardLib = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

    /** Échappe le texte venant de l'API avant de l'insérer dans du HTML. */
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
    }

    /**
     * Requête de recherche par nom pour pokemontcg.io.
     * Les guillemets et antislashs sont retirés pour ne pas casser la syntaxe de la requête,
     * et un joker final permet de trouver "pikachu" avec "pika".
     */
    function buildNameQuery(input) {
        const clean = String(input ?? '').replace(/["\\*]/g, '').trim().replace(/\s+/g, ' ');
        return clean ? `name:"${clean}*"` : '';
    }

    /** Requête qui récupère plusieurs cartes d'un coup, au lieu d'une requête par carte. */
    function buildIdsQuery(ids) {
        return ids.map((id) => `id:"${String(id).replace(/["\\]/g, '')}"`).join(' OR ');
    }

    /** Lit une liste d'identifiants dans le stockage ; renvoie [] si la valeur est absente ou abîmée. */
    function readList(storage, key) {
        try {
            const value = JSON.parse(storage.getItem(key));
            return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
        } catch {
            return [];
        }
    }

    function writeList(storage, key, list) {
        try {
            storage.setItem(key, JSON.stringify(list));
            return true;
        } catch {
            return false; // stockage plein ou désactivé
        }
    }

    /** Ajoute l'identifiant s'il est absent, le retire sinon. Renvoie une nouvelle liste. */
    function toggleId(list, id) {
        return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    }

    /** Remet les cartes dans l'ordre demandé (l'API ne garantit pas l'ordre d'une requête groupée). */
    function sortByIds(cards, ids) {
        const rank = (card) => (ids.includes(card.id) ? ids.indexOf(card.id) : ids.length);
        return [...cards].sort((a, b) => rank(a) - rank(b));
    }

    /** HTML d'une vignette de carte ; toutes les valeurs venant de l'API sont échappées. */
    function renderCard(card) {
        return `
            <div class="card" role="button" tabindex="0" data-card-id="${escapeHtml(card.id)}" aria-label="${escapeHtml(card.name)}, voir les détails">
                <img src="${escapeHtml(card.images && card.images.small)}" class="card-img-top" alt="${escapeHtml(card.name)}" loading="lazy">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(card.name)}</h5>
                    <p class="card-text">${escapeHtml(card.set && card.set.name)}</p>
                </div>
            </div>`;
    }

    /** Texte d'une liste de valeurs optionnelles ("Aucune" si vide). */
    function listOrNone(items, format) {
        return items && items.length ? items.map(format || String).join(', ') : 'Aucune';
    }

    return { escapeHtml, buildNameQuery, buildIdsQuery, readList, writeList, toggleId, sortByIds, renderCard, listOrNone };
});
