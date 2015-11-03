//http://blog.oxrud.com/posts/creating-youtube-directive/

var ytApp = angular.module('app');

//TODO understand constants
ytApp.constant('YT_event', {
    STOP:            0,
    PLAY:            1,
    PAUSE:           2,
    PLAYER_STOP:     3
});

ytApp.directive('youtube', function($window, YT_event) {
    return {
        restrict: "E",

        scope: {
            height:   "@",
            width:    "@",
            videoId:  "@"
        },

        template: '<div></div>',

        link: function(scope, element, attrs) {
            //asynchronously load the youtube api
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            var player;

            $window.onYouTubeIframeAPIReady = function() {
                player = new YT.Player(element.children()[0], {
                    playerVars: {
                        autoplay: 1,
                        disablekb: 0,
                        enablejsapi: 1,
                        modesbranding: 0,
                        showinfo: 0,
                        controls: 0
                    },
                    height: scope.height,
                    width: scope.width,
                    videoId: scope.videoId
                });
            };

            scope.$on(YT_event.STOP, function () {
                scope.$emit(YT_event.PLAYER_STOP, player.getCurrentTime());
                //player.seekTo(0);
                player.stopVideo();
            });

            scope.$on(YT_event.PLAY, function () {
                player.playVideo();
            });
        }
    }
});
