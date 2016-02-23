angular.module('app').factory('sessionAuth', ['$location', '$http', function($location, $http){
    var pid = $location.search().pid;
    var sid = $location.search().sid;
    var sessionData = null;

    return $http({
        method: 'POST',
        url: '/api/auth/session',
        data: {
            sid: sid,
            pid: pid
        }
    });

    //.then(function(res) {
    //    sessionData = res.data;
    //}, function(res) {
    //    //TODO authentication failed
    //});

    //return sessionData;

}]);