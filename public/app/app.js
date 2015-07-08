/**
 * Created by nigel on 06/07/15.
 */


angular.module('app', ['ngResource', 'ngRoute']);

//how many arguments can be passed to the config callback?
angular.module('app').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when('/', { templateUrl: '/partials/main', controller: 'mainCtrl'})
});

angular.module('app').controller('mainCtrl', function($scope){
    $scope.myVar = "Hello Angular";
})
