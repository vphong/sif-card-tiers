app.controller('UserCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {
    // $rootScope = $rootScope.$new(true)
    // $scope = $scope.$new(true)
    // localStorageService.clearAll()

    var init = function() {
        $scope.userFilters = localStorageService.get('userFilters');
        if (!$scope.userFilters) {
            $scope.userFilters = angular.copy($rootScope.InitFilters);
            $scope.userFilters.displayImg = true;
        }

        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore_modded',
                desc: true,
            }
            localStorageService.set('sort', $scope.sort);
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
    $scope.toggleHeel = function() {
        Cards.calcSkill($scope.userCards, $scope.userSong, $scope.userFilters.heel);

        if ($scope.userFilters.heel) $scope.sortBy("cScore_modded_heel");
        else $scope.sortBy($scope.sort.type)
    }
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
