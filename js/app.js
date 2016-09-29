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
        console.log(filters.subunit)

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

                (filters.su && card.skill.type == "Score Up" ||
                    filters.pl && card.skill.type == "Perfect Lock" ||
                    filters.hl && card.skill.type == "Healer") &&

                (filters.muse && card.main_unit == "Muse" ||
                    filters.aqours && card.main_unit == "Aqours") &&

                (filters.subunit == "all" && card.sub_unit ||
                    filters.subunit == "BiBi" && card.sub_unit == "Bibi" ||
                    filters.subunit == "Printemps" && card.sub_unit == "Printemps" ||
                    filters.subunit == "lily white" && card.sub_unit == "Lily White" ||
                    filters.subunit == "AZALEA" && card.sub_unit == "AZALEA" ||
                    filters.subunit == "CYaRon" && card.sub_unit == "CYaRon!" ||
                    filters.subunit == "Guilty Kiss" && card.sub_unit == "Guilty Kiss") &&

                (filters.year == "all" && card.year ||
                    filters.year == "1" && card.year == "first" ||
                    filters.year == "2" && card.year == "second" ||
                    filters.year == "3" && card.year == "third")
            ) {
                newCards.push(card);
            }

        })
        return newCards;
    }

    ret.calcSkill = function(cards, song, heel) {
        var score_up_mod = 0;
        var activations = 0;

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

            if (heel && card.skill.type == "Healer" && !card.is_promo) {
                card.skill.avg *= 270;
                card.skill.best *= 270;
            }


            // convert score up to stat
            if (card.is_promo) score_up_mod = 0
            else if (card.skill.type == 'Score Up' || (heel && card.skill.type == "Healer")) {
                score_up_mod = Math.floor((card.skill.avg / song.notes) / (0.0125 * (.88 * song.perfects) * Math.floor(song.notes / 2) * 1 * 1.1 * 1.1)) * song.notes;
                if (isNaN(score_up_mod)) score_up_mod = 0;
            } else score_up_mod = 0

            if (card.skill.type == "Score Up") {
                card.cScore_modded = card.cScore + score_up_mod
                card.cScore_modded_idlz = card.cScore_idlz + score_up_mod

                card.oScore_modded = card.oScore + score_up_mod
                card.oScore_modded_idlz = card.oScore_idlz + score_up_mod
            } else if (heel && card.skill.type == "Healer") {
                card.cScore_modded_heel = card.cScore_heel + score_up_mod
                card.cScore_modded_idlz_heel = card.cScore_idlz_heel + score_up_mod

                card.oScore_modded_heel = card.oScore_heel + score_up_mod
                card.oScore_modded_idlz_heel = card.oScore_idlz_heel + score_up_mod
            }

            if (card.full_name.includes("Swimsuit Tsushima")) console.log(card)

        })


    }

    ret.displayScore = function(card, scoreType, filters) {
        if (scoreType == "c") {
            if (card.is_promo && filters.idlz) return card.cScore_modded_idlz;
            else if (card.is_promo && filters.idlz) return card.cScore_modded;

            if (filters.idlz && filters.heel) return card.cScore_modded_idlz_heel;
            else if (filters.idlz && filters.heel) return card.cScore_modded_idlz;
            else if (filters.idlz && filters.heel) return card.cScore_modded_heel;
            else return card.cScore_modded

        } else if (scoreType == "o") {
            if (card.is_promo && filters.idlz) return card.oScore_modded_idlz;
            else if (card.is_promo && filters.idlz) return card.oScore_modded;

            if (filters.idlz && filters.heel) return card.oScore_modded_idlz_heel
            else if (filters.idlz && filters.heel) return card.oScore_modded_idlz
            else if (filters.idlz && filters.heel) return card.oScore_modded_heel
            else return card.oScore_modded
        } else return 0;
    }


    ret.sortBy = function(sort, idlz, type) {
        console.log(sort)
        console.log(type)
        sort.desc = (sort.type == type || sort.gen == type) ? !sort.desc : true;

        sort.type = type;

        if (type == 'smile' && idlz) {
            sort.type = "idolized_maximum_statistics_smile";
        } else if (type == 'smile' && !idlz) {
            sort.type = "non_idolized_maximum_statistics_smile";
        } else if (type == 'pure' && idlz) {
            sort.type = "idolized_maximum_statistics_pure"
        } else if (type == 'pure' && !idlz) {
            sort.type = "non_idolized_maximum_statistics_pure"
        } else if (type == 'cool' && idlz) {
            sort.type = "idolized_maximum_statistics_cool"
        } else if (type == 'cool' && !idlz) {
            sort.type = "non_idolized_maximum_statistics_cool"
        } else {

            sort.type = type;

            if (type == 'cScore_modded') {
                if (idlz) sort.type = "cScore_modded_idlz";
                else sort.type = "cScore_modded";
            } else if (type == 'oScore_modded') {
                if (idlz) sort.type = "oScore_modded_idlz";
                else sort.type = "oScore_modded";

            } else if (type == 'cScore_modded_heel') {
                if (idlz) sort.type = "cScore_modded_idlz_heel";
                else sort.type = "cScore_modded_heel";
            } else if (type == 'oScore_modded_modded_heel') {
                if (idlz) sort.type = "oScore_modded_idlz_heel";
                else sort.type = "oScore_modded_heel";

            }
        }
        console.log(sort)
    }


    return ret;
})

app.controller('TierCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    // $rootScope = $rootScope.$new(true)
    // $scope = $scope.$new(true)
    $scope.init = function() {

        $scope.filters = localStorageService.get('filters');
        if (!$scope.filters) $scope.filters = angular.copy($rootScope.InitFilters);

        /*$scope.cards = localStorageService.get('cards');
        if (!$scope.cards)*/

        $scope.song = localStorageService.get('song');
        if (!$scope.song) $scope.song = angular.copy($rootScope.Song);

        $scope.cards = angular.copy(Cards.filterCards($scope.filters, $rootScope.Cards));

        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore_modded',
                desc: true
            }
        }
        $scope.search = localStorageService.get('search');
        if (!$scope.search) $scope.search = "";

        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);


    }
    $scope.init();


    $scope.updateSearch = function() {
        localStorageService.set('search', $scope.search);
    }

    $scope.updateSong = function() {
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);
        localStorageService.set('song', $scope.song);
    }

    $scope.sortBy = function(type) {
        if ($scope.filters.heel && type.includes("Score")) {
            type = type + "_heel";
        }
        Cards.sortBy($scope.sort, $scope.filters.idlz, type)
        localStorageService.set('sort', $scope.sort)
    }

    $scope.toggleHeel = function() {
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);

        if ($scope.filters.heel) $scope.sortBy("cScore_modded_heel");
        else $scope.sortBy("cScore_modded")
    }

    $scope.displayScore = function(card, scoreType) {
        return Cards.displayScore(card, scoreType, $scope.filters)
    }

    $scope.filterCards = function() {
        $scope.cards = Cards.filterCards($scope.filters, angular.copy($rootScope.Cards));
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);
        localStorageService.set('filters', $scope.filters);
    }


    $scope.resetFilters = function() {
        $scope.filters = angular.copy($rootScope.InitFilters);
        localStorageService.set('filters', $scope.filters);

        $scope.sort = {
            type: 'cScore_modded',
            desc: false
        }
        $scope.filterCards()
        $scope.sortBy('cScore_modded');
    }

    $scope.setLocalStorageFilters = function() {
        localStorageService.set('filters', $scope.filters);
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
            }
            localStorageService.set('sort', $scope.filters);
        }

        $scope.sit = localStorageService.get('sit');
        if (!$scope.sit) {
            $scope.sit = {};
        } else {
            // $scope.userCards = [];
        }


        $scope.userSong = localStorageService.get('userSong');
        if (!$scope.userSong) $scope.userSong = angular.copy($rootScope.Song);


        $scope.userSearch = localStorageService.get('userSearch');
        if (!$scope.userSearch) $scope.userSearch = "";

        // storage for http result of account grabbing
        $scope.rawUserCards = localStorageService.get('rawUserCards');
        // storage for card data of rawUserCards
        $scope.rawUserCardsData = localStorageService.get('rawUserCardsData');

        if ($scope.rawUserCardsData) $scope.userCards = angular.copy(Cards.filterCards($scope.userFilters, $scope.rawUserCardsData))
        else $scope.userCards = [];

        Cards.calcSkill($scope.userCards, $scope.userSong, $scope.userFilters.heel);

    }
    init();

    $scope.updateSearch = function() {
        localStorageService.set('userSearch', $scope.userSearch);
    }

    $scope.updateSong = function() {
        localStorageService.set('userSong', $scope.userSong);
    }

    // get accounts from sit username
    var accUrlBase = "https://schoolido.lu/api/accounts/?owner__username=";
    $scope.updateUser = function() {
        $scope.sit.accountsUrl = accUrlBase + $scope.sit.user;
        localStorageService.set('sit', $scope.sit);
        $scope.sit.accErr = false;
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


    $scope.filterCards = function() {
        $scope.userCards = Cards.filterCards($scope.userFilters, angular.copy($scope.rawUserCardsData));
        Cards.calcSkill($scope.userCards, $scope.userSong, $scope.userFilters.heel);

        localStorageService.set('userFilters', $scope.userFilters);
    }

    $scope.$watch('userFilters.compare', function(n, o) {
        if (n != o) {
            $scope.sort.type = 'cScore';
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
        if ($scope.userFilters.heel && type.includes("Score")) {
            type = type + "_heel";
        }
        Cards.sortBy($scope.sort, false, type)
        localStorageService.set('sort', $scope.sort)
    }
    $scope.displayScore = function(card, scoreType) {
        return Cards.displayScore(card, scoreType, $scope.userFilters)
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
