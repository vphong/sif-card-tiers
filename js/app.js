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
            } else if (card.skill.activation_type.includes("star")) {
                activations = Math.floor(song.stars / card.skill.activation_count)
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
