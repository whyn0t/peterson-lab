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
    'com.2fdevs.videogular.plugins.controls',
    'ng.deviceDetector',
    'ui.bootstrap'
]);

angular.module('app').config(['$locationProvider', function AppConfig($locationProvider){
    $locationProvider.html5Mode(true);
}]);