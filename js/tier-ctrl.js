app.controller('TierCtrl', function($rootScope, $scope, Cards, localStorageService, $filter, $firebaseArray) {

  // $rootScope = $rootScope.$new(true)
  // $scope = $scope.$new(true)
  var allIdlz = false;
  $scope.init = function() {
    $scope.filters = localStorageService.get('filters');
    if (!$scope.filters) $scope.filters = angular.copy($rootScope.InitFilters);

    /*$scope.cards = localStorageService.get('cards');
    if (!$scope.cards)*/

    $scope.song = localStorageService.get('song');
    if (!$scope.song) $scope.song = angular.copy($rootScope.Song);

    $scope.cards = localStorageService.get('cards')
    if (!$scope.cards) {
      $scope.cards = Cards.data('-stat')

      $scope.cards.$loaded().then(function() {
        // run calcs
        angular.forEach($scope.cards, function(card) {
          Cards.skill(card, $scope.song)
        })
      })

    }

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
    Cards.skill($scope.cards, $scope.song, $scope.filters.heel);
    localStorageService.set('song', $scope.song);
  }

  $scope.updateSkillLevel = function(card) {
    Cards.skill(card, $scope.song)
    localStorageService.set('cards', $scope.cards)
  }

  $scope.sortBy = function(type, desc) {

    Cards.sortBy($scope.sort, type, desc)
    localStorageService.set('sort', $scope.sort)
  }


  $scope.toggleIdlz = function(card) {
    Cards.toggleIdlz(card)
    localStorageService.set('cards', $scope.cards)
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
    $scope.cards = Cards.filterCards($scope.filters, angular.copy($rootScope.Cards));
    Cards.skill($scope.cards, $scope.song, $scope.filters.heel);
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
