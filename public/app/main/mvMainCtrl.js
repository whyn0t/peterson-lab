angular.module('app').controller('mvMainCtrl', function($scope, $window, $document, $interval, $http, audioRecorderService){
    'use strict';

    var ctrl = this;
    $scope.user = {};
    $scope.imageCount = 0;

    //TODO webcam capture junk needs to be put into a directive
    var _video = null,
        patData = null;
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
        audioRecorderService.API.initAudio();
    }

    $scope.onSuccess = function () {
        // The video element contains the captured camera data
        _video = $scope.channel.video;
        $scope.$apply(function() {
            $scope.patOpts.w = _video.width;
            $scope.patOpts.h = _video.height;
        });
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
            //idata.toBlob(uploadImage);
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

    function uploadAudio(){
        var fd = new FormData();
        fd.append('file', audioRecorderService.API.getAudioData(), 'audio.wav');
        $http.post('/api/avData?id=' + $scope.user.id, fd,
            {
                transformRequest: function(data) { return data; },
                headers: {'Content-Type': undefined }
            }).success(function() {
                console.log("Uploaded audio");
            }).error(function() {
                console.log("Audio upload failed");
            });
    }

    function uploadImage(blob){
        var fd = new FormData();
        fd.append('file', blob, 'image' + $scope.imageCount + '.png');
        $http.post('/api/avData?id=' + $scope.user.id, fd,
            {
                transformRequest: function(data) { return data; },
                headers: {'Content-Type': undefined }
            }).success(function() {
                console.log("Uploaded image");
            }).error(function() {
                console.log("Image upload failed");
            });
        $scope.imageCount += 1;
    }

    $scope.$watch('audioRecorderService.micTestPass', function(){
        if (audioRecorderService.micTestPass){
            $scope.micTestPass = true;
        }
        console.log('micTest Event Received')
    });

    $scope.$on('playerTime', function(event, data){
        $scope.stopTime = data;
    });

    $scope.switchToThankYou = function(){
        $scope.phase = "thankyou";
    }

    var stopImg;
    $scope.phase = "welcome";

    angular.element($window).on('keydown', function(e) {
        console.log(e);
        if (e.keyCode == 32) {
            if ($scope.phase == "welcome" && !ctrl.idForm.input.$error.required){
                //start video capture
                //audioRecorderService.API.initAudio();
                audioRecorderService.API.toggleRecording();
                $scope.makeSnapshot();
                stopImg = $interval(function () {
                    $scope.makeSnapshot();
                }, 5000);
                //start audio capture
                $scope.phase = "stimulus";
            } else if ($scope.phase == "stimulus") {
                $scope.$broadcast('stopPlayer');
                audioRecorderService.API.toggleRecording();
                $interval.cancel(stopImg);
                $scope.phase = "debrief";
            } else if ($scope.phase == "thankyou") {
                //uploadAudio();
                $scope.phase = "welcome";
                location.reload();
            }
        }
    });

});
