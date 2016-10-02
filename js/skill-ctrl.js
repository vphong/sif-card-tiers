app.controller('SkillCtrl', function($rootScope, $scope, Cards, localStorageService, $filter) {

    var calcSkills = function() {
        angular.forEach($scope.skills, function(skill) {
            Cards.calcSkill(skill, $scope.skillSong)
        })
        console.log("calculating skills")
    };

    $scope.init = function() {
        $scope.skillTypes = [{
            "type": "Score Up",
            "string": "score"
        }, {
            "type": "Perfect Lock",
            "string": "perfect lock seconds"
        }, {
            "type": "Healer",
            "string": "stamina"
        }]

        $scope.activationTypes = [{
            "label": "notes",
            "id": "notes"
        }, {
            "label": "combo string",
            "id": "hit"
        }, {
            "label": "perfects",
            "id": "perfects"
        }, {
            "label":"star notes",
            "id": "star"
        }, {
            "label": "seconds",
            "id": "seconds"
        }]
        $scope.skillSong = $rootScope.Song;

        $scope.skills = [{
            "activation_count": 25,
            "activation_type": "notes",
            "activation_percent": .38,
            "activation_value": 200,
            "editing": false,
            "type": $scope.skillTypes[0].type,
            "string": $scope.skillTypes[0].string
        }];
        calcSkills()
    }
    $scope.init()

    $scope.updateSong = function() {
        localStorageService.set("skillSong", $scope.skillSong);
        calcSkills()
        console.log($scope.skillSong)
    }

    $scope.editSkill = function(skill) {
        skill.editing = true;
    }

    $scope.doneEditing = function(skill) {
        angular.forEach($scope.skillTypes, function(type) {
            if (skill.type == type.type) skill.string = type.string;
        });

        skill.editing = false;
        //dong some background ajax calling for persistence...
    };

});
app.filter('percent', function() {
    return function(input) {
        return isNaN(input) ? input : Math.floor(input * 100) + '%';
    };
});
