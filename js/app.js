var app = angular.module('tierList', ['ui.bootstrap', 'ui.router.tabs',
    'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor',
    'ui.router', 'LocalStorageModule', 'fixed.table.header'
]);

app.factory('allHttpInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory({
        referenceId: 'table'
    });
});

app.config(function($httpProvider) {
    $httpProvider.interceptors.push('allHttpInterceptor');
});

app.run(function(bsLoadingOverlayService) {
    bsLoadingOverlayService.setGlobalConfig({
        delay: 900, // Minimal delay to hide loading overlay in ms.
        templateUrl: 'loading-overlay.html' // Template url for overlay element. If not specified - no overlay element is created.
    });
});

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/all");

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

        for (var i = 0; i < len; i++) {
            card = cards[i];


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
        }
        return newCards;
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

        $scope.cards = localStorageService.get('cards');
        if (!$scope.cards) $scope.cards = angular.copy($rootScope.Cards);
        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore',
                desc: false,
                gen: "cScore"
            }
        }

        $scope.collapse = localStorageService.get('collapse');
    }
    init();

    $scope.err = {};
    $scope.err.rarity = !$scope.filters.sr && !$scope.filters.ssr && !$scope.filters.ur;
    $scope.err.origin = !$scope.filters.premium && !$scope.filters.event && !$scope.filters.promo;
    $scope.err.main = !$scope.filters.muse && !$scope.filters.aqours;
    $scope.filterCards = function() {
        $scope.cards = Cards.filterCards($scope.filters, $rootScope.Cards);
        localStorageService.set('cards', $scope.cards);

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
            $scope.sort.type = 'cScore';
            $scope.sort.gen = "cScore";
            localStorageService.set('sort', $scope.sort)
        }
    })

    $scope.collapsing = function() {
        $scope.collapse = !$scope.collapse;
        localStorageService.set('collapse', $scope.collapse)
    };

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

    $scope.sortBy = function(type) {
        Cards.sortBy($scope.sort, $scope.filters.idlz, type)
        localStorageService.set('sort', $scope.sort)
    }

});

app.controller('UserCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    var init = function() {
        $scope.filters = localStorageService.get('filters');
        if (!$scope.filters) $scope.filters = angular.copy($rootScope.InitFilters);

        $scope.userCards = localStorageService.get('userCards');
        if (!$scope.userCards) $scope.userCards = [];
        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore',
                desc: true,
                gen: "cScore"
            }
        }

        $scope.collapse = localStorageService.get('collapse');
        $scope.sit = localStorageService.get('sit');
        if (!$scope.sit) $scope.sit = {};

    }
    init();

    $scope.setLocalStorageFilters = function() {
        localStorageService.set('filters', $scope.filters)
    }

    $scope.collapsing = function() {
        $scope.collapse = !$scope.collapse;
        localStorageService.set('collapse', $scope.collapse)
    };

    var accUrlBase = "https://schoolido.lu/api/accounts/?owner__username=";
    $scope.updateUser = function() {
        $scope.sit.accountsUrl = accUrlBase + $scope.sit.user;
        localStorageService.set('sit', $scope.sit)
    }
    $scope.updateUser();

    var oCardUrlBase = "https://schoolido.lu/api/ownedcards/?card__rarity=SR,SSR,UR&stored=deck&card__is_special=False&page_size=200&owner_account=";
    var getAccountsSuccess = function(data, status) {
        var accounts = data.results;
        var len = accounts.length
        $scope.sit.accounts = [];
        var acc = {};
        for (var i = 0; i < len; i++) {
            acc = {
                "name": accounts[i].nickname + " " + accounts[i].language,
                "id": accounts[i].id,
            }
            $scope.sit.accounts.push(acc);
        }
        $scope.sit.chosenAccount = $scope.sit.accounts[0];
        $scope.sit.ownedCardsUrl = oCardUrlBase + $scope.sit.chosenAccount.id;
        localStorageService.set('sit', $scope.sit)

    }
    $scope.getAccounts = function() {
        Cards.getUrl($scope.sit.accountsUrl).success(getAccountsSuccess);
    };

    $scope.chooseAccount = function() {
        $scope.sit.ownedCardsUrl = oCardUrlBase + $scope.sit.chosenAccount.id;
        localStorageService.set('sit', $scope.sit)

    }
    $scope.rawUserCards = {};
    var baseUserCards = [];
    var getCardsSuccess = function(data, status) {
        $scope.rawUserCards = data.results;
        baseUserCards = [];
        var cardIDs = [];
        var len = $scope.rawUserCards.length
        for (var i = 0; i < len; i++) {
            cardIDs.push($scope.rawUserCards[i].card)
        }
        angular.forEach(cardIDs, function(id) {
            angular.forEach($rootScope.Cards, function(card) {
                if (id === card.id) {
                    baseUserCards.push(card)
                }
            });
        });
        $scope.userCards = Cards.filterCards($scope.filters, baseUserCards);
        localStorageService.set('userCards', $scope.userCards)

    };
    // TODO: recalculate o-score/c-score from idolized/max bond status
    // TODO: take away idlz toggle and show img only if user has idolized cards
    $scope.isIdlz = function() {
        angular.forEach($scope.rawUserCards, function(rawUser) {
            angular.forEach($scope.userCards, function(user) {
                if (rawUser.idolized) {
                    // $scope.userCards
                }
            });
        });

    }
    $scope.getCards = function() {
        Cards.getUrl($scope.sit.ownedCardsUrl).success(getCardsSuccess);
    };

    $scope.err = {};
    $scope.err.rarity = !$scope.filters.sr && !$scope.filters.ssr && !$scope.filters.ur;
    $scope.err.origin = !$scope.filters.premium && !$scope.filters.event && !$scope.filters.promo;
    $scope.err.main = !$scope.filters.muse && !$scope.filters.aqours;

    $scope.filterCards = function() {
        $scope.userCards = Cards.filterCards($scope.filters, baseUserCards);
        localStorageService.set('filters', $scope.filters);
        localStorageService.set('userCards', $scope.userCards);

        $scope.err.rarity = !$scope.filters.sr && !$scope.filters.ssr && !$scope.filters.ur;
        $scope.err.origin = !$scope.filters.premium && !$scope.filters.event && !$scope.filters.promo;
        $scope.err.main = !$scope.filters.muse && !$scope.filters.aqours;

        $scope.filters.originStr = "";
        if ($scope.filters.premium && $scope.filters.event && $scope.filters.promo)
            $scope.filters.originStr = "premium scouting, events, and promos";
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

        $scope.filters.rarityStr = "";
        if ($scope.filters.sr && $scope.filters.ssr && $scope.filters.ur)
            $scope.filters.rarityStr = "SRs, SSRs, and URs";
        else if ($scope.filters.sr && !$scope.filters.ssr && $scope.filters.ur)
            $scope.filters.rarityStr = "SRs and URs";
        else if ($scope.filters.sr && $scope.filters.ssr && !$scope.filters.ur)
            $scope.filters.rarityStr = "SRs and SSRs";
        else if (!$scope.filters.sr && $scope.filters.ssr && $scope.filters.ur)
            $scope.filters.rarityStr = "SSRs and URs";
        else if ($scope.filters.sr && !$scope.filters.ssr && !$scope.filters.ur)
            $scope.filters.rarityStr = "SRs";
        else if (!$scope.filters.sr && $scope.filters.ssr && !$scope.filters.ur)
            $scope.filters.rarityStr = "SSRs";
        else if (!$scope.filters.sr && !$scope.filters.ssr && $scope.filters.ur)
            $scope.filters.rarityStr = "URs";


    }
    $scope.$watch('filters.compare', function(n, o) {
        if (n != o) {
            $scope.sort.type = 'cScore';
            $scope.sort.gen = "";
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

    $scope.sortBy = function(type) {
        Cards.sortBy($scope.sort, $scope.filters.idlz, type)
        localStorageService.set('sort', $scope.sort)
    }

});
