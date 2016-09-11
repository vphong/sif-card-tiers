app.constant('Typeahead', [
    'Nishikino Maki', 'Koizumi Hanayo', 'Hoshizora Rin',
    'Minami Kotori', 'Sonoda Umi', 'Kousaka Honoka',
    'Ayase Eli', 'Toujou Nozomi', 'Yazawa Nico',
    "Ohara Mari", "Kurosawa Dia", "Matsuura Kanan",
    "Takami Chika", "Sakurauchi Riko", "Watanabe You",
    "Kunikida Hanamaru", "Kurosawa Ruby", "Tsushima Yoshiko",
    "lily white", "Printemps", "BiBi",
    "AZALEA", "CYaRon!", "Guilty Kiss",
    "Pure", "Cool", "Smile", "Muse", "Aqours",
    "Score Up", "Perfect Lock", "Healer"
]);

app.constant('InitFilters', {
    server: 'jp',
    attribute: 'all',
    sr: true,
    ssr: true,
    ur: true,
    premium: true,
    event: true,
    promo: true,
    sc: true,
    pl: true,
    hl: true,
    muse: true,
    aqours: true,
    idlz: false,
    compare: "scorers"
})

app.run(function($rootScope, Typeahead, InitFilters, CardData) {
    $rootScope.Typeahead = Typeahead;
    $rootScope.InitFilters = InitFilters;
    $rootScope.Cards = CardData;
});