var config = {
  "apiKey": "AIzaSyAWgi_XmsZezNTabJ920EEyeH-meRgA2FE",
  "authDomain": "sif-tiers.firebaseapp.com",
  "databaseURL": "https://sif-tiers.firebaseio.com",
  "projectId": "sif-tiers",
  "storageBucket": "sif-tiers.appspot.com",
  "messagingSenderId": "359814860496"
}
firebase.initializeApp(config)

var app = angular.module('tierList', ['ui.bootstrap', 'ui.router.tabs',
  'bsLoadingOverlay', 'bsLoadingOverlayHttpInterceptor', 'mgcrea.ngStrap',
  'ui.router', 'LocalStorageModule', 'fixed.table.header', 'firebase'
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
    delay: 500, // Minimal delay to hide loading overlay in ms.
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

app.factory('Calculations', function() {
  var ret = {};

  ret.activations = function(song, skill) {
    if (skill.type == "notes" || skill.type == "hit" || skill.type == "combo") {
      return Math.floor(song.notes / skill.interval)
    } else if (skill.type == "perfects") {
      return Math.floor(Math.floor(song.notes * song.perfects) / skill.interval)
    } else if (skill.type == "seconds") {
      return Math.floor(song.seconds / skill.interval)
    } else if (skill.type == "points") {
      return Math.floor(song.score / skill.interval)
    } else {
      //TODO: handle Snow Maiden Umi
      return 0
    }
  };

  // score = floor(stat * 0.0125 * accuracy * combo_position * note_type * attribute_bool * group_bool)
  ret.scoreUpMod = function(song, scoreUp) {
    // given a score that a card has generated, return stat corresponding to that score
    return Math.floor(scoreUp / song.notes / 0.0125);
  };

  ret.plScoreBonus = function(on_attr, song, pl_time, type) {
    // calculate exactly how many notes are estimated to go great -> perfect
    var pl_proportion_of_song = pl_time < song.seconds ? pl_time / song.seconds : 1
    var notes_during_pl = Math.floor(song.notes * pl_proportion_of_song)
    var transformed_greats_proportion_of_song = notes_during_pl * (1 - song.perfects) / song.notes

    // how much the score changed due to greats -> perfects
    var score_difference = Math.floor(on_attr * 0.0125 * .22 * Math.floor(song.notes / 2) * 1 * 1.1 * 1.1) * transformed_greats_proportion_of_song

    return Math.floor(score_difference / song.notes / (0.0125 * 1.1 * 1.1))
  }

  ret.trickStatBonus = function(on_attr, song, pl_time) {
    // calculate exactly how many notes are estimated to go great -> perfect
    var pl_proportion_of_song = pl_time < song.seconds ? pl_time / song.seconds : 1
    var notes_during_pl = Math.floor(song.notes * pl_proportion_of_song)
    var greats_during_pl = notes_during_pl * (1 - song.perfects) / song.notes
    var perfects_during_pl = notes_during_pl * song.perfects / song.notes

    var bonus = Math.floor(on_attr * 0.33)
    // how many more points greats give
    var trick_greats_bonus = Math.floor(bonus * 0.0125 * .22 * Math.floor(song.notes / 2) * 1 * 1.1 * 1.1) * greats_during_pl
    // how many more points perfects give
    var trick_perfects_bonus = Math.floor(bonus * 0.0125 * 1 * Math.floor(song.notes / 2) * 1 * 1.1 * 1.1) * perfects_during_pl

    return ret.scoreUpMod(song, trick_greats_bonus + trick_perfects_bonus)
  }

  return ret;
})

app.factory('Cards', function($rootScope, $http, Calculations, $firebaseObject, $firebaseArray, $q) {
  var ret = {};

  ret.data = function() {
    var ref = firebase.database().ref().child('cards');
    return $firebaseArray(ref)
  }
  ret.getUrl = function(url) {
    return $http.get(url)
  }

  ret.matchesFilter = function(filters, card) {
    return ((filters.server == 'en' && !card.japan_only ||
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

      (filters.su && card.skill.category == "Score Up" ||
        filters.pl && card.skill.category == "Perfect Lock" ||
        filters.hl && card.skill.category == "Healer") &&

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
    )
  }

  ret.filter = function(filters) {
    var newCards = [];
    var deferred = $q.defer();

    var cards = ret.data()
    cards.$loaded().then(function() {
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i]
        if (ret.matchesFilter(filters, card)) {
          newCards.push(card);
        }
      }
      // console.log(newCards)
      cards = newCards
      deferred.resolve(cards)
    }).catch(function(error) {
      deferred.reject(error)
    })

    return deferred.promise;

  }


  ret.toggleIdlz = function(card) {
    if (card.idlz) {
      card.stat.display = card.stat.idlz
      card.stat.avg = card.stat.idlz + card.skill.stat_bonus_avg
      card.stat.best = card.stat.idlz + card.skill.stat_bonus_best
    } else {

      card.stat.display = card.stat.base
      card.stat.avg = card.stat.base + card.skill.stat_bonus_avg
      card.stat.best = card.stat.base + card.skill.stat_bonus_best
    }
  }
  ret.idlzAll = function(cards, idlz) {
    angular.forEach(cards, function(card) {
      if (!card.user_idlz) {
        card.idlz = idlz
        ret.toggleIdlz(card)
      }
    })
  }


  var calcStatBonus = function(card) {
    var base, bonus = {};
    if (!card.idlz) {
      base = card.stat.base
    } else base = card.stat.idlz

    // TODO: delete
    card.sis = {}

    if (!card.equippedSIS) {
      bonus.avg = card.skill.stat_bonus_avg
      bonus.best = card.skill.stat_bonus_best
    } else {
      bonus.avg = card.sis.stat_bonus_avg
      bonus.best = card.sis.stat_bonus_best
    }

    card.stat.avg = base + bonus.avg
    card.stat.best = base + bonus.best
  }

  ret.skill = function(card, song) {
    var score_up_mod = 0;
    var activations = Calculations.activations(song, card.skill)
    percent = card.skill.levels[card.skill.lvl].percent
    amount = card.skill.levels[card.skill.lvl].amount
    card.skill.avg = Math.floor(activations * percent) * amount
    card.skill.best = activations * amount

    if (card.skill.category == "Perfect Lock" || card.skill.category.includes("Trick")) {
      card.skill.stat_bonus_avg = Calculations.plScoreBonus(card.stat.base, song, card.skill.avg)
      card.skill.stat_bonus_best = Calculations.plScoreBonus(card.stat.base, song, card.skill.best)
    } else if ((card.skill.category == "Healer" || card.skill.category.includes("Yell")) && !card.equippedSIS) {
      card.skill.stat_bonus_avg = card.skill.stat_bonus_best = 0;
    } else { // scorer
      card.skill.stat_bonus_avg = Calculations.scoreUpMod(song, card.skill.avg)
      card.skill.stat_bonus_best = Calculations.scoreUpMod(song, card.skill.best)
    }

    calcStatBonus(card)
  }

  ret.sortBy = function(sort, type, desc) {
    // temp var for previous sort obj to set sort.desc
    if (desc) sort.desc = true;
    else sort.desc = sort.type == type ? !sort.desc : true;
    sort.type = type
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

app.directive('master', function() { //declaration; identifier master
  function link(scope, element, attrs) { //scope we are in, element we are bound to, attrs of that element
    scope.$watch(function() { //watch any changes to our element
      scope.style = { //scope variable style, shared with our controller
        height: (element[0].offsetHeight - 55) + 'px', //set the height in style to our elements height
      };
    });
  }
  return {
    restrict: 'AE', //describes how we can assign an element to our directive in this case like <div master></div
    link: link // the function to link to our element
  };
});
