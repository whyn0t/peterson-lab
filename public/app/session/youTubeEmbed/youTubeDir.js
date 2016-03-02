angular.module('app').directive('youtube', function($window, YT_event, youTubeApiService) {
    return {
        restrict: "E",

        scope: {
            height: "@",
            width: "@",
            videoid: "@"
        },

        template: "<div><div id='overlay' style='position: relative; z-index: 0'><div id='YTplayer' style='position: relative; z-index: -1'/></div></div>",

        link: function(scope, element, attrs, $rootScope) {
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            var player;

            youTubeApiService.onReady(function() {
                player = setupPlayer(scope, element);
            });

            function setupPlayer(scope, element) {
                return new YT.Player(document.getElementById('YTplayer'), {
                    playerVars: {
                        autoplay: 1,
                        html5: 1,
                        theme: "light",
                        color: "white",
                        iv_load_policy: 3,
                        showinfo: 0,
                        controls: 0,
                        fs:0,
                        modestBranding: 1,
                        rel: 0,
                        disablekb: 0
                    },

                    height: scope.height,
                    width: scope.width,
                    videoId: scope.videoid,

                    events: {
                        'onStateChange': function(event) {

                            var message = {
                                event: YT_event.STATUS_CHANGE,
                                data: ""
                            };

                            switch(event.data) {
                                case YT.PlayerState.PLAYING:
                                    message.data = "PLAYING";
                                    break;
                                case YT.PlayerState.ENDED:
                                    message.data = "ENDED";
                                    break;
                                case YT.PlayerState.UNSTARTED:
                                    message.data = "NOT PLAYING";
                                    break;
                                case YT.PlayerState.PAUSED:
                                    message.data = "PAUSED";
                                    break;
                            }

                            scope.$apply(function() {
                                scope.$emit(message.event, message.data);
                            });
                        }
                    }
                });
            }

            scope.$watch('height + width', function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }

                player.setSize(scope.width, scope.height);

            });

            scope.$watch('videoid', function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }

                player.cueVideoById(scope.videoid);

            });

            scope.$on(YT_event.STOP, function () {
                player.seekTo(0);
                player.stopVideo();
            });

            scope.$on(YT_event.PLAY, function () {
                console.log("RECEIVING");
                player.playVideo();
            });

            scope.$on(YT_event.PAUSE, function () {
                player.pauseVideo();
            });

            scope.$on('stopPlayer', function () {
                scope.$emit('playerTime', player.getCurrentTime());
            });

            scope.$on(YT_event.STATUS_CHANGE, function (event, message) {
                if(message == 'ENDED'){
                    scope.$emit('playerTime', player.getCurrentTime());
                }
            });

        }
    };
});