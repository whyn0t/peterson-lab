angular.module('app').controller('mvMainCtrl', function($scope){
    $scope.myVar = "Hello Angular";
    $scope.onSpace = function(keyEvent) {
            console.log(keyEvent.keyCode);
    }
});
