var app = angular.module('tierList', ['ui.bootstrap',
    'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor',
    'ui.router', 'smart-table', 'LocalStorageModule'
]);

app.factory('allHttpInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory();
});

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/all");

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
app.directive('stPersist', function(localStorageService) {
    return {
        require: '^stTable',
        link: function(scope, element, attr, ctrl) {
            var nameSpace = attr.stPersist;

            //save the table state every time it changes
            scope.$watch(function() {
                return ctrl.tableState();
            }, function(newValue, oldValue) {
                if (newValue !== oldValue) {
                    localStorageService.set(nameSpace, JSON.stringify(newValue));
                }
            }, true);

            //fetch the table state when the directive is loaded
            if (localStorage.getItem(nameSpace)) {
                var savedState = JSON.parse(localStorageService.get(nameSpace));
                var tableState = ctrl.tableState();

                angular.extend(tableState, savedState);
                ctrl.pipe();

            }

        }
    };
});;
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

app.directive('stCheck', function() {
    return {
        restrict: 'E',
        scope: {
            predicate: '@'
        },
        require: '^stTable',
        template: '<input type="checkbox" ng-model="sel" ng-change="change()"/>',
        link: function(scope, element, attr, ctrl) {
            scope.change = function change() {
                ctrl.search(scope.sel, scope.predicate);
            }
        }
    }
})
app.factory('Cards', function($http) {
    ret = {};
    ret.cleanCards = function(cards) {
        var len = cards.length;
        var statToMod;
        var name;
        var i = 0;
        while (i < len) {
            id = cards[i].id;
            if (cards[i].is_special || id == 385) {


                cards.splice(i, 1);
                len = cards.length;



            } else {
                cards[i].full_name = cards[i].rarity;
                if (cards[i].translated_collection) cards[i].full_name += " " + cards[i].translated_collection;
                else if (cards[i].is_promo) cards[i].full_name += " Promo"
                cards[i].full_name += " " + cards[i].idol.name;

                cards[i].premium = (!cards[i].event) && (!cards[i].is_promo);
                var skill_details_array = cards[i].skill_details.replace(/[,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(" ");

                var slen = skill_details_array.length;
                var curr;
                var numCount = 0;
                for (var j = 0; j < slen; j++) {
                    curr = skill_details_array[j];
                    if (!isNaN(curr) && numCount == 0) {
                        cards[i].skill_activation_num = curr;
                        cards[i].skill_activation_type = skill_details_array[j + 1];
                        numCount++;
                    } else if (!isNaN(curr) && numCount == 1) {
                        cards[i].skill_activation_percent = curr / 100;
                        numCount++;
                    } else if (!isNaN(curr) && numCount == 2) {
                        cards[i].skill_activation = curr;
                        numCount++;
                        break;
                    }
                }
            }
            ++i;
        }

        return cards;
    }

    return ret;
});


app.controller('TierCtrl', function($scope, $filter, Cards, CardData) {
    $scope.filters = {
        server: 'jp',
        attribute: 'all',
        sc: true,
        pl: true,
        hl: true,
        muse: true,
        aqours: true
    };

$scope.pag = {
  size: 30,
  display: 5,
}
    $scope.updateFilter = function() {
        // console.log("local table = " + localStorageService.get("cardTable"))

        var filters = $scope.filters;
        var cards = [];
        var card;
        var baseCards = Cards.cleanCards(CardData);
        var len = baseCards.length;

        for (var i = 0; i < len; i++) {
            card = baseCards[i];
            if (((filters.server == "en" && !card.japan_only) ||
                    (filters.server == "jp")) &&

                ((filters.attribute == "all" && card.attribute) ||
                    (filters.attribute == "smile" && card.attribute == "Smile") ||
                    (filters.attribute == "pure" && card.attribute == "Pure") ||
                    (filters.attribute == "cool" && card.attribute == "Cool")) &&

                ((filters.ur && card.rarity == "UR") ||
                    (filters.ssr && card.rarity == "SSR") ||
                    (filters.sr && card.rarity == "SR")) &&

                ((filters.premium && card.premium) ||
                    (filters.promo && card.is_promo) ||
                    (filters.event && card.event)) &&

                ((filters.sc && card.skill == "Score Up") ||
                    (filters.pl && card.skill == "Perfect Lock") ||
                    (filters.hl && card.skill == "Healer")) &&

                ((filters.muse && card.idol.main_unit == "μ's") ||
                    (filters.aqours && card.idol.main_unit == "Aqours"))) {
                cards.push(card);
            }


        }
        tablestate.pagination.numberOfPages = cards.length / $scope.pag.size;
        $scope.cards = Cards.cleanCards(cards);


    }
    $scope.cards = Cards.cleanCards(CardData);



    $scope.sort = {
        ascending: true,
        type: 'cScore',
        typeAttr: ''
    };
    $scope.sortBy = function(type) {

        $scope.sort.ascending = ($scope.sort.type == type) || ($scope.sort.typeAttr == type) ? !$scope.sort.ascending : true;
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
    $scope.skillContr = function(card, skillType, charm) {
        card.skill_contr = 0;
        var baseNotesActivation = (550 / card.skill_activation_num) * card.skill_activation_percent * card.skill_activation;

        var charm_multiplier = 1;
        if (charm) {
            charm_multiplier = 2.5;
        }


        if (card.skill == "Score Up") {
            // activation types: notes, time, combo string, perfects
            if (card.skill_activation_type == "perfects") {
                card.score_contr = baseNotesActivation * .85 * charm_multiplier;
            } else if (card.skill_activation_type == "time") {
                card.score_contr = (125 / card.skill_activation_num) * card.skill_activation_percent * card.skill_activation * charm_multiplier;
            } else { // notes or combo string
                card.score_contr = baseNotesActivation * charm_multiplier;
            }
            card.heal_contr = 0;
            card.pl_contr = 0;
        } else if (card.skill == "Perfect Lock") {
            card.pl_contr = baseNotesActivation;
            card.score_contr = 0;
            card.heal_contr = 0;
        } else if (card.skill == "Healer") {
            card.score_contr = baseNotesActivation * 270;
            card.heal_contr = baseNotesActivation * 1;
            card.pl_contr = 0;
        }
        if (skillType == "sc") return card.score_contr;
        else if (skillType == "pl") return card.pl_contr;
        else return card.heal_contr;

        // TODO: account for R/promo skills
    }

    var stat = 0;



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
