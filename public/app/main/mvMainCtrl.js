angular.module('app').controller('mvMainCtrl', function($scope, $window, $document, $interval){
    'use strict';

    //webcam capture variables
    var _video = null,
        patData = null,
        _toggleRecording = null,
        _saveAudio = null;
    $scope.patOpts = {x: 0, y: 0, w: 25, h: 25};

    $scope.channel = {};

    $scope.webcamError = false;
    $scope.onError = function (err) {
        $scope.$apply(
            function() {
                $scope.webcamError = err;
            }
        );
    };

    $scope.onStream = function(stream) {
        var videoElem = document.querySelector('#webcam-live');
        // Firefox supports a src object
        if (navigator.mozGetUserMedia) {
            videoElem.mozSrcObject = stream;
            console.log(stream);
        } else {
            var vendorURL = window.URL || window.webkitURL;
            console.log(vendorURL.createObjectURL(stream));
            videoElem.src = vendorURL.createObjectURL(stream);
        }
    }

    $scope.onSuccess = function () {
        // The video element contains the captured camera data
        _video = $scope.channel.video;
        $scope.$apply(function() {
            $scope.patOpts.w = _video.width;
            $scope.patOpts.h = _video.height;
        });
        _toggleRecording = $scope.channel.toggleRecording;
        console.log(_toggleRecording);
        _saveAudio = $scope.channel.saveAudio;
    };

    $scope.makeSnapshot = function makeSnapshot() {
        console.log("snapshot");
        if (_video) {
            var patCanvas = document.querySelector('#snapshot');
            if (!patCanvas) return;

            patCanvas.width = _video.width;
            patCanvas.height = _video.height;
            var ctxPat = patCanvas.getContext('2d');

            var idata = getVideoData($scope.patOpts.x, $scope.patOpts.y, $scope.patOpts.w, $scope.patOpts.h);
            ctxPat.putImageData(idata.getContext('2d').getImageData($scope.patOpts.x, $scope.patOpts.y, $scope.patOpts.w, $scope.patOpts.h), 0, 0);

            sendSnapshotToServer(idata.toDataURL());
            $scope.dataUrl = idata.toDataURL();
        }
    };

    var getVideoData = function getVideoData( ) {
        var hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = _video.width;
        hiddenCanvas.height = _video.height;
        var ctx = hiddenCanvas.getContext('2d');
        ctx.drawImage(_video, 0, 0, _video.width, _video.height);
        return hiddenCanvas;
    };

    var sendSnapshotToServer = function sendSnapshotToServer(imgBase64) {
        $scope.snapshotData = imgBase64;
    };

    var phaseIndex = 0;
    var phases = ["welcome", "stimulus", "debrief", "thankyou"];
    $scope.phase = phases[phaseIndex];
    $scope.turnPage = function(){
        if (phaseIndex < phases.length) {
            phaseIndex += 1;
            $scope.phase = phases[phaseIndex];
        }
    }

    $scope.$on('playerTime', function(event, data){
        $scope.stopTime = data;
    });

    $scope.switchToThankYou = function(){
        $scope.phase = "thankyou";
    }

    $scope.$watch('phase', function(){
       if ($scope.phase == "stimulus") {

       } else if ($scope.phase == "debrief") {

       }
    });

    var stopImg;

    angular.element($window).on('keydown', function(e) {
        console.log(e);
        if ($scope.phase == "welcome") {
            //start video capture
            //_video.play();
            //_toggleRecording({'classList':[]});
            $scope.makeSnapshot();
            stopImg = $interval(function() {
                $scope.makeSnapshot();
            }, 5000);
            //start audio capture
            $scope.phase = "stimulus";
        } else if ($scope.phase == "stimulus") {
            $scope.$broadcast('stopPlayer');
            $interval.cancel(stopImg);
            //_toggleRecording({'classList':['recording']})
            //_saveAudio();
            $scope.phase = "debrief";
        } else if ($scope.phase == "thankyou") {
            $scope.phase = "welcome";
        }
    });

});
