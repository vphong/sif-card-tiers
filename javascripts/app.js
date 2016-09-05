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

app.factory('processCards', function() {
    var ret = function(cards) {
        var card;
        var cardsLen = cards.length;
        var skillType;
        var numCount = 0;
        var word;
        var details_arr;
        var len;


        for (var j = 0; j < cardsLen; i++) {
            card = cards[j];
            console.log(card)
                /// card name
            card.full_name = card.rarity;
            if (card.is_promo) {
                card.full_name += " Promo"
            } else {
                if (card.translated_collection) {
                    card.full_name += " " + card.translated_collection;
                } else {
                    card.full_name += " Unnamed"
                }
            }
            card.full_name += " " + card.name;


            /// skill details
            skillType = card.skill;
            card.skill = {
                type: skillType
            }

            details_arr = card.skill_details.split();
            len = details_arr.length;

            for (var i = 0; i < len; i++) {
                // 1. skill activation count
                word = details_arr[i]
                if (!isNaN(word) && numCount < 1) {
                    card.skill.activation_count = parseFloat(word)
                    card.skill.activation_type = details_arr[i + 1]
                    numCount++;
                } else if (!isNaN(word) && numCount < 2) {
                    card.skill.activation_value = parseFloat(word)

                }
                if (word.includes("%")) {
                    card.skill.activation_percent = parseFloat(word) / 100.0
                }

            }
        }
    }


    return ret;

});



app.controller('TierCtrl', function($scope, processCards, CardData, uiGridConstants) {
    $scope.filters = {
        server: 'jp',
        attribute: 'all',
        sr: true,
        ssr: true,
        ur: true,
        premium: true,
        event: true,
        promo: true,
        sc: true,
        pl: true,
        hl: true,
        muse: true,
        aqours: false,
        idlz: false
    };


    $scope.toggleBool = function(bool) {
        return !bool
    }

    var getIdlz = function() {
        return $scope.filters.idlz
    }

    $scope.filterCards = function() {
        var filters = $scope.filters;
        var cards = CardData;

        console.log(cards.length)
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

                ($scope.compare.type == "sc" && card.skill.type ||
                    $scope.compare.type == "pl" && card.skill.type == "Perfect Lock" ||
                    $scope.compare.type == "hl" && card.skill.type == "Healer")
                // &&
                //
                // (filters.muse && card.main_unit == "Muse" ||
                //  filters.aqours && card.main_unit == "Aqours")
            ) {
                console.log("pushing " + card.name)
                newCards.push(card);
            }
        }

        $scope.uiGrid.data = newCards;
        console.log($scope.uiGrid.data.length)

    }


    $scope.uiGrid = {
        enableVerticalScrollbar: uiGridConstants.scrollbars.WHEN_NEEDED,
        enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
        enableSorting: true,
        enableColumnMenus: false,
        enablePaginationControls: false,
        enableFiltering: false,
        paginationPageSize: 25,
        rowHeight: 55,
        columnDefs: [{
                displayName: 'ID',
                width: 40,
                field: 'id',

            }, {
                field: 'full_name',
                minWidth: 150,
                enableFiltering: true,
                displayName: 'Card Name',
            }, {
                field: 'translated_collection',
                visible: false,

            }, {
                field: 'attribute',
                width: 0,
            }, {
                field: 'rarity',
                width: 0
            }, {
                displayName: 'Skill',
                field: 'skill.type',
                width: 0,
            }, {
                field: 'cScore',
                visible: true,
                minWidth: 80,
                displayName: 'C-Score'
            }, {
                field: 'cScore_idlz',
                visible: false,
                minWidth: 80,
                displayName: 'C-Score'

            }, {
                field: 'oScore',
                visible: true,
                minWidth: 80,
                displayName: 'O-Score'

            }, {
                field: 'oScore_idlz',
                visible: false,
                minWidth: 80,
                displayName: 'O-Score'

            }, {
                displayName: 'Smile',
                field: 'non_idolized_maximum_statistics_smile',
                visible: true,

            }, {
                displayName: 'Pure',
                field: 'non_idolized_maximum_statistics_pure',
                visible: true,

            }, {
                displayName: 'Cool',
                field: 'non_idolized_maximum_statistics_cool',
                visible: true,

            }, {
                displayName: 'Smile',
                field: 'idolized_maximum_statistics_smile',
                visible: false,

            }, {
                displayName: 'Pure',
                field: 'idolized_maximum_statistics_pure',
                visible: false,
            }, {
                displayName: 'Cool',
                field: 'idolized_maximum_statistics_cool',
                visible: false,
            }, {
                displayName: 'Score Up',
                field: 'skill.su',
                visible: true,
            }, {
                displayName: 'PL Time',
                field: 'skill.pl',
                visible: false,
            }, {
                displayName: 'Healing',
                field: 'skill.hl',
                visible: false,
            }

        ],
        onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;
        },
        data: CardData
    }

    for (index in $scope.uiGrid.columnDefs) {
        var col = $scope.uiGrid.columnDefs[index];
        col.headerCellTemplate = 'column-header-template.html';
        col.sortDirectionCycle = [uiGridConstants.ASC, uiGridConstants.DESC];
    }


    $scope.toggleIdlz = function() {

        $scope.uiGrid.columnDefs[6].visible = !$scope.uiGrid.columnDefs[6].visible;
        $scope.uiGrid.columnDefs[7].visible = !$scope.uiGrid.columnDefs[7].visible; // cScore
        $scope.uiGrid.columnDefs[8].visible = !$scope.uiGrid.columnDefs[8].visible; //cScore idlz
        $scope.uiGrid.columnDefs[9].visible = !$scope.uiGrid.columnDefs[9].visible; // oScore
        $scope.uiGrid.columnDefs[10].visible = !$scope.uiGrid.columnDefs[10].visible; // oScore idlz
        $scope.uiGrid.columnDefs[11].visible = !$scope.uiGrid.columnDefs[11].visible; // stats unidlz
        $scope.uiGrid.columnDefs[12].visible = !$scope.uiGrid.columnDefs[12].visible;
        $scope.uiGrid.columnDefs[13].visible = !$scope.uiGrid.columnDefs[13].visible;
        $scope.uiGrid.columnDefs[14].visible = !$scope.uiGrid.columnDefs[14].visible; // stats idlz
        $scope.uiGrid.columnDefs[15].visible = !$scope.uiGrid.columnDefs[15].visible;

        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);

    }

    $scope.compare = {
        type: "sc"
    }
    $scope.compareType = function() {
        if ($scope.compare.type == "sc") {
            $scope.uiGrid.columnDefs[16].visible = true;
            $scope.uiGrid.columnDefs[17].visible = false;
            $scope.uiGrid.columnDefs[18].visible = false;

        } else if ($scope.compare.type == "pl") {

            $scope.uiGrid.columnDefs[16].visible = false;
            $scope.uiGrid.columnDefs[17].visible = true;
            $scope.uiGrid.columnDefs[18].visible = false;
        } else {
            $scope.uiGrid.columnDefs[16].visible = false;
            $scope.uiGrid.columnDefs[17].visible = false;
            $scope.uiGrid.columnDefs[18].visible = true;

        }

        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);

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
