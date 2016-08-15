var app = angular.module('tierList', ['ui.bootstrap', 'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor']);

app.factory('allHttpInterceptor', function(bsLoadingOverlayHttpInterceptorFactoryFactory) {
    return bsLoadingOverlayHttpInterceptorFactoryFactory();
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

    ret.getCards = function(url) {
        return $http.get(url);
    }

    ret.cleanCards = function(cards) {
        var len = cards.length;
        for (var i = 0; i < len; i++) {
            delete cards[i].idol.note;
            delete cards[i].idol.year;
            delete cards[i].idol.school;
            delete cards[i].idol.chibi;
            delete cards[i].idol.main_unit;
            delete cards[i].idol.chibi_small;
            delete cards[i].idol.sub_unit;
            delete cards[i].japanese_center_skill;
            delete cards[i].japanese_center_skill_details;
            delete cards[i].video_story;
            delete cards[i].japanese_video_story;
            delete cards[i].ur_pair;
            delete cards[i].total_wishlist;
            delete cards[i].ranking_attribute;
            delete cards[i].ranking_rarity;
            delete cards[i].ranking_special;
            delete cards[i].release_date;
            delete cards[i].is_special;
            delete cards[i].japanese_skill_details;
            delete cards[i].japanese_skill;
            delete cards[i].card_image;
            delete cards[i].card_idolized_image;
            delete cards[i].english_card_image;
            delete cards[i].english_card_idolized_image;
            delete cards[i].transparent_image;
            delete cards[i].transparent_idolized_image;
            delete cards[i].clean_ur;
            delete cards[i].clean_ur_idolized;
            delete cards[i].skill_up_cards;
            delete cards[i].total_owners;
            //delete cards[i].event.note;
            delete cards[i].promo_item;
            delete cards[i].promo_link;
            delete cards[i].promo_item;
            cards[i].premium = (!cards[i].event) && (!cards[i].is_promo);
            var skill_details_array = cards[i].skill_details.replace(/[,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(" ");
            var endStr = skill_details_array.length - 1;
            console.log(skill_details_array)
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


app.controller('TierCtrl', function($scope, $filter, Cards) {
    $scope.filters = {
        attribute: 'all',
        server: 'jp',
        skill: 'scorer'
    }

    $scope.cards = [];

    var count = 0;
    var getCardsSuccess = function(data, status) {
        count = data.count;
        $scope.cards = data.results;
        $scope.cards = Cards.cleanCards($scope.cards);
    }


    $scope.url = "https://crossorigin.me/http://schoolido.lu/api/cards/?&page_size=25&ordering=-id&rarity=SR,SSR,UR&japan-only=false&skill=score up&idol_main_unit=μ's";
    var base = "https://crossorigin.me/http://schoolido.lu/api/cards/?&page_size=25&ordering=-id";

    var getCards = function() {
        Cards.getCards($scope.url).success(getCardsSuccess);
    };
    $scope.updateURL = function() {
        $scope.url = base;
        var filters = $scope.filters;

        if (filters.server == "en") $scope.url += "&japan-only=false";
        else $scope.url += "&japan-only=true";

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

        if (filters.skill == "scorer") $scope.url += "&skill=score up";
        else if (filters.skill == "pl") $scope.url += "&skill=perfect lock";
        else if (filters.skill == "healer") $scope.url += "&skill=healer";

        if (filters.muse && !filters.aqours) $scope.url += "&idol_main_unit=μ's";
        else if (!filters.muse && filters.aqours) $scope.url += "&idol_main_unit=Aqours";
        else if (filters.muse && filters.aqours) $scope.url += "&idol_main_unit=μ's,Aqours"
        getCards();
    }

    getCards();

    $scope.sort = {
        reverse: true,
        type: 'id',
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


    // TODO: parse skill for info

    // ****** calculate skill contribution
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
    // common center skill bonus
    $scope.cScore = function(card) {
        var statToMod = stat_to_mod(card);
        card.cScore = statToMod + (statToMod * (.09 + .03)) * 2;;
        return card.cScore
    };
    // optimal center skill bonus
    $scope.oScore = function(card) {
        var statToMod = stat_to_mod(card);
        card.oScore = statToMod + (statToMod * (.09 + .06)) * 2;
        return card.oScore;
    };

    $scope.skillContr = function(card) {
			card.skill_contr = 0;
			var notesActivation = (550 / card.skill_activation_num) * card.skill_activation_percent;
			if (card.skill == "Score Up") {
				// activation types: notes, time, combo string, perfects
				if (card.skill_activation_type == "perfects") {
					card.skill_contr = notesActivation * .85 * card.skill_activation;
				}
				else if (card.skill_activation_type == "time") {
					card.skill_contr = (125 / card.skill_activation_num) * card.skill_activation_percent * card.skill_activation;
				}
				else { // notes or combo string
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
