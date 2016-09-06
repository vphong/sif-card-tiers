app.constant('Typeahead', ['Nishikino Maki', 'Koizumi Hanayo', 'Hoshizora Rin', 'Minami Kotori', 'Sonoda Umi', 'Kousaka Honoka', 'Ayase Eli', 'Toujou Nozomi', 'Yazawa Nico']);

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
    compare: "sc"
})

app.run(function($rootScope, Typeahead, InitFilters, CardData) {
    $rootScope.Typeahead = Typeahead;
    $rootScope.InitFilters = InitFilters;
    $rootScope.Cards = CardData;
});
