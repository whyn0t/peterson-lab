angular.module('app').controller('mvAdminCtrl', function($scope, $http) {
    $scope.authentication = {attempts: 0};
    $scope.newStudy = {};

    $scope.submitCredentials = function(){
        $http.post('/api/auth', {
            username: $scope.authentication.username,
            password: $scope.authentication.password
        }).then(function(res){
            $scope.authentication.access_token = res.data.token;
            $scope.authentication.expires = res.data.exp;
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

    function populateStudyTable(token){

    }

    $scope.postNewStudy = function(token){
        $http({
            method: 'POST',
            url: '/api/newStudy',
            headers: {
                'x-access-token': $scope.authentication.access_token
            },
            data: $scope.newStudy
        }).then(function(res){
            populateStudyTable($scope.authentication.access_token);
        }, function(res){
            //the post failed
        });
    }
});
