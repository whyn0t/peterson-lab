angular.module('app').controller('mvAdminCtrl', function($scope, $http, $uibModal) {
    $scope.authentication = {attempts: 0};
    $scope.newStudy = {};
    $scope.studies = {};
    $scope.dlQuery = {};
    $scope.newShare = {};
    $scope.shares = {};
    $scope.stimuli = {};
    var modalInstance = null;

    $scope.submitCredentials = function(){
        $http.post('/api/auth', {
            username: $scope.authentication.username,
            password: $scope.authentication.password
        }).then(function(res){
            $scope.authentication.access_token = res.data.token;
            $scope.authentication.expires = res.data.exp;
            populateStudyTable();
            populateShareTable();
        }, function(res){
            if (res.status == 401){
                $scope.authentication.attempts += 1;
                //authentication failure
            } else {
                //other failure
                console.log(res.statusText);
            }
        })
    }

    $scope.openDialog = function(instructions){
        modalInstance = $uibModal.open({
            templateUrl: 'instructionsDialog.html',
            controller: 'instructionsCtrl',
            resolve: {
                instructions: function () {
                    return instructions;
                }
            }
        });

        modalInstance.result.then(function (instructions) {
            $scope.newStudy.instructions = instructions;
        });
    }



    function populateStudyTable(){
        $http({
            method: 'GET',
            url: '/api/getStudies',
            headers: {
                'x-access-token': $scope.authentication.access_token,
                'Content-Type': 'application/json'
            }
            })
            .then(function(res){
                $scope.studies = res.data;
            }, function(res){
                //the get failed
            });
    }

    $scope.postNewStudy = function(){
        $http({
            method: 'POST',
            url: '/api/newStudy',
            headers: {
                'x-access-token': $scope.authentication.access_token
            },
            data: $scope.newStudy
        }).then(function(res){
            populateStudyTable();
            $scope.newStudy = {};
        }, function(res){
            //the post failed
        });
    }

    $scope.deleteStudy = function(study){
        console.log(study);
        $http({
            method: 'POST',
            url: '/api/removeStudy',
            headers: {
                'x-access-token': $scope.authentication.access_token
            },
            data: study
        }).then(function(res){
            populateStudyTable();
        })
    }

    $scope.shareAvData = function(){
        $http({
            method: 'POST',
            url: '/api/share',
            headers: {
                'x-access-token': $scope.authentication.access_token
            },
            data: $scope.newShare
        }).then(function(res){
            populateShareTable();
            $scope.newShare = {};
        }, function(res){
            //the post failed
        });
    }

    $scope.unshareAvData = function(share){
        $http({
            method: 'POST',
            url: '/api/unshare',
            headers: {
                'x-access-token': $scope.authentication.access_token
            },
            data: share
        }).then(function(res){
            populateShareTable();
        })
    }

    function populateShareTable(){
        $http({
            method: 'GET',
            url: '/api/getShared',
            headers: {
                'x-access-token': $scope.authentication.access_token,
                'Content-Type': 'application/json'
            }
        })
            .then(function(res){
                $scope.shares = res.data;
            }, function(res){
                //the get failed
            });
    }
});
