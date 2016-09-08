var app = angular.module('tierList', ['ui.bootstrap',
    'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor', 'fsm',
    'ui.router', 'ui.grid', 'ui.grid.pagination', 'LocalStorageModule'
]);

app.factory('allHttpInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory();
});

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/all");

    $stateProvider
        .state("all", {
            url: "/",
            controller: 'TierCtrl',
            templateUrl: "all_cards.html",
        })

    .state("user", {
            url: "/user",
            templateUrl: "user_cards.html",
        })
        .state("info", {
            url: "/info",
            templateUrl: "user_cards.html",
        })
});

app.controller('TabCtrl', function($rootScope, $scope, $state) {
    $scope.tabs = [{
        heading: "All Cards",
        route: "all",
        active: false
    }, {
        heading: "User Cards",
        route: "user",
        active: true
    }, {
        heading: "Info",
        route: "info",
        active: true
    }, ];

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

app.config(function($httpProvider) {
    $httpProvider.interceptors.push('allHttpInterceptor');
});

app.run(function(bsLoadingOverlayService) {
    bsLoadingOverlayService.setGlobalConfig({
        delay: 900, // Minimal delay to hide loading overlay in ms.
        templateUrl: 'loading-overlay.html' // Template url for overlay element. If not specified - no overlay element is created.
    });
});

app.factory('Cards', function($rootScope) {
    var ret = {};

    ret.filterCards = function(filters) {
        var cards = $rootScope.Cards;
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

                (filters.compare == "sc" && card.skill.type == "Score Up" ||
                    filters.compare == "sc" && card.skill.type == "Healer" ||
                    filters.compare == "pl" && card.skill.type == "Perfect Lock" ||
                    filters.compare == "hl" && card.skill.type == "Healer") &&

                (filters.muse && card.main_unit == "Muse" ||
                    filters.aqours && card.main_unit == "Aqours")
            ) {
                newCards.push(card);
            }
        }
        return newCards;
    }


    return ret;
})

app.controller('TierCtrl', function($rootScope, $scope, Cards, localStorageService, uiGridConstants, $filter) {
    $scope.filters = localStorageService.get('filters');
    if (!$scope.filters) $scope.filters = $rootScope.InitFilters;

    $scope.cards = localStorageService.get('cards');
    if (!$scope.cards) $scope.cards = $rootScope.Cards;


    $scope.filterCards = function() {
        $scope.cards = Cards.filterCards($scope.filters);
        localStorageService.set('filters', $scope.filters);
        localStorageService.set('cards', $scope.cards);
    }

    $scope.$watch('filters.compare', function(n, o) {
        if (n != o) {
            $scope.sort.type = 'cScore';
            $scope.sort.gen = "";
            localStorageService.set('sort', $scope.sort)
        }
    })

    $scope.collapse = localStorageService.get('collapse');
    $scope.collapsing = function() {
        $scope.collapse = !$scope.collapse;
        localStorageService.set('collapse', $scope.collapse)
    };

    $scope.resetFilters = function() {
        $scope.filters = $rootScope.InitFilters;
        localStorageService.set('filters', $scope.filters);
        $scope.filterCards()
    }

    $scope.sort = localStorageService.get('sort');
    if (!$scope.sort) {
        $scope.sort = {
            type: 'cScore',
            desc: true,
        }
    }
    $scope.sortBy = function(type) {
        $scope.sort.desc = ($scope.sort.type == type || $scope.sort.gen == type) ? !$scope.sort.desc : true;

        $scope.sort.type = type;

        if (type == 'smile' && $scope.filters.idlz) {
            $scope.sort.type = "idolized_maximum_statistics_smile";
            $scope.sort.gen = "smile";
        } else if (type == 'smile' && !$scope.filters.idlz) {
            $scope.sort.type = "non_idolized_maximum_statistics_smile";
            $scope.sort.gen = "smile";
        } else if (type == 'pure' && $scope.filters.idlz) {
            $scope.sort.type = "idolized_maximum_statistics_pure"
            $scope.sort.gen = "pure";
        } else if (type == 'pure' && !$scope.filters.idlz) {
            $scope.sort.type = "non_idolized_maximum_statistics_pure"
            $scope.sort.gen = "pure";
        } else if (type == 'cool' && $scope.filters.idlz) {
            $scope.sort.type = "idolized_maximum_statistics_cool"
            $scope.sort.gen = "cool";
        } else if (type == 'cool' && !$scope.filters.idlz) {
            $scope.sort.type = "non_idolized_maximum_statistics_cool"
            $scope.sort.gen = "cool";
        } else if (type == 'su') {} else {
            $scope.sort.gen = "";
            $scope.sort.type = type;
        }
        localStorageService.set('sort', $scope.sort)
    }

});

app.controller('UserCtrl', function($scope, $filter, Cards) {
    $scope.sit = {};
    $scope.sit.user = "dreamsicl";
    var accUrlBase = "https://schoolido.lu/api/accounts/?owner__username=";
    $scope.updateUser = function() {
        $scope.sit.accountsUrl = accUrlBase + $scope.sit.user;
    }
    $scope.updateUser();

    var oCardUrlBase = "https://schoolido.lu/api/ownedcards/?expand_card&card__rarity=SR,SSR,UR&stored=deck&owner_account=";
    var getAccountsSuccess = function(data, status) {
        var accounts = data.results;
        var len = accounts.length
        $scope.sit.accountIDs = [];
        $scope.sit.accountNames = [];
        for (var i = 0; i < len; i++) {
            $scope.sit.accountIDs.push(accounts[i].id);
            $scope.sit.accountNames.push(accounts[i].nickname + " " + accounts[i].language);
        }
        $scope.sit.chosenAccountName = $scope.sit.accountNames[0];
        $scope.sit.chosenAccountID = $scope.sit.accountIDs[0];
        $scope.sit.ownedCardsUrl = oCardUrlBase + $scope.sit.chosenAccountID;
    }
    var getAccounts = function() {
        Cards.getUrl($scope.sit.accountsUrl).success(getAccountsSuccess);
    };
    getAccounts();

    $scope.chooseAccount = function() {
        var i = 0;
        var len = $scope.sit.accountNames.length;
        while (i < len) {
            if ($scope.sit.accountNames[i] == $scope.sit.chosenAccountName) {
                $scope.sit.chosenAccountID = $scope.sit.accountIDs[i]
                break;
            } else i++;
        }
        $scope.sit.ownedCardsUrl = oCardUrlBase + $scope.sit.chosenAccountID;
    }

    $scope.cards = [];
    var getCardsSuccess = function(data, status) {
        var userCards = data.results;
        var len = userCards.length;
        for (var i = 0; i < len; i++) {
            $scope.cards.push(userCards[i].card);
        }
        $scope.cards = Card.cleanCards($scope.cards);

    }
    $scope.getCards = function() {
        Cards.getUrl($scope.sit.ownedCardsUrl).success(getCardsSuccess);
    };

    var stat_to_mod = function(card) {
        if ($scope.filters.idlz && (card.attribute == "Pure"))
            stat = card.idolized_maximum_statistics_pure;
        else if (!$scope.filters.idlz && (card.attribute == "Pure"))
            stat = card.non_idolized_maximum_statistics_pure;
        else if ($scope.filters.idlz && (card.attribute == "Smile"))
            stat = card.idolized_maximum_statistics_smile;
        else if (!$scope.filters.idlz && (card.attribute == "Smile"))
            stat = card.non_idolized_maximum_statistics_smile;
        else if ($scope.filters.idlz && (card.attribute == "Cool"))
            stat = card.idolized_maximum_statistics_cool;
        else if (!$scope.filters.idlz && (card.attribute == "Cool"))
            stat = card.non_idolized_maximum_statistics_cool;

        // bond bonus
        if ($scope.filters.idlz && card.rarity == "UR")
            stat += 1000;
        else if ((!$scope.filters.idlz && card.rarity == "UR") || ($scope.filters.idlz && card.rarity == "SR"))
            stat += 500;
        else if (!$scope.filters.idlz && card.rarity == "SR")
            stat += 250;
        return stat;
    };
    $scope.cScore = function(card) {
        var statToMod = stat_to_mod(card);
        card.cScore = statToMod + (statToMod * (.09 + .03)) * 2;;
        return card.cScore;

    }
    $scope.oScore = function(card) {
            var statToMod = stat_to_mod(card);
            card.oScore = statToMod + (statToMod * (.09 + .06)) * 2;;
            return card.oScore;

        }
        // ****** calculate skill contribution
    $scope.skillContr = function(card) {
        card.skill_contr = 0;
        var notesActivation = (550 / card.skill_activation_num) * card.skill_activation_percent;
        if (card.skill == "Score Up") {
            // activation types: notes, time, combo string, perfects
            if (card.skill_activation_type == "perfects") {
                card.skill_contr = notesActivation * .85 * card.skill_activation;
            } else if (card.skill_activation_type == "time") {
                card.skill_contr = (125 / card.skill_activation_num) * card.skill_activation_percent * card.skill_activation;
            } else { // notes or combo string
                card.skill_contr = notesActivation * card.skill_activation;
            }
        } else if (card.skill == "Perfect Lock" || card.skill == "Healer") {
            card.skill_contr = notesActivation * card.skill_activation;
        }
        return card.skill_contr
    }

});
