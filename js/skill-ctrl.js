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
            "label": "star notes",
            "id": "star"
        }, {
            "label": "seconds",
            "id": "seconds"
        }]
        $scope.skillSong = $rootScope.Song;

        $scope.skills = localStorageService.get("skills");
        if (!$scope.skills) $scope.skills = [$rootScope.Skill];
        calcSkills()
    }
    $scope.init()

    $scope.updateSong = function() {
        localStorageService.set("skillSong", $scope.skillSong);
        calcSkills()
            // console.log($scope.skillSong)
    }

    $scope.editSkill = function(skill) {
            skill.editing = true;
        }
        // $scope.parseInput = function(skill) {
        //     if (skill.activation_percent > 1) skill.activation_percent = 1
        //     console.log(skill)
        // }
    $scope.saveSkill = function(skill) {
        angular.forEach($scope.skillTypes, function(type) {
            if (skill.type == type.type) skill.string = type.string;
        });
        calcSkills()

        skill.editing = false;
        localStorageService.set('skills', $scope.skills)
            //dong some background ajax calling for persistence...
    };

    $scope.addSkill = function() {
        var newSkill = angular.copy($rootScope.Skill)
        newSkill.type = $scope.skillTypes[Math.floor(Math.random() * 3)].type
        newSkill.activation_count = Math.floor(Math.random() * 40 + 10)
        newSkill.activation_type = $scope.activationTypes[Math.floor(Math.random() * $scope.activationTypes.length)].id
        newSkill.activation_percent = Math.floor(Math.random() * 80) / 100
        newSkill.editing = true
        console.log(newSkill)
        $scope.skills.push(newSkill)
    }

    $scope.deleteSkill = function(skill) {
        var index = $scope.skills.indexOf(skill);
        if (index > -1) $scope.skills.splice(index, 1);
        localStorageService.set('skills', $scope.skills)

    }

});
app.filter('percent', function() {
    return function(input) {
        return isNaN(input) ? input : Math.floor(input * 100) + '%';
    };
});
