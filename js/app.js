var app = angular.module('tierList', ['ui.bootstrap', 'ui.router.tabs',
    'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor', 'mgcrea.ngStrap',
    'ui.router', 'LocalStorageModule', 'fixed.table.header'
]);

app.factory('cardInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory({
        referenceId: 'table',
        requestsMatcher: function(requestConfig) {
            return requestConfig.url.indexOf('ownedcards') !== -1;
        }
    });
});

app.factory('accountInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory({
        referenceId: 'accounts',
        requestsMatcher: function(requestConfig) {
            return requestConfig.url.indexOf('owner__username') !== -1;
        }
    });
});

app.factory('allCardsInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory({
        referenceId: 'all',
        // requestsMatcher: function(requestConfig) {
        //     return requestConfig.url.indexOf('cards') !== -1;
        // }
    });
});

app.config(function($httpProvider) {
    $httpProvider.interceptors.push('allCardsInterceptor');
    $httpProvider.interceptors.push('cardInterceptor');
    $httpProvider.interceptors.push('accountInterceptor');
});

app.run(function(bsLoadingOverlayService) {
    bsLoadingOverlayService.setGlobalConfig({
        delay: 900, // Minimal delay to hide loading overlay in ms.
        templateUrl: 'loading-overlay.html' // Template url for overlay element. If not specified - no overlay element is created.
    });
});

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state("home", {
            url: "/",
            templateUrl: "info.html",
        })
        .state("all", {
            url: "/all",
            controller: 'TierCtrl',
            templateUrl: "all_cards.html",
        })
        .state("user", {
            url: "/user",
            controller: 'UserCtrl',
            templateUrl: "user_cards.html",
        })
});

app.controller('TabCtrl', function($rootScope, $scope, $state) {
    $scope.tabs = [{
        heading: "Home",
        route: "home",
        active: true
    }, {
        heading: "All Cards",
        route: "all",
        active: false
    }, {
        heading: "User Cards",
        route: "user",
        active: true
    }];

    $scope.go = function(route) {
        $state.go(route);
    };

    $scope.active = function(route) {
        return $state.is(route);
    };

    $scope.$on("$stateChangeSuccess", function() {
        $scope.tabs.forEach(function(tab) {
            tab.active = $scope.active(tab.route);
        });
    });
});

app.factory('Cards', function($rootScope, $http) {
    var ret = {};

    ret.getUrl = function(url) {
        return $http.get(url)
    }

    ret.filterCards = function(filters, cards) {
        var card;
        var newCards = [];
        var len = cards.length;

        angular.forEach(cards, function(card) {
            if ((filters.server == 'en' && !card.japan_only ||
                    filters.server == 'jp') &&

                (filters.sr && card.rarity == "SR" ||
                    filters.ssr && card.rarity == "SSR" ||
                    filters.ur && card.rarity == "UR") &&

                (filters.attribute == 'all' && card.attribute ||
                    filters.attribute == 'smile' && card.attribute == "Smile" ||
                    filters.attribute == 'pure' && card.attribute == "Pure" ||
                    filters.attribute == 'cool' && card.attribute == "Cool") &&

                ((filters.premium && !card.event && !card.is_promo) ||
                    filters.event && card.event || filters.promo && card.is_promo) &&

                (filters.compare == "scorers" && card.skill.type == "Score Up" ||
                    filters.compare == "perfect locks" && card.skill.type == "Perfect Lock" ||
                    filters.compare == "healers" && card.skill.type == "Healer") &&

                (filters.muse && card.main_unit == "Muse" ||
                    filters.aqours && card.main_unit == "Aqours")
            ) {
                newCards.push(card);
            }
        })
        return newCards;
    }


    var stat_to_mod = function(card, idlz) {
        var stat = 0;
        if (card.attribute == "Smile" && idlz) {
            stat = card.idolized_maximum_statistics_smile;
        } else if (card.attribute == "Smile" && !idlz) {
          stat = card.non_idolized_maximum_statistics_smile;
        } else if (card.attribute == "Pure" && idlz) {
          stat = card.idolized_maximum_statistics_pure;
        } else if (card.attribute == "Pure" && !idlz) {
          stat = card.non_idolized_maximum_statistics_pure;
        } else if (card.attribute == "Cool" && idlz) {
          stat = card.idolized_maximum_statistics_cool;
        } else if (card.attribute == "Cool" && !idlz) {
          stat = card.non_idolized_maximum_statistics_cool;
        }

        if (idlz && card.rarity == "UR") return stat + 1000;
        else if ((!idlz && card.rarity == "UR") ||(idlz && card.rarity == "SR"))
          return stat + 500;
        else if (!idlz && card.rarity == "SR") return stat + 250;
        else if (idlz && card.rarity == "SSR") return stat + 750;
        else if (!idlz && card.rarity == "SSR") return stat + 375;
        else return 0;

    }
    ret.calcSkill = function(cards, song, heel) {
        var skill;
        var activations = 0;
        var score_up = 0;
        angular.forEach(cards, function(card) {
            // for each ~act_count~ ~act_type~, ~act_percent~ chance of ~act_val~
            // skill value = (# of activation times) * (chance of activation) * (activation value)
            if (card.skill.activation_type == "perfects") {
                activations = Math.floor(song.notes * song.perfects / card.skill.activation_count)
            } else if (card.skill.activation_type == "seconds") {
                activations = Math.floor(song.seconds / card.skill.activation_count)
            } else { // notes or combo string
                activations = Math.floor(song.notes / card.skill.activation_count)
            }
            card.skill.avg = activations * card.skill.activation_percent * card.skill.activation_value
            card.skill.best = activations * card.skill.activation_value

            if (card.skill.type == "Score Up") {
                card.cScore += card.skill.avg;
                card.cScore_idlz += card.skill.avg;
                card.oScore += card.skill.avg;
                card.oScore_idlz += card.skill.avg;
            } else if (card.skill.type == "Healer" && heel) {
                // recalculate cScore and oScore
                if (card.rarity == "SR") {
                    // c/oScore unidlz: 2 slots; cScore idlz: 3 slots
                    // can't equip heel: error
                    card.cScore_heel = 0;
                    card.cScore_idlz_heel = 0;
                    card.oScore_heel = 0;

                    // oScore idlz: 4 slots
                    card.oScore = card;

                } else if (card.rarity == "SSR") {

                } else { // card.rarity == "UR"

                }

            }

        });
    }

    ret.sortBy = function(sort, idlz, type) {
        sort.desc = (sort.type == type || sort.gen == type) ? !sort.desc : true;

        sort.type = type;

        if (type == 'smile' && idlz) {
            sort.type = "idolized_maximum_statistics_smile";
            sort.gen = "smile";
        } else if (type == 'smile' && !idlz) {
            sort.type = "non_idolized_maximum_statistics_smile";
            sort.gen = "smile";
        } else if (type == 'pure' && idlz) {
            sort.type = "idolized_maximum_statistics_pure"
            sort.gen = "pure";
        } else if (type == 'pure' && !idlz) {
            sort.type = "non_idolized_maximum_statistics_pure"
            sort.gen = "pure";
        } else if (type == 'cool' && idlz) {
            sort.type = "idolized_maximum_statistics_cool"
            sort.gen = "cool";
        } else if (type == 'cool' && !idlz) {
            sort.type = "non_idolized_maximum_statistics_cool"
            sort.gen = "cool";
        } else {

            sort.gen = "";
            sort.type = type;

            if (type == 'cScore') {
                sort.gen = "cScore"
                if (idlz) sort.type = "cScore_idlz";
                else sort.type = "cScore";
            } else if (type == 'oScore') {
                sort.gen = "oScore"
                if (idlz) sort.type = "oScore_idlz";
                else sort.type = "oScore";

            } else if (type == 'cScore_heel') {
                sort.gen = "cScore_heel"
                if (idlz) sort.type = "cScore_heel_idlz";
                else sort.type = "cScore_heel";
            } else if (type == 'oScore_heel') {
                sort.gen = "oScore_heel"
                if (idlz) sort.type = "oScore_heel_idlz";
                else sort.type = "oScore_heel";

            }
        }
    }


    return ret;
})

app.controller('TierCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    var init = function() {
        $scope.filters = localStorageService.get('filters');
        if (!$scope.filters) $scope.filters = angular.copy($rootScope.InitFilters);

        /*$scope.cards = localStorageService.get('cards');
        if (!$scope.cards)*/
        $scope.cards = Cards.filterCards($scope.filters, angular.copy($rootScope.Cards));
        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore',
                desc: true,
                gen: "cScore"
            }
        }
        $scope.search = localStorageService.get('search');
        if (!$scope.search) $scope.search = "";

        $scope.song = localStorageService.get('song');
        if (!$scope.song) $scope.song = angular.copy($rootScope.Song);
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);


    }
    init();

    $scope.toggleHeel = function() {
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel)

    }

    $scope.updateSearch = function() {
        localStorageService.set('search', $scope.search);
    }

    $scope.updateSong = function() {
        localStorageService.set('song', $scope.song);
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel)
    }

    $scope.err = {};
    $scope.err.rarity = !$scope.filters.sr && !$scope.filters.ssr && !$scope.filters.ur;
    $scope.err.origin = !$scope.filters.premium && !$scope.filters.event && !$scope.filters.promo;
    $scope.err.main = !$scope.filters.muse && !$scope.filters.aqours;
    $scope.filterCards = function() {
        $scope.cards = Cards.filterCards($scope.filters, $rootScope.Cards);
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel)
            // localStorageService.set('cards', $scope.cards);

        $scope.err.rarity = !$scope.filters.sr && !$scope.filters.ssr && !$scope.filters.ur;
        $scope.err.origin = !$scope.filters.premium && !$scope.filters.event && !$scope.filters.promo;
        $scope.err.main = !$scope.filters.muse && !$scope.filters.aqours;

        $scope.filters.originStr = "";
        if ($scope.filters.premium && $scope.filters.event && $scope.filters.promo)
            $scope.filters.originStr = "premium scouting, events, promos";
        else if ($scope.filters.premium && $scope.filters.event && !$scope.filters.promo)
            $scope.filters.originStr = "premium scouting and events";
        else if ($scope.filters.premium && !$scope.filters.event && $scope.filters.promo)
            $scope.filters.originStr = "premium scouting and promos";
        else if (!$scope.filters.premium && $scope.filters.event && $scope.filters.promo)
            $scope.filters.originStr = "events and promos";
        else if ($scope.filters.premium && !$scope.filters.event && !$scope.filters.promo)
            $scope.filters.originStr = "premium scouting";
        else if (!$scope.filters.premium && $scope.filters.event && !$scope.filters.promo)
            $scope.filters.originStr = "events";
        else if (!$scope.filters.premium && !$scope.filters.event && $scope.filters.promo)
            $scope.filters.originStr = "promos";
        localStorageService.set('filters', $scope.filters);

    }

    $scope.$watch('filters.compare', function(n, o) {
        if (n != o) {
            if ($scope.filters.compare != "healers") $scope.filters.heel = false;
            $scope.sort.type = 'cScore';
            $scope.sort.gen = "cScore";
            localStorageService.set('sort', $scope.sort)
        }
    })


    $scope.resetFilters = function() {
        $scope.filters = angular.copy($rootScope.InitFilters);
        localStorageService.set('filters', $scope.filters);

        $scope.sort = {
            type: 'cScore',
            desc: false,
            gen: "cScore"
        }
        $scope.filterCards()
        $scope.sortBy('cScore');
    }
    $scope.setLocalStorageFilters = function() {
        localStorageService.set('filters', $scope.filters);
    }

    $scope.sortBy = function(type) {
        if ($scope.filters.heel && type.includes("skill")) {
            type = type + "Heel";
        }
        Cards.sortBy($scope.sort, $scope.filters.idlz, type)
        localStorageService.set('sort', $scope.sort)
    }

    $scope.displayCScore = function(card) {
        if ($scope.filters.idlz && $scope.filters.heel) {
            return card.cScore_idlz_heel ? card.cScore_idlz_heel : 0;
        } else if ($scope.filters.idlz && !$scope.filters.heel) {
            return card.cScore_idlz
        } else if (!$scope.filters.idlz && $scope.filters.heel) {
            return card.cScore_heel ? card.cScore_heel : 0;
        } else {
            return card.cScore
        }
    }
    $scope.displayOScore = function(card) {
        if ($scope.filters.idlz && $scope.filters.heel) {
            return card.oScore_idlz_heel ? card.oScore_idlz_heel : 0;
        } else if ($scope.filters.idlz && !$scope.filters.heel) {
            return card.oScore_idlz
        } else if (!$scope.filters.idlz && $scope.filters.heel) {
            return card.oScore_heel ? card.oScore_heel : 0;
        } else {
            return card.oScore
        }
    }

});

app.controller('UserCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    var init = function() {
        $scope.userFilters = localStorageService.get('userFilters');
        if (!$scope.userFilters) {
            $scope.userFilters = angular.copy($rootScope.InitFilters);
            $scope.userFilters.displayImg = true;
        }

        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore',
                desc: true,
                gen: "cScore"
            }
            localStorageService.set('sort', $scope.filters);
        }

        $scope.sit = localStorageService.get('sit');
        if (!$scope.sit) {
            $scope.sit = {};
        } else {
            // $scope.userCards = [];
        }
        $scope.userCards = localStorageService.get('userCards');
        if (!$scope.userCards) $scope.userCards = [];

        $scope.userSearch = localStorageService.get('userSearch');
        if (!$scope.userSearch) $scope.userSearch = "";

        // storage for http result of account grabbing
        $scope.rawUserCards = localStorageService.get('rawUserCards');
        // storage for card data of rawUserCards
        $scope.rawUserCardsData = localStorageService.get('rawUserCardsData');

    }
    init();

    $scope.updateSearch = function() {
        localStorageService.set('userSearch', $scope.userSearch);
    }

    // get accounts from sit username
    var accUrlBase = "https://schoolido.lu/api/accounts/?owner__username=";
    $scope.updateUser = function() {
        $scope.sit.accountsUrl = accUrlBase + $scope.sit.user;
        localStorageService.set('sit', $scope.sit);
        $scope.sit.accErr = false;
        // if ($scope.sit.user == '') {
        // $scope.sit.accounts =
        // $scope.sit.accounts = [{
        //     "name": "No accounts found",
        //     "id": ""
        // }];
        // }
        // $scope.userCards = [];
        // $scope.rawUserCards = [];
        // localStorageService.set('userCards', $scope.userCards)
        // localStorageService.set('rawUserCards', $scope.rawUserCards)


    }
    $scope.updateUser();

    var oCardUrlBase = "https://schoolido.lu/api/ownedcards/?card__rarity=SR,SSR,UR&stored=deck&card__is_special=False&page_size=1000&owner_account=";
    var getAccountsSuccess = function(response) {
        var accounts = response.data.results;
        if (accounts && accounts.length > 0) {
            $scope.sit.accounts = [{
                "name": "Select an account",
                "id": ""
            }];
            $scope.sit.accErr = false;
            var acc = {};
            for (var i = 0; i < accounts.length; i++) {
                acc = {
                    "name": accounts[i].nickname + " " + accounts[i].language,
                    "id": accounts[i].id,
                }
                $scope.sit.accounts.push(acc);
            }
            $scope.sit.chosenAccount = $scope.sit.accounts[0];
            $scope.sit.ownedCardsUrl = oCardUrlBase + $scope.sit.chosenAccount.id;


        } else {
            $scope.sit.accounts = [{
                "name": "No accounts found",
                "id": ""
            }];
            $scope.sit.accErr = true;
            $scope.rawUserCards = [];
            $scope.rawUserCardsData = [];
            $scope.userCards = [];
            localStorageService.set('sit', $scope.sit);
            localStorageService.set('userCards', $scope.userCards);
            localStorageService.set('rawUserCards', $scope.rawUserCards);
            localStorageService.set('rawUserCardsData', $scope.rawUserCardsData);

        };
        localStorageService.set('sit', $scope.sit)
    };

    $scope.getAccounts = function() {
        $scope.grabbedAccounts = true;
        $scope.rawUserCards = [];
        $scope.userCards = [];
        $scope.rawUserCardsData = [];

        Cards.getUrl($scope.sit.accountsUrl).then(getAccountsSuccess);
    };

    ////// get cards from sit account
    $scope.chooseAccount = function() { // get api url from select
        // $scope.grabbedCards = false;
        $scope.sit.ownedCardsUrl = oCardUrlBase + $scope.sit.chosenAccount.id;
        localStorageService.set('sit', $scope.sit)
    };

    var nextUrl;
    var getCardsSuccess = function(response) {
        if (response.data.next) nextUrl = "https" + response.data.next.substring(4);
        else nextUrl = null;

        var rawUserCards = response.data.results;
        // localStorageService.set('rawUserCards', $scope.rawUserCards);


        // grab owned card ids
        // populate rawUserCardsData with cards owned from root cards
        // angular.forEach($scope.rawUserCards, function(userCard) {
        var userCard;
        for (var i = 0; i < rawUserCards.length; i++) {
            // for each user card
            if (rawUserCards[i - 1]) prevUserCard = rawUserCards[i - 1];
            else prevUserCard = "";
            userCard = rawUserCards[i];
            angular.forEach($rootScope.Cards, function(card) {
                // search card database
                if (userCard.card == card.id) {
                    // if userCard game id == database id and SIT ids are different
                    // then card is found, push card data and idlz status
                    card.user_idlz = userCard.idolized;

                    if (card.user_idlz) {
                        // set smile, pure, cool stats to idolized stats
                        card.max_smile = card.idolized_maximum_statistics_smile;
                        card.max_pure = card.idolized_maximum_statistics_pure;
                        card.max_cool = card.idolized_maximum_statistics_cool;

                        // set c/o score to idlz score
                        card.cScore = card.cScore_idlz;
                        card.cScore_heel = card.cScore_heel_idlz;
                        card.oScore = card.oScore_idlz;
                        card.oScore_heel = card.oScore_heel_idlz;

                    } else {
                        // set smile, pure, cool stats to idolized stats
                        card.max_smile = card.non_idolized_maximum_statistics_smile;
                        card.max_pure = card.non_idolized_maximum_statistics_pure;
                        card.max_cool = card.non_idolized_maximum_statistics_cool;

                        // set c/o score to idlz score
                        card.cScore = card.cScore;
                        card.cScore_heel = card.cScore_heel;
                        card.oScore = card.oScore;
                        card.oScore_heel = card.oScore_heel;
                    }

                    $scope.rawUserCardsData.push(angular.copy(card));
                }
            })
        }

        // // grab rawUserCard idolized status
        // angular.forEach($scope.rawUserCardsData, function(rawCardData) {
        //
        //     if (rawCardData.user_idlz) {
        //         // set smile, pure, cool stats to idolized stats
        //         rawCardData.max_smile = rawCardData.idolized_maximum_statistics_smile;
        //         rawCardData.max_pure = rawCardData.idolized_maximum_statistics_pure;
        //         rawCardData.max_cool = rawCardData.idolized_maximum_statistics_cool;
        //
        //         // set c/o score to idlz score
        //         rawCardData.cScore = rawCardData.cScore_idlz;
        //         rawCardData.cScore_heel = rawCardData.cScore_heel_idlz;
        //         rawCardData.oScore = rawCardData.oScore_idlz;
        //         rawCardData.oScore_heel = rawCardData.oScore_heel_idlz;
        //
        //     } else {
        //         // set smile, pure, cool stats to idolized stats
        //         rawCardData.max_smile = rawCardData.non_idolized_maximum_statistics_smile;
        //         rawCardData.max_pure = rawCardData.non_idolized_maximum_statistics_pure;
        //         rawCardData.max_cool = rawCardData.non_idolized_maximum_statistics_cool;
        //
        //         // set c/o score to idlz score
        //         rawCardData.cScore = rawCardData.cScore;
        //         rawCardData.cScore_heel = rawCardData.cScore_heel;
        //         rawCardData.oScore = rawCardData.oScore;
        //         rawCardData.oScore_heel = rawCardData.oScore_heel;
        //     }
        //
        // });

        if (nextUrl) Cards.getUrl(nextUrl).then(getCardsSuccess);
        localStorageService.set('rawUserCardsData', $scope.rawUserCardsData);

        // filter for display
        $scope.userCards = angular.copy(Cards.filterCards($scope.userFilters, $scope.rawUserCardsData));
        localStorageService.set('userCards', $scope.userCards)

    };
    var getCardsError = function(response) {
        // TODO
    }
    $scope.getCards = function() {
        $scope.rawUserCardsData = [];
        $scope.userCards = [];
        Cards.getUrl($scope.sit.ownedCardsUrl).then(getCardsSuccess);
    };

    $scope.err = {};
    $scope.err.rarity = !$scope.userFilters.sr && !$scope.userFilters.ssr && !$scope.filters.ur;
    $scope.err.origin = !$scope.userFilters.premium && !$scope.userFilters.event && !$scope.filters.promo;
    $scope.err.main = !$scope.userFilters.muse && !$scope.userFilters.aqours;

    $scope.filterCards = function() {
        $scope.userCards = Cards.filterCards($scope.userFilters, angular.copy($scope.rawUserCardsData));

        localStorageService.set('userFilters', $scope.userFilters);
        localStorageService.set('userCards', $scope.userCards);

        $scope.err.rarity = !$scope.userFilters.sr && !$scope.userFilters.ssr && !$scope.userFilters.ur;
        $scope.err.origin = !$scope.userFilters.premium && !$scope.userFilters.event && !$scope.userFilters.promo;
        $scope.err.main = !$scope.userFilters.muse && !$scope.userFilters.aqours;

        $scope.userFilters.originStr = "";
        if ($scope.userFilters.premium && $scope.userFilters.event && $scope.userFilters.promo)
            $scope.userFilters.originStr = "premium scouting, events, and promos";
        else if ($scope.userFilters.premium && $scope.userFilters.event && !$scope.userFilters.promo)
            $scope.userFilters.originStr = "premium scouting and events";
        else if ($scope.userFilters.premium && !$scope.userFilters.event && $scope.userFilters.promo)
            $scope.userFilters.originStr = "premium scouting and promos";
        else if (!$scope.userFilters.premium && $scope.userFilters.event && $scope.userFilters.promo)
            $scope.userFilters.originStr = "events and promos";
        else if ($scope.userFilters.premium && !$scope.userFilters.event && !$scope.userFilters.promo)
            $scope.userFilters.originStr = "premium scouting";
        else if (!$scope.userFilters.premium && $scope.userFilters.event && !$scope.userFilters.promo)
            $scope.userFilters.originStr = "events";
        else if (!$scope.userFilters.premium && !$scope.userFilters.event && $scope.userFilters.promo)
            $scope.userFilters.originStr = "promos";

        $scope.userFilters.rarityStr = "";
        if ($scope.userFilters.sr && $scope.userFilters.ssr && $scope.userFilters.ur)
            $scope.userFilters.rarityStr = "SRs, SSRs, and URs";
        else if ($scope.userFilters.sr && !$scope.userFilters.ssr && $scope.userFilters.ur)
            $scope.userFilters.rarityStr = "SRs and URs";
        else if ($scope.userFilters.sr && $scope.userFilters.ssr && !$scope.userFilters.ur)
            $scope.userFilters.rarityStr = "SRs and SSRs";
        else if (!$scope.userFilters.sr && $scope.userFilters.ssr && $scope.userFilters.ur)
            $scope.userFilters.rarityStr = "SSRs and URs";
        else if ($scope.userFilters.sr && !$scope.userFilters.ssr && !$scope.userFilters.ur)
            $scope.userFilters.rarityStr = "SRs";
        else if (!$scope.userFilters.sr && $scope.userFilters.ssr && !$scope.userFilters.ur)
            $scope.userFilters.rarityStr = "SSRs";
        else if (!$scope.userFilters.sr && !$scope.userFilters.ssr && $scope.userFilters.ur)
            $scope.userFilters.rarityStr = "URs";


    }
    $scope.$watch('userFilters.compare', function(n, o) {
        if (n != o) {
            $scope.sort.type = 'cScore';
            $scope.sort.gen = "cScore";
            localStorageService.set('sort', $scope.sort)
        }
    })

    $scope.setLocalStorageFilters = function() {
        localStorageService.set('userFilters', $scope.userFilters)
    }


    $scope.resetFilters = function() {
        $scope.userFilters = angular.copy($rootScope.InitFilters);
        localStorageService.set('userFilters', $scope.userFilters);

        $scope.sort = {
            type: 'cScore',
            desc: false,
            gen: "cScore"
        }
        $scope.filterCards()
        $scope.sortBy('cScore');
    }

    $scope.sortBy = function(type) {
        Cards.sortBy($scope.sort, $scope.userFilters.idlz, type)
        localStorageService.set('sort', $scope.sort)
    }


});

var modalController = function($scope, $uibModalInstance) {
    $scope.close = function() {
        $uibModalInstance.close();
    };
};
modalController.$inject = ['$scope', '$uibModalInstance'];

app.controller('ChangelogCtrl', function($scope, $uibModal) {
    $scope.open = function(size) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'changelog.html',
            controller: modalController,
            size: size,
            resolve: {}
        });
    };
})
