angular.module('app').controller('mvAdminCtrl', function($scope, $http) {
    $scope.authentication = {attempts: 0};
    $scope.newStudy = {};
    $scope.studies = {};

    $scope.submitCredentials = function(){
        $http.post('/api/auth', {
            username: $scope.authentication.username,
            password: $scope.authentication.password
        }).then(function(res){
            $scope.authentication.access_token = res.data.token;
            $scope.authentication.expires = res.data.exp;
            populateStudyTable();
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

    $scope.deleteStudy = function(studyId){
        console.log(studyId);
        $http({
            method: 'POST',
            url: '/api/removeStudy',
            headers: {
                'x-access-token': $scope.authentication.access_token
            },
            data: {_id: studyId}
        }).then(function(res){
            populateStudyTable();
        })
    }
});
