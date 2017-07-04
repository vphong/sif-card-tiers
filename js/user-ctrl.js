app.controller('UserCtrl', function($rootScope, $scope, Cards, localStorageService, $filter, bsLoadingOverlayService) {

  var editedCards = []
  var allIdlz = false;
  var allCards = [];
  var overlayHandlerCards = bsLoadingOverlayService.createHandler({
    referenceId: 'owned'
  });
  var overlayHandlerGet = bsLoadingOverlayService.createHandler({
    referenceId: 'sit'
  });

  var init = function() {
    $scope.filters = localStorageService.get('userFilters');
    if (!$scope.filters) $scope.filters = angular.copy($rootScope.InitFilters);

    $scope.sort = localStorageService.get('sort');
    if (!$scope.sort) $scope.sort = angular.copy($rootScope.InitSort);

    $scope.sit = localStorageService.get('sit');
    if (!$scope.sit) $scope.sit = {};


    $scope.song = localStorageService.get('userSong');
    if (!$scope.song) $scope.song = angular.copy($rootScope.Song);


    // $scope.search = localStorageService.get('userSearch');
    // if (!$scope.search) $scope.userSearch = "";

    overlayHandlerCards.start()
    $scope.cards = localStorageService.get('userCards');
    if (!$scope.cards) {
      $scope.cards = [];
      $scope.ownedcards_len = 0
    } else {
      $scope.ownedcards_len = $scope.cards.length
      editedCards = localStorageService.get('eUserCards')
      if (!editedCards) editedCards = []
      else {

        for (var i = 0; i < editedCards.length; i++) {
          var edited = editedCards[i]
          for (var j = 0; j < $scope.cards.length; j++) {
            if (edited.id == $scope.cards[j].id) {
              $scope.cards[j] = edited
              break;
            }
          }
        }

      }
    }

    $scope.$on('ngRepeatComplete', function() {
      $rootScope.loading = false
      overlayHandlerCards.stop();
    })
  }
  init();

  $scope.filterCards = function() {
    overlayHandlerCards.start()
    var filtered = []
    var cards = localStorageService.get('userCards')
    angular.forEach(cards, function(card) {
      if (Cards.matchesFilter($scope.filters, card)) {
        Cards.skill(card, $scope.song)
        filtered.push(card)
      }
    })

    $scope.cards = filtered

    localStorageService.set('userFilters', $scope.filters);


    overlayHandlerCards.stop();
  }
  $scope.filterCards() // initial filtering

  // $scope.updateSearch = function() {
  //   localStorageService.set('userSearch', $scope.userSearch);
  // }

  $scope.updateSong = function() {
    for (var i = 0; i < $scope.cards.length; i++) {
      Cards.skill($scope.cards[i], $scope.song);
    }
    localStorageService.set('userSong', $scope.song);
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
      $scope.cards = [];
      localStorageService.set('sit', $scope.sit);
      localStorageService.set('userCards', $scope.cards);

    };
    localStorageService.set('sit', $scope.sit)
    overlayHandlerGet.stop()
  };

  $scope.getAccounts = function() {
    overlayHandlerGet.start()
    $scope.grabbedAccounts = true;
    $scope.cards = [];

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

    $scope.cards = []

    var ownedCards = response.data.results;
    var allCards = Cards.data()

    allCards.$loaded().then(function() {
      // console.log(ownedCards.length)
      for (var i = 0; i < response.data.count; i++) {
        var ownedCard = ownedCards[i]
        var found = false

        for (var j = 0; j < allCards.length; j++) {
          // console.log(card)
          var card = allCards[j]
          if (ownedCard.card == card.id) {
            card.sit_id = ownedCard.id
            card.user_idlz = ownedCard.idolized;
            card.idlz = card.user_idlz
            card.skill.lvl = ownedCard.skill
            Cards.skill(card, $scope.song)
            $scope.cards.push(card)
            break;
          }
        }
      }
      $scope.ownedcards_len = $scope.cards.length
      localStorageService.set('userCards', $scope.cards)
    })


    if (nextUrl) Cards.getUrl(nextUrl).then(getCardsSuccess);


    // filter for display
    // $scope.cards = angular.copy(Cards.filter($scope.filters, $scope.ownedCards));
    // Cards.skill($scope.cards, $scope.song);

  };
  var getCardsError = function(response) {
    // TODO
  }
  $scope.getCards = function() {
    $scope.cards = [];
    overlayHandlerGet.start()
    Cards.getUrl($scope.sit.ownedCardsUrl).then(getCardsSuccess);

    $scope.$on('ngRepeatComplete', function() {
      overlayHandlerGet.stop();
    })
  };



  $scope.setLocalStorageFilters = function() {
    localStorageService.set('userFilters', $scope.filters)
  }

  $scope.resetFilters = function() {
    $scope.filters = angular.copy($rootScope.InitFilters);
    localStorageService.set('userFilters', $scope.filters);

    $scope.sort = {
      type: 'stat.avg',
      desc: true,
    }
    $scope.filterCards()
    $scope.sortBy($scope.sort.type);
  }

  var storeEditedCard = function(card) {
    var found = false
    for (var i = 0; i < editedCards.length; i++) {
      if (editedCards[i].sit_id == card.sit_id) {
        editedCards[i] = card
        found = true
        break;
      }
    }
    if (!found) editedCards.push(card)
    localStorageService.set('eUserCards', editedCards)

  }

  $scope.lvl = 1
  $scope.updateSkillLevels = function() {
    for (var i = 0; i < $scope.cards.length; i++) {
      $scope.cards[i].skill.lvl = $scope.lvl
      Cards.skill($scope.cards[i], $scope.song)
    }
  }
  $scope.updateSkillLevel = function(card) {
    Cards.skill(card, $scope.song)
    storeEditedCard(card)
  }

  $scope.toggleIdlz = function(card) {
    Cards.toggleIdlz(card)
    storeEditedCard(card)
  }

  $scope.idlzAll = function() {
    allIdlz = !allIdlz
    Cards.idlzAll($scope.cards, allIdlz)
    angular.forEach($scope.cards, function(card) {
      Cards.toggleIdlz(card)
    })

    if ($scope.sort.type == 'stat.display') {
      $scope.sortBy('stat.display', true)
    }
  }

  $scope.sortBy = function(type) {
    Cards.sortBy($scope.sort, type)
    localStorageService.set('sort', $scope.sort)
  }

});
