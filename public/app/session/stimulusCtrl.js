//'use strict';
angular.module('app').controller('stimulusCtrl',
    ["$sce", "$scope", function ($sce, $scope) {
        var vm = this;
        vm.API = null;

        vm.onPlayerReady = function(API) {
            vm.API = API;
            $scope.videoAPI = API;
            console.log("player ready");
            console.log($scope.phase);
        }

        $scope.$on('stopPlayer', function(){
            $scope.$emit('playerTime', vm.API.currentTime);
            vm.API.stop();
        });

        vm.config = {
            sources: [
                {src: $sce.trustAsResourceUrl("/video/stim1.mp4"), type: "video/mp4"},
                {src: $sce.trustAsResourceUrl("/video/stim1.webm"), type: "video/webm"},
                {src: $sce.trustAsResourceUrl("/video/stim1.mp4"), type: "video/ogg"}
            ]
        }

    }
    ]
    );