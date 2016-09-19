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
            $scope.userCards = [];
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
            console.log("no accounts found")
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

    var getCardsSuccess = function(response) {
        var nextUrl = response.data.next;
        $scope.rawUserCards = response.data.results;
        localStorageService.set('rawUserCards', $scope.rawUserCards);


        // grab owned card ids
        var cardIDs = [];
        var len = $scope.rawUserCards.length
        for (var i = 0; i < len; i++) {
            cardIDs.push($scope.rawUserCards[i].card)
        }

        // populate rawUserCardsData with cards owned from root cards
        angular.forEach(cardIDs, function(ownedID) {
            angular.forEach($rootScope.Cards, function(card) {
                if (ownedID === card.id) {
                    $scope.rawUserCardsData.push(card)
                }
            });
        });

        // grab rawUserCard idolized status
        angular.forEach($scope.rawUserCards, function(rawCard) {
            angular.forEach($scope.rawUserCardsData, function(rawCardData) {
                if (rawCardData.id == rawCard.card) {
                    rawCardData.user_idlz = rawCard.idolized;
                    if (rawCardData.user_idlz) {
                        // set smile, pure, cool stats to idolized stats
                        rawCardData.max_smile = rawCardData.idolized_maximum_statistics_smile;
                        rawCardData.max_pure = rawCardData.idolized_maximum_statistics_pure;
                        rawCardData.max_cool = rawCardData.idolized_maximum_statistics_cool;

                        // set c/o score to idlz score
                        rawCardData.cScore = rawCardData.cScore_idlz;
                        rawCardData.cScore_heel = rawCardData.cScore_heel_idlz;
                        rawCardData.oScore = rawCardData.oScore_idlz;
                        rawCardData.oScore_heel = rawCardData.oScore_heel_idlz;

                    } else {
                        // set smile, pure, cool stats to idolized stats
                        rawCardData.max_smile = rawCardData.non_idolized_maximum_statistics_smile;
                        rawCardData.max_pure = rawCardData.non_idolized_maximum_statistics_pure;
                        rawCardData.max_cool = rawCardData.non_idolized_maximum_statistics_cool;

                        // set c/o score to idlz score
                        rawCardData.cScore = rawCardData.cScore;
                        rawCardData.cScore_heel = rawCardData.cScore_heel;
                        rawCardData.oScore = rawCardData.oScore;
                        rawCardData.oScore_heel = rawCardData.oScore_heel;
                    }
                }
            });
        });

        if (nextUrl) Cards.getUrl(nextUrl).then(getCardsSuccess);
        localStorageService.set('rawUserCardsData', $scope.rawUserCardsData);

        // filter for display
        $scope.userCards = Cards.filterCards($scope.userFilters, $scope.rawUserCardsData);
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
