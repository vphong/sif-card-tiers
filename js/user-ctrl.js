app.controller('UserCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {
  // $rootScope = $rootScope.$new(true)
  // $scope = $scope.$new(true)
  // localStorageService.clearAll()
  var allIdlz = false;

  var init = function() {
    $scope.filters = localStorageService.get('userFilters');
    if (!$scope.filters) {
      $scope.filters = angular.copy($rootScope.InitFilters);
      $scope.filters.displayImg = true;
    }

    $scope.sort = localStorageService.get('sort');
    if (!$scope.sort) {
      $scope.sort = {
        type: 'stat.avg',
        desc: true,
      }
      localStorageService.set('sort', $scope.sort);
    }

    $scope.sit = localStorageService.get('sit');
    if (!$scope.sit) {
      $scope.sit = {};
    } else {
      // $scope.cards = [];
    }


    $scope.song = localStorageService.get('userSong');
    if (!$scope.song) $scope.song = angular.copy($rootScope.Song);


    $scope.search = localStorageService.get('userSearch');
    if (!$scope.search) $scope.userSearch = "";

    // storage for http result of account grabbing
    $scope.rawUserCards = localStorageService.get('rawUserCards');
    // storage for card data of rawUserCards
    $scope.rawUserCardsData = localStorageService.get('rawUserCardsData');

    if ($scope.rawUserCardsData) $scope.cards = angular.copy(Cards.filterCards($scope.filters, $scope.rawUserCardsData))
    else $scope.cards = [];

    Calculations.skillSkill($scope.cards, $scope.song);

  }
  init();
  $scope.updateSearch = function() {
    localStorageService.set('userSearch', $scope.userSearch);
  }

  $scope.updateSong = function() {
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
      $scope.rawUserCards = [];
      $scope.rawUserCardsData = [];
      $scope.cards = [];
      localStorageService.set('sit', $scope.sit);
      localStorageService.set('userCards', $scope.cards);
      localStorageService.set('rawUserCards', $scope.rawUserCards);
      localStorageService.set('rawUserCardsData', $scope.rawUserCardsData);

    };
    localStorageService.set('sit', $scope.sit)
  };

  $scope.getAccounts = function() {
    $scope.grabbedAccounts = true;
    $scope.rawUserCards = [];
    $scope.cards = [];
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
          card.idlz = card.user_idlz

          $scope.rawUserCardsData.push(angular.copy(card));
        }
      })
    }

    if (nextUrl) Cards.getUrl(nextUrl).then(getCardsSuccess);
    localStorageService.set('rawUserCardsData', $scope.rawUserCardsData);

    // filter for display
    $scope.cards = angular.copy(Cards.filterCards($scope.filters, $scope.rawUserCardsData));
    Calculations.skillSkill($scope.cards, $scope.song);
    localStorageService.set('userCards', $scope.cards)

  };
  var getCardsError = function(response) {
    // TODO
  }
  $scope.getCards = function() {
    $scope.rawUserCardsData = [];
    $scope.cards = [];
    Cards.getUrl($scope.sit.ownedCardsUrl).then(getCardsSuccess);
  };


  $scope.filterCards = function() {
    $scope.cards = Cards.filterCards($scope.filters, angular.copy($scope.rawUserCardsData));
    Calculations.skillSkill($scope.cards, $scope.song);

    localStorageService.set('userFilters', $scope.filters);
  }

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
  $scope.toggleIdlz = function(card) {
    Cards.toggleIdlz(card)
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
  $scope.displayScore = function(card, scoreType) {
    return Cards.displayScore(card, scoreType, $scope.filters)
  }

});
