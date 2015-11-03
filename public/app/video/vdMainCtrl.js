//'use strict';
angular.module('app').controller('vdMainCtrl',
    ["$sce", "$scope", function ($sce, $scope, $rootScope) {
        var controller = this;
        controller.API = null;

        controller.onPlayerReady = function(API) {
            controller.API = API;
            $scope.videoAPI = API;
            console.log("player ready");
            console.log($scope.phase);
        }

        $scope.$on('stopPlayer', function(){
            $scope.$emit('playerTime', controller.API.currentTime);
            controller.API.stop();
        });

        controller.config = {
            sources: [
                //{src: $sce.trustAsResourceUrl("/video/stim1.mp4"), type: "video/mp4"},
                {src: $sce.trustAsResourceUrl($rootScope.stimulusUrl), type: "video/mp4"},
                {src: $sce.trustAsResourceUrl("/video/stim1.webm"), type: "video/webm"},
                {src: $sce.trustAsResourceUrl("/video/stim1.mp4"), type: "video/ogg"}
            ]
        }

    }
    ]
    );