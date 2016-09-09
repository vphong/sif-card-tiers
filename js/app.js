var app = angular.module('tierList', ['ui.bootstrap', 'ui.router.tabs',
    'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor', 'fsm',
    'ui.router', 'LocalStorageModule'
]);

// bs loading overlay
app.factory('viewInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory({
      referenceId: 'view'
    });
});

app.factory('sitInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
	return bsLoadingOverlayHttpInterceptorFactoryFactory({
		referenceId: 'sit',
		requestsMatcher: function (requestConfig) {
			return requestConfig.url.indexOf('schoolido') !== -1;
		}
	});
});

app.config(function($httpProvider) {
	$httpProvider.interceptors.push('viewInterceptor');
	$httpProvider.interceptors.push('sitInterceptor');
})

app.run(function(bsLoadingOverlayService) {
	bsLoadingOverlayService.setGlobalConfig({
		templateUrl: 'loading-overlay-template.html'
	});
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
        .state("all", {
            url: "/",
            controller: 'TierCtrl',
            templateUrl: "all_cards.html",
        })

    .state("user", {
            url: "/user",
            controller: 'UserCtrl',
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

                (filters.compare == "all" && card.skill.type ||
                    filters.compare == "sc" && (card.skill.type == "Score Up" || card.skill.type == "Healer") ||
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

app.controller('TierCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    var init = function() {
        $scope.filters = localStorageService.get('filters');
        if (!$scope.filters) $scope.filters = $rootScope.InitFilters;

        $scope.cards = localStorageService.get('cards');
        if (!$scope.cards) $scope.cards = $rootScope.Cards;
        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore',
                desc: true,
                gen: ""
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
        localStorageService.set('filters', $scope.filters);
        localStorageService.set('cards', $scope.cards);

        $scope.err.rarity = !$scope.filters.sr && !$scope.filters.ssr && !$scope.filters.ur;
        $scope.err.origin = !$scope.filters.premium && !$scope.filters.event && !$scope.filters.promo;
        $scope.err.main = !$scope.filters.muse && !$scope.filters.aqours;
    }

    $scope.$watch('filters.compare', function(n, o) {
        if (n != o) {
            $scope.sort.type = 'cScore';
            $scope.sort.gen = "";
            localStorageService.set('sort', $scope.sort)
        }
    })

    $scope.collapsing = function() {
        $scope.collapse = !$scope.collapse;
        localStorageService.set('collapse', $scope.collapse)
    };

    $scope.resetFilters = function() {
        $scope.filters = $rootScope.InitFilters;
        localStorageService.set('filters', $scope.filters);
        $scope.filterCards()
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

app.controller('UserCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    var init = function() {
        $scope.filters = localStorageService.get('filters');
        if (!$scope.filters) $scope.filters = $rootScope.InitFilters;

        $scope.userCards = localStorageService.get('userCards');
        if (!$scope.userCards) $scope.userCards = [];
        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore',
                desc: true,
                gen: ""
            }
        }

        $scope.collapse = localStorageService.get('collapse');
        $scope.sit = localStorageService.get('sit');
        if (!$scope.sit) $scope.sit = {};

    }
    init();

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

    }
    $scope.$watch('filters.compare', function(n, o) {
        if (n != o) {
            $scope.sort.type = 'cScore';
            $scope.sort.gen = "";
            localStorageService.set('sort', $scope.sort)
        }
    })

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
