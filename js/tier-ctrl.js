app.controller('TierCtrl', function($rootScope, $scope, Cards, localStorageService, $filter, $firebaseArray, bsLoadingOverlayService) {

  var editedCards = []

  var overlayHandler = bsLoadingOverlayService.createHandler({
    referenceId: 'all'
  });

  var allIdlz = false;
  $scope.init = function() {
    $scope.filters = localStorageService.get('filters');
    if (!$scope.filters) $scope.filters = angular.copy($rootScope.InitFilters);

    /*$scope.cards = localStorageService.get('cards');
    if (!$scope.cards)*/

    $scope.song = localStorageService.get('song');
    if (!$scope.song) $scope.song = angular.copy($rootScope.Song);

    overlayHandler.start()
    $scope.cards = Cards.filter($scope.filters).then(function(data) {
      // run calcs
      $scope.cards = data
      angular.forEach($scope.cards, function(card) {
        Cards.skill(card, $scope.song)
      })
      editedCards = localStorageService.get('cards')
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
      console.log($scope.cards)
      overlayHandler.stop();
    })

    $scope.sort = localStorageService.get('sort');
    if (!$scope.sort) {
      $scope.sort = {
        type: 'stat.avg',
        desc: true
      }
    }
    $scope.search = localStorageService.get('search');
    if (!$scope.search) $scope.search = "";



  }
  $scope.init();


  $scope.updateSearch = function() {
    localStorageService.set('search', $scope.search);
  }

  $scope.updateSong = function() {
    Cards.skill($scope.cards, $scope.song);
    localStorageService.set('song', $scope.song);
  }

  var storeEditedCard = function(card) {
    var found = false
    for (var i = 0; i < editedCards.length; i++) {
      if (editedCards[i].id == card.id) {
        editedCards[i] = card
        found = true
        break;
      }
    }
    if (!found) editedCards.push(card)
    console.log(editedCards)
    localStorageService.set('cards', editedCards)

  }

  $scope.sortBy = function(type, desc) {
    Cards.sortBy($scope.sort, type, desc)
    localStorageService.set('sort', $scope.sort)
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
    Cards.idlzAll($scope.cards, $scope.allIdlz)

    if ($scope.sort.type == 'stat.display') {
      $scope.sortBy('stat.display', true)
    }
  }
  $scope.toggleHeel = function() {
    Cards.skill($scope.cards, $scope.song);
  }


  $scope.filterCards = function() {
    overlayHandler.start()
    Cards.filter($scope.filters).then(function(data) {
      $scope.cards = data
      angular.forEach($scope.cards, function(card) {
        Cards.skill(card, $scope.song)
      })
      overlayHandler.stop()
    });
    // Cards.skill($scope.cards, $scope.song);
    localStorageService.set('filters', $scope.filters);
  }


  $scope.resetFilters = function() {
    $scope.filters = angular.copy($rootScope.InitFilters);
    localStorageService.set('filters', $scope.filters);

    $scope.sort = {
      type: 'stat.avg',
      desc: true
    }
    $scope.filterCards()
    $scope.sortBy($scope.sort.type);
  }

  $scope.setLocalStorageFilters = function() {
    localStorageService.set('filters', $scope.filters);
  }

});
