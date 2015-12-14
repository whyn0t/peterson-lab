//'use strict';
angular.module('app').controller('stimulusCtrl',
    ["$sce", "$scope", function ($sce, $scope) {
        var vm = this;
        vm.API = null;

        vm.onPlayerReady = function(API) {
            vm.API = API;
            $scope.videoAPI = API;
        }

        $scope.$on('stopPlayer', function(){
            $scope.$emit('playerTime', vm.API.currentTime);
            vm.API.stop();
        });

        vm.config = {
            sources: [
                //TODO the S3 path should be in a config file, not hardcoded
                //get stimulus name from parent scope
                {src: $sce.trustAsResourceUrl('https://s3-us-west-2.amazonaws.com/peterson-elab/' + $scope.stimulus), type: "video/mp4"}
            ]
        }

    }
    ]
    );