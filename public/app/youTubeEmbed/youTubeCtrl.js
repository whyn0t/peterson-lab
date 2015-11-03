//http://blog.oxrud.com/posts/creating-youtube-directive/

angular.module('app').controller('YouTubeCtrl', function($scope, YT_event) {
    //initial settings
    $scope.yt = {
        width: 600,
        height: 480,
        videoid: "M7lc1UVf-VE"
    };

    $scope.YT_event = YT_event;
    $scope.sendControlEvent = function (yt_event) {
        this.$broadcast(yt_event);
    };

});

