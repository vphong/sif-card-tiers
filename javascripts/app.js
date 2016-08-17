var app = angular.module('tierList', ['ui.bootstrap', 'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor', 'ui.router']);

app.factory('allHttpInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory();
});

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/user");

    $stateProvider
        .state("default", {
            abstract: true,
            url: "/",
            templateUrl: "all_cards.html"
        })
        .state("all", {
            url: "/all",
            templateUrl: "all_cards.html"
        })
        .state("user", {
            url: "/user",
            templateUrl: "user_cards.html"
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

app.factory('Cards', function($http) {

    var ret = {};

    ret.getUrl = function(url) {
        return $http.get(url);
    }

    ret.cleanCards = function(cards) {
        var len = cards.length;
        var statToMod;
        for (var i = 0; i < len; i++) {
            cards[i].premium = (!cards[i].event) && (!cards[i].is_promo);
            var skill_details_array = cards[i].skill_details.replace(/[,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(" ");
            var endStr = skill_details_array.length - 1;
            cards[i].skill_activation_num = skill_details_array[2];
            cards[i].skill_activation_type = skill_details_array[3];
            if (cards[i].skill_activation_type != "hit")
                cards[i].skill_activation_percent = skill_details_array[7] / 100;
            else cards[i].skill_activation_percent = skill_details_array[9] / 100;

            if (cards[i].skill == "Score Up")
                cards[i].skill_activation = skill_details_array[endStr - 3];
            else if (cards[i].skill == "Perfect Lock")
                cards[i].skill_activation = skill_details_array[endStr - 5];
            else if (cards[i].skill == "Healer")
                cards[i].skill_activation = skill_details_array[endStr - 2];

        }
        return cards;
    }

    return ret;
});

app.filter('pagination', function() {
    return function(input, start) {
        start = +start;
        return input.slice(start);
    };
});

app.controller('TierCtrl', function($scope, $filter, Cards) {
    $scope.filters = {
        attribute: 'all',
        server: 'jp',
        skill: 'scorer'
    }

    $scope.cards = {};

    var count = 0;
    $scope.next = "";
    $scope.prev = "";
    $scope.page = 0;
    $scope.pageSize = 10;

    var getCardsSuccess = function(data, status) {
        count = data.count;
        $scope.next = data.next;
        $scope.prev = data.previous;
        $scope.cards = data.results;
        $scope.cards = Cards.cleanCards($scope.cards);

    }
    $scope.numberOfPages = Math.ceil($scope.cards.length / $scope.pageSize);


    $scope.url = "https://crossorigin.me/https://schoolido.lu/api/cards/?&page_size=10&ordering=-id&rarity=SR,SSR,UR&japan-only=False&skill=score up&idol_main_unit=μ's";
    var base = "https://crossorigin.me/http://schoolido.lu/api/cards/?&page_size=25&ordering=-id/";

    var getCards = function() {
        Cards.getUrl($scope.url).success(getCardsSuccess);
    };
    $scope.updateURL = function() {
        $scope.url = base;
        var filters = $scope.filters;

        if (filters.server == "en") $scope.url += "&japan-only=False";
        else $scope.url += "&japan-only=True";

        if (filters.attribute == "smile") $scope.url += "&attribute=Smile";
        else if (filters.attribute == "pure") $scope.url += "&attribute=Pure";
        else if (filters.attribute == "cool") $scope.url += "&attribute=Cool";

        // FIXME

        if (filters.ur && filters.ssr && filters.sr) $scope.url += "&rarity=UR,SSR,SR";
        else if (filers.ur && filters.ssr && !filters.sr) $scope.url += "&rarity=UR,SSR";
        else if (filters.ur && !filters.ssr && filters.sr) $scope.url += "&rarity=UR,SR";
        else if (filters.ur && !filters.ssr && !filters.sr) $scope.url += "&rarity=URR";
        else if (!filters.ur && filters.ssr && filters.sr) $scope.url += "%rarity=SR,SSR";
        else if (!filters.ur && filters.ssr && !filters.sr) $scope.url += "%rarity=SSR";
        else if (!filters.ur && !filters.ssr && filters.sr) $scope.url += "%rarity=SR";

        /*if (filters.premium && !filters.promo && !filters.event)
            $scope.url += "&is_promo=false&is_event=false";
        else if (filters.premium && filters.promo && !filters.event)
            $scope.url += "&is_event=false";
        else if (filters.premium && !filters.promo && filters.event)
            $scope.url += "&is_event=false";*/

        if (filters.skill == "scorer") $scope.url += "&skill=score%20up";
        else if (filters.skill == "pl") $scope.url += "&skill=perfect lock";
        else if (filters.skill == "healer") $scope.url += "&skill=healer";

        if (filters.muse && !filters.aqours) $scope.url += "&idol_main_unit=μ's";
        else if (!filters.muse && filters.aqours) $scope.url += "&idol_main_unit=Aqours";
        else if (filters.muse && filters.aqours) $scope.url += "&idol_main_unit=μ's,Aqours"
        getCards();
    }

    getCards();

    $scope.sort = {
        reverse: false,
        type: 'cScore',
        typeAttr: ''
    };
    $scope.sortBy = function(type) {
        $scope.sort.reverse = ($scope.sort.type == type) || ($scope.sort.typeAttr == type) ? !$scope.sort.reverse : true;
        $scope.sort.typeAttr = type;

        if (type == 'smile' && $scope.filters.idlz)
            $scope.sort.type = "idolized_maximum_statistics_smile";
        else if (type == 'smile' && !$scope.filters.idlz)
            $scope.sort.type = "non_idolized_maximum_statistics_smile";
        else if (type == 'pure' && $scope.filters.idlz)
            $scope.sort.type = "idolized_maximum_statistics_pure";
        else if (type == 'pure' && !$scope.filters.idlz)
            $scope.sort.type = "non_idolized_maximum_statistics_pure";
        else if (type == 'cool' && $scope.filters.idlz)
            $scope.sort.type = "idolized_maximum_statistics_cool";
        else if (type == 'cool' && !$scope.filters.idlz)
            $scope.sort.type = "non_idolized_maximum_statistics_cool";
        else $scope.sort.type = type;

    };



    // TODO: filter by server
    // TODO: filter by attribute
    // TODO: filter by rarity
    // TODO: filter by origin
    $scope.byOrigin = function(card) {
        /*var ret = ($scope.filters.premium == card.premium) ||
        ($scope.filters.promo == card.is_promo) ||
        ($scope.filters.event == card.event);
        console.log(ret);*/
        var filterPremium = ($scope.filters.premium == card.premium);
        var filterPromo = ($scope.filters.promo == card.is_promo);
        var filterEvent = ($scope.filters.evnt == (card.event == null));
        var showIf = filterPremium && filterPromo && filterEvent;
        return filterPremium;
    };
    // TODO: filter by group
    // TODO: filter by skill


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

    var stat = 0;
    // TODO: pagination

});

app.controller('UserCtrl', function($scope, $filter, Cards) {
    $scope.sit = {};
    $scope.sit.user = "dreamsicl"
    $scope.updateUser = function() {
        $scope.sit.accountsUrl = "http://schoolido.lu/api/accounts/?owner__username=" + $scope.sit.user;
    }
    $scope.updateUser();

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
        $scope.sit.ownedCardsUrl = "http://schoolido.lu/api/ownedcards/?expand_card&card__rarity=SR,SSR,UR&stored=deck&owner_account=" + $scope.sit.chosenAccountID;
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
        $scope.sit.ownedCardsUrl = "http://schoolido.lu/api/ownedcards/?expand_card&card__rarity=SR,SSR,UR&stored=deck&owner_account=" + $scope.sit.chosenAccountID;
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
