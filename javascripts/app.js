var app = angular.module('tierList', ['ui.bootstrap',
    'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor',
    'ui.router', 'ui.grid', 'ui.grid.pagination', 'LocalStorageModule'
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


app.controller('TierCtrl', function($scope, $filter, CardData) {
    $scope.filters = {
        server: 'jp',
        attribute: 'all',
        sc: true,
        pl: true,
        hl: true,
        muse: true,
        aqours: true,
        idlz: false
    };

    $scope.cards = CardData;



    var getIdlz = function() {
      return $scope.filters.idlz
    }

    $scope.uiGrid = {
        enableSorting: true,
        enableFiltering: true,
        enablePaginationControls: false,
        paginationPageSize: 25,
        columnDefs: [
          {displayName: 'ID', field: 'id'},
          {field: 'full_name', minWidth: 200, displayName: 'Card Name',},
          {field: 'translated_collection', visible: false},
          {field: 'attribute'},
          {displayName: 'Skill', field: 'skill.type'},
          {field: 'cScore', visible: !getIdlz()},
          {field: 'cScore_idlz', visible: getIdlz()},
          {field: 'oScore', visible: !getIdlz()},
          {field: 'oScore_idlz', visible: getIdlz()},
          {displayName: 'Smile', field: 'non_idolized_maximum_statistics_smile', visible: !getIdlz()},
          {displayName: 'Pure', field: 'non_idolized_maximum_statistics_pure', visible: !getIdlz()},
          {displayName: 'Cool', field: 'non_idolized_maximum_statistics_cool', visible: !getIdlz()},
          {displayName: 'Smile', field: 'idolized_maximum_statistics_smile', visible: getIdlz()},
          {displayName: 'Pure', field: 'idolized_maximum_statistics_pure', visible: getIdlz()},
          {displayName: 'Cool', field: 'idolized_maximum_statistics_cool', visible: getIdlz()},

          {field: 'oScore'},
        ],
        data: $scope.cards
    }

  $scope.uiGrid.onRegisterApi = function (gridApi) {
    $scope.gridApi2 = gridApi;
  }


    // $scope.sort = {
    //     ascending: true,
    //     type: 'cScore',
    //     typeAttr: ''
    // };
    // $scope.sortBy = function(type) {
    //
    //     $scope.sort.ascending = ($scope.sort.type == type) || ($scope.sort.typeAttr == type) ? !$scope.sort.ascending : true;
    //     $scope.sort.typeAttr = type;
    //
    //     if (type == 'smile' && $scope.filters.idlz)
    //         $scope.sort.type = "idolized_maximum_statistics_smile";
    //     else if (type == 'smile' && !$scope.filters.idlz)
    //         $scope.sort.type = "non_idolized_maximum_statistics_smile";
    //     else if (type == 'pure' && $scope.filters.idlz)
    //         $scope.sort.type = "idolized_maximum_statistics_pure";
    //     else if (type == 'pure' && !$scope.filters.idlz)
    //         $scope.sort.type = "non_idolized_maximum_statistics_pure";
    //     else if (type == 'cool' && $scope.filters.idlz)
    //         $scope.sort.type = "idolized_maximum_statistics_cool";
    //     else if (type == 'cool' && !$scope.filters.idlz)
    //         $scope.sort.type = "non_idolized_maximum_statistics_cool";
    //     else $scope.sort.type = type;
    //
    // };




    // var stat_to_mod = function(card) {
    //     if ($scope.filters.idlz && (card.attribute == "Pure"))
    //         stat = card.idolized_maximum_statistics_pure;
    //     else if (!$scope.filters.idlz && (card.attribute == "Pure"))
    //         stat = card.non_idolized_maximum_statistics_pure;
    //     else if ($scope.filters.idlz && (card.attribute == "Smile"))
    //         stat = card.idolized_maximum_statistics_smile;
    //     else if (!$scope.filters.idlz && (card.attribute == "Smile"))
    //         stat = card.non_idolized_maximum_statistics_smile;
    //     else if ($scope.filters.idlz && (card.attribute == "Cool"))
    //         stat = card.idolized_maximum_statistics_cool;
    //     else if (!$scope.filters.idlz && (card.attribute == "Cool"))
    //         stat = card.non_idolized_maximum_statistics_cool;
    //
    //     // bond bonus
    //     if ($scope.filters.idlz && card.rarity == "UR")
    //         stat += 1000;
    //     else if ((!$scope.filters.idlz && card.rarity == "UR") || ($scope.filters.idlz && card.rarity == "SR"))
    //         stat += 500;
    //     else if (!$scope.filters.idlz && card.rarity == "SR")
    //         stat += 250;
    //     return stat;
    // };
    // $scope.cScore = function(card) {
    //     var statToMod = stat_to_mod(card);
    //     card.cScore = statToMod + (statToMod * (.09 + .03)) * 2;;
    //     return card.cScore;
    //
    // }
    // $scope.oScore = function(card) {
    //         var statToMod = stat_to_mod(card);
    //         card.oScore = statToMod + (statToMod * (.09 + .06)) * 2;;
    //         return card.oScore;
    //
    //     }
    //     // ****** calculate skill contribution
    // $scope.skillContr = function(card, skillType, charm) {
    //     card.skill_contr = 0;
    //     var baseNotesActivation = (550 / card.skill_activation_num) * card.skill_activation_percent * card.skill_activation;
    //
    //     var charm_multiplier = 1;
    //     if (charm) {
    //         charm_multiplier = 2.5;
    //     }
    //
    //
    //     if (card.skill == "Score Up") {
    //         // activation types: notes, time, combo string, perfects
    //         if (card.skill_activation_type == "perfects") {
    //             card.score_contr = baseNotesActivation * .85 * charm_multiplier;
    //         } else if (card.skill_activation_type == "time") {
    //             card.score_contr = (125 / card.skill_activation_num) * card.skill_activation_percent * card.skill_activation * charm_multiplier;
    //         } else { // notes or combo string
    //             card.score_contr = baseNotesActivation * charm_multiplier;
    //         }
    //         card.heal_contr = 0;
    //         card.pl_contr = 0;
    //     } else if (card.skill == "Perfect Lock") {
    //         card.pl_contr = baseNotesActivation;
    //         card.score_contr = 0;
    //         card.heal_contr = 0;
    //     } else if (card.skill == "Healer") {
    //         card.score_contr = baseNotesActivation * 270;
    //         card.heal_contr = baseNotesActivation * 1;
    //         card.pl_contr = 0;
    //     }
    //     if (skillType == "sc") return card.score_contr;
    //     else if (skillType == "pl") return card.pl_contr;
    //     else return card.heal_contr;

    // TODO: account for R/promo skills
    //}

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
