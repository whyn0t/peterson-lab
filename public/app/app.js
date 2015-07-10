/**
 * Created by nigel on 06/07/15.
 */


angular.module('app', [
    'ngResource',
    'ngRoute'
]);

//how many arguments can be passed to the config callback?
angular.module('app').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when('/main', {
            templateUrl: '/partials/main',
            controller: 'mvMainCtrl'})
        .when('/welcome', {
            templateUrl: '/partials/welcome'
        })
        .when('/stimulus', {
            templateUrl: '/partials/stimulus'
        })
        .when('/debrief', {
            templateUrl: '/partials/debrief'
        })
        .when('/thankyou', {
            templateUrl: '/partials/thankyou'
        })
        .otherwise({redirectTo: '/welcome'})
});

angular.element(window).on('keydown', function(e) {
    console.log(e);
    if (window.location.pathname == "/welcome") {
        location.href = "stimulus";
    } else if (window.location.pathname == "/stimulus") {
        location.href = "debrief";
    } else if (window.location.pathname == "/thankyou") {
        location.href = "welcome";
    }
});