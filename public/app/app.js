/**
 * Created by nigel on 06/07/15.
 */


angular.module('app', [
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'webcam',
    'recorder',
    'audioRecorder',
    'com.2fdevs.videogular',
    'com.2fdevs.videogular.plugins.controls'
]);

//how many arguments can be passed to the config callback?
/*
angular.module('app').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when('/run/:studyId', {template: " ", controller: "ssMainCtrl"});
});
*/

/*angular.element(window).on('keydown', function(e) {
    console.log(e);
    if (window.location.pathname == "/welcome") {
        location.href = "stimulus";
    } else if (window.location.pathname == "/stimulus") {
        location.href = "debrief";
    } else if (window.location.pathname == "/thankyou") {
        location.href = "welcome";
    }
})*/