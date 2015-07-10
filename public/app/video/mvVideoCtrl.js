//'use strict';
angular.module('app').controller('mvVideoCtrl',
    ["$sce", function ($sce) {
        this.config = {
            sources: [
                {src: $sce.trustAsResourceUrl("/video/stim1.mp4"), type: "video/mp4"},
                {src: $sce.trustAsResourceUrl("/video/stim1.webm"), type: "video/webm"},
                {src: $sce.trustAsResourceUrl("/video/stim1.mp4"), type: "video/ogg"}
            ]
        }

    }
    ]
    );