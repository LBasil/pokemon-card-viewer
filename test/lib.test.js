const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../lib.js');

// Faux localStorage minimal.
function fakeStorage(initial = {}) {
    const data = { ...initial };
    return {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = v; },
        raw: data,
    };
}

test('escapeHtml neutralise le HTML venant de l\'API', () => {
    assert.equal(L.escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(L.escapeHtml("Farfetch'd & co"), 'Farfetch&#39;d &amp; co');
    assert.equal(L.escapeHtml(undefined), '');
    assert.equal(L.escapeHtml(25), '25');
});

test('buildNameQuery : joker final, espaces nettoyés, vide si rien', () => {
    assert.equal(L.buildNameQuery('pika'), 'name:"pika*"');
    assert.equal(L.buildNameQuery('  Mr.   Mime '), 'name:"Mr. Mime*"');
    assert.equal(L.buildNameQuery('   '), '');
    assert.equal(L.buildNameQuery(null), '');
});

test('buildNameQuery : retire guillemets, antislashs et jokers pour ne pas casser la requête', () => {
    assert.equal(L.buildNameQuery('pika" OR name:"mew'), 'name:"pika OR name:mew*"');
    assert.equal(L.buildNameQuery('a\\b*c'), 'name:"abc*"');
});

test('buildIdsQuery : une requête pour plusieurs cartes', () => {
    assert.equal(L.buildIdsQuery(['base1-4', 'xy7-54']), 'id:"base1-4" OR id:"xy7-54"');
    assert.equal(L.buildIdsQuery(['a"b']), 'id:"ab"');
    assert.equal(L.buildIdsQuery([]), '');
});

test('readList : valeurs absentes, abîmées ou de mauvais type donnent une liste vide', () => {
    assert.deepEqual(L.readList(fakeStorage(), 'k'), []);
    assert.deepEqual(L.readList(fakeStorage({ k: '{pas du json' }), 'k'), []);
    assert.deepEqual(L.readList(fakeStorage({ k: '{"a":1}' }), 'k'), []);
    assert.deepEqual(L.readList(fakeStorage({ k: '["a", 3, null, "b"]' }), 'k'), ['a', 'b']);
});

test('writeList : écrit en JSON, renvoie false si le stockage refuse', () => {
    const storage = fakeStorage();
    assert.equal(L.writeList(storage, 'k', ['a']), true);
    assert.equal(storage.raw.k, '["a"]');
    const full = { setItem() { throw new Error('QuotaExceededError'); } };
    assert.equal(L.writeList(full, 'k', ['a']), false);
});

test('toggleId : ajoute puis retire, sans modifier la liste d\'origine', () => {
    const list = ['a'];
    assert.deepEqual(L.toggleId(list, 'b'), ['a', 'b']);
    assert.deepEqual(L.toggleId(['a', 'b'], 'a'), ['b']);
    assert.deepEqual(list, ['a']);
});

test('sortByIds : remet les cartes dans l\'ordre de la liste', () => {
    const cards = [{ id: 'c' }, { id: 'a' }, { id: 'b' }];
    assert.deepEqual(L.sortByIds(cards, ['a', 'b', 'c']).map((c) => c.id), ['a', 'b', 'c']);
});

test('sortByIds : une carte inattendue passe en dernier', () => {
    assert.deepEqual(L.sortByIds([{ id: 'x' }, { id: 'a' }], ['a']).map((c) => c.id), ['a', 'x']);
});

test('renderCard : échappe nom, set et identifiant (pas d\'injection HTML)', () => {
    const html = L.renderCard({
        id: 'x"><script>1</script>',
        name: '<b>Pika</b>',
        images: { small: 'https://img/x.png' },
        set: { name: 'Set & Co' },
    });
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<b>Pika'));
    assert.ok(html.includes('Set &amp; Co'));
    assert.ok(html.includes('data-card-id='));
});

test('listOrNone : liste lisible ou "Aucune"', () => {
    assert.equal(L.listOrNone(undefined), 'Aucune');
    assert.equal(L.listOrNone([]), 'Aucune');
    assert.equal(L.listOrNone(['Feu', 'Eau']), 'Feu, Eau');
    assert.equal(L.listOrNone([{ type: 'Eau', value: 'x2' }], (w) => `${w.type} (${w.value})`), 'Eau (x2)');
});
