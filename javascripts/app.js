var app = angular.module('tierList', ['ui.bootstrap']);

// TODO: loading spinner

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
            delete cards[i].center_skill;
            delete cards[i].center_skill_details;
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
        }
        return cards;
    }

    return ret;
});


app.controller('TierCtrl', function($scope, $filter, Cards) {
    $scope.cardsBase = "jp";
    $scope.cardsBase.upcoming = false;
    $scope.filters = {
        attribute: 'all',
        origin: {premium: 'true',
        promo: 'true',
        evnt: 'true'}
    }

    $scope.cards = {};

    var count = 0;
    var getCardsSuccess = function(data, status) {
        count = data.count;
        $scope.cards = data.results;
        $scope.cards = Cards.cleanCards($scope.cards);
    }

    var url = "https://crossorigin.me/http://schoolido.lu/api/cards/?&page_size=50&ordering=-id&rarity=SR,UR&japan-only=true";
    $scope.$watch('cardsBase', function(n, o) {
        if (n !== o) {
            $scope.cardsBase = n;

            if ($scope.cardsBase == "jp")
                url = "https://crossorigin.me/http://schoolido.lu/api/cards/?&ordering=-id&rarity=SR,UR&japan-only=true";
            else if ($scope.cardsBase == "en")
                url = "https://crossorigin.me/http://schoolido.lu/api/cards/?&ordering=-id&rarity=SR,UR&japan-only=false";
            else {

            }
        }
    })

    $scope.getCards = function() {
        Cards.getCards(url).success(getCardsSuccess);
    };

    $scope.sort = { reverse: '', type: ''};
    $scope.sortBy = function(type) {
        $scope.sort.reverse = ($scope.sort.type === type) ? !$scope.sort.reverse : false;
        $scope.sort.type = type;
    };
  $scope.arrFromSortType = Object.keys($scope.sort).map(function(key) {
    return $scope.sort[key];
  });

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
      var filterEvent = ($scope.filters.evnt == (card.event==null));
      var showIf = filterPremium && filterPromo && filterEvent;
      return showIf;
    }
    // TODO: filter by group
    // TODO: filter by skill
    // TODO: display by idlz


    // TODO: parse skill for info
    // TODO: calculate skill contribution
    // TODO: calculate total card strength
    // TODO: pagination

});
