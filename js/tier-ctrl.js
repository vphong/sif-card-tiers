app.controller('TierCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    // $rootScope = $rootScope.$new(true)
    // $scope = $scope.$new(true)
    $scope.init = function() {

        $scope.filters = localStorageService.get('filters');
        if (!$scope.filters) $scope.filters = angular.copy($rootScope.InitFilters);

        /*$scope.cards = localStorageService.get('cards');
        if (!$scope.cards)*/

        $scope.song = localStorageService.get('song');
        if (!$scope.song) $scope.song = angular.copy($rootScope.Song);

        $scope.cards = angular.copy(Cards.filterCards($scope.filters, $rootScope.Cards));

        $scope.sort = localStorageService.get('sort');
        if (!$scope.sort) {
            $scope.sort = {
                type: 'cScore',
                desc: true
            }
        }
        $scope.search = localStorageService.get('search');
        if (!$scope.search) $scope.search = "";

        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);


    }
    $scope.init();


    $scope.updateSearch = function() {
        localStorageService.set('search', $scope.search);
    }

    $scope.updateSong = function() {
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);
        localStorageService.set('song', $scope.song);
    }

    $scope.sortBy = function(type) {

        Cards.sortBy($scope.sort, $scope.filters.idlz, type)
        localStorageService.set('sort', $scope.sort)
    }

    $scope.toggleHeel = function() {
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);

        if ($scope.filters.heel) $scope.sortBy("cScore.heel");
        else $scope.sortBy("cScore")
    }

    $scope.displayScore = function(card, scoreType) {
        return Cards.displayScore(card, scoreType, $scope.filters)
    }

    $scope.filterCards = function() {
        $scope.cards = Cards.filterCards($scope.filters, angular.copy($rootScope.Cards));
        Cards.calcSkill($scope.cards, $scope.song, $scope.filters.heel);
        localStorageService.set('filters', $scope.filters);
    }


    $scope.resetFilters = function() {
        $scope.filters = angular.copy($rootScope.InitFilters);
        localStorageService.set('filters', $scope.filters);

        $scope.sort = {
            type: 'cScore',
            desc: false
        }
        $scope.filterCards()
        $scope.sortBy($scope.sort.type);
    }

    $scope.setLocalStorageFilters = function() {
        localStorageService.set('filters', $scope.filters);
    }

});
