angular.module('app').controller('mvMainCtrl', function($scope, $window, $document, $interval, $http, $location, audioRecorderService){
    'use strict';

    var ctrl = this;
    $scope.user = {};
    $scope.imageCount = 0;
    $scope.validation = {};
    $scope.borders = {webcam: { border: '5px solid red' },
                        microphone: { border: '5px solid red' },
                        speakers: { border: '5px solid red' }};
    $scope.sessionData = {studyId: $location.search().studyId || 'demo'};
    var authentication = {};

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
            idata.toBlob(uploadImage);
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
        if ($scope.sessionData.studyId != 'demo') {
            var fd = new FormData();
            fd.append('file', audioRecorderService.API.getAudioData(), 'audio.wav');
            var postUrl = '/api/avData?studyId=' + $scope.sessionData.studyId + '&partId=' + $scope.sessionData.partId;
            $http.post(postUrl, fd,
                {
                    transformRequest: function (data) {
                        return data;
                    },
                    headers: {
                        'Content-Type': undefined,
                        'x-access-token': authentication.token
                    }
                }).success(function () {
                    console.log("Uploaded audio");
                }).error(function () {
                    console.log("Audio upload failed");
                });
        }
    }

    function uploadImage(blob){
        if ($scope.sessionData.studyId != 'demo') {
            var fd = new FormData();
            fd.append('file', blob, 'image' + $scope.imageCount + '.png');
            var postUrl = '/api/avData?studyId=' + $scope.sessionData.studyId + '&partId=' + $scope.sessionData.partId;
            $http.post(postUrl, fd,
                {
                    transformRequest: function (data) {
                        return data;
                    },
                    headers: {
                        'Content-Type': undefined,
                        'x-access-token': authentication.token
                    }
                }).success(function () {
                    console.log("Uploaded image");
                }).error(function () {
                    console.log("Image upload failed");
                });
            $scope.imageCount += 1;
        }
    }

    $scope.$watch('audioRecorderService.micTestPass', function(){
        if (audioRecorderService.micTestPass){
            $scope.micTestPass = true;
        }
        console.log('micTest Event Received')
    });

    $scope.$watch('validation.speakerTestInput', function(){
        if ($scope.validation.speakerTestInput) {
            $scope.validation.speakerTestInput = $scope.validation.speakerTestInput.toLowerCase().trim();
            if ($scope.validation.speakerTestInput == 'welcome'){
                $scope.borders.speakers = { border: '5px solid green' };
            }
        }
    });

    $scope.$watch('sessionData.partId', function(){
       if($scope.sessionData.partId) {
           $scope.sessionData.partId = $scope.sessionData.partId.replace(/\D/g,'');
       }
    });

    $scope.$watch('phase', function(){
        if ($scope.phase == 'stimulus') {
            validateSession();
        }
    })

    $scope.$on('playerTime', function(event, data){
        $scope.sessionData.stopTime = data;
    });

    $scope.$on('micTestPass', function(event, data){
        $scope.validation.microphone = true;
        $scope.borders.microphone = {border: '5px solid green'};
        $scope.$apply();
    });

    $scope.switchToThankYou = function(){
        $scope.phase = "thankyou";
    }

    $scope.playTestSound = function(){
        document.getElementById('audioTest').play();
    }

    var postSession = function(sessionData){
        if ($scope.sessionData.studyId != 'demo') {
            $http({
                method: 'POST',
                url: '/api/sessionData',
                data: sessionData,
                header: {
                    'x-access-token': authentication.token
                }
            })
        }
    }

    var validateSession = function(){
        //hacky
        $scope.sessionData.partId = parseInt($scope.sessionData.partId);
        $http({
            method: 'POST',
            url: '/api/auth/session',
            data: $scope.sessionData
        }).then(function(res){
            console.log(res.data.token);
            authentication = res.data;
        })
    }

    var stopImg;
    //$scope.phase = "permissions";
    $scope.phase = "welcome";

    angular.element($window).on('keydown', function(e) {
        if (e.keyCode == 32) {
            //var userIdValid = !ctrl.idForm.input.$error.required;
            //var speakerTestInput = $scope.validation.speakerTestInput.toLowerCase().trim();
            //console.log(speakerTestInput);
            if ($scope.phase == "welcome"
                && !ctrl.idForm.input.$error.required
                && $scope.validation.speakerTestInput == 'welcome'
                && $scope.validation.microphone
                && $scope.validation.webcam){
                //start video capture
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
                uploadAudio();
                postSession($scope.sessionData);
                $scope.phase = "welcome";
                location.reload();
            }
        }
    });

});
