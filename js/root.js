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
    "Score Up", "Perfect Lock", "Healer",
    // "First year", "Second year", "Third year"
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
    su: true,
    pl: true,
    hl: true,
    subunit: "all",
    year: "all"
})
app.constant('InitSong', {
  notes: 550,
  seconds: 125,
  perfects: .85,
  stars: 65
})
app.constant('BaseSkill', {
    "activation_count": 25,
    "activation_type": "notes",
    "activation_percent": .38,
    "activation_value": 200,
    "editing": false,
    "type": "Score Up",
    "string": "score"
})
app.run(function($rootScope, Typeahead, InitFilters, InitSong, CardData, SongData, BaseSkill) {
    $rootScope.Typeahead = angular.copy(Typeahead);
    $rootScope.InitFilters = angular.copy(InitFilters);
    $rootScope.Cards = angular.copy(CardData);
    $rootScope.Song = angular.copy(InitSong);
    $rootScope.Skill = angular.copy(BaseSkill)


});
