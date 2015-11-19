angular.module('app').controller('ssMainCtrl', function($scope, $window, $document, $interval, $http, $location, audioRecorderService){
    'use strict';

    var ctrl = this;
    $scope.user = {};
    //for snapshot
    $scope.imageCount = 0;

    $scope.validation = {};
    //for validation
    $scope.borders = {webcam: { border: '5px solid red' },
                        microphone: { border: '5px solid red' },
                        speakers: { border: '5px solid red' }};

    //HACK to get studyId from url when or format /run/:studyId
    var urlPath = $location.absUrl().split('/');
    if (urlPath[urlPath.length - 2] == 'run'){
        $scope.sessionData = {studyId: urlPath[urlPath.length - 1]}
    } else {
        $scope.sessionData = {studyId: 'demo'};
    }
    //$scope.sessionData = {studyId: $location.search().studyId || 'demo'};
    var authentication = {};

    //TODO webcam capture junk needs to be put into a directive
    var _video = null,
        patData = null;
    $scope.patOpts = {x: 0, y: 0, w: 25, h: 25};

    //from webcam directive for storing data
    $scope.channel = {};

    $scope.webcamError = false;
    $scope.onError = function (err) {
        $scope.$apply(
            function() {
                $scope.webcamError = err;
            }
        );
    };

    //webcam directive seeks stream form usermedia service
    //onStream, link the stream to the video element's source
    //this should be a directive that receives the stream via a stream-ready event
    //audiorecorderservice should be separate and also respond to stream-ready event
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
    //also for webcam, sets up webcam capture by storing video feed as _video?
    $scope.onSuccess = function () {
        // The video element contains the captured camera data
        _video = $scope.channel.video;
        $scope.$apply(function() {
            //sets dimensions for later image capture
            $scope.patOpts.w = _video.width;
            $scope.patOpts.h = _video.height;
        });
    };

    //for stimulus phase.Grabs image from webcam feed and uploads it
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

    //helper for makeSnapshot
    var getVideoData = function getVideoData( ) {
        var hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = _video.width;
        hiddenCanvas.height = _video.height;
        var ctx = hiddenCanvas.getContext('2d');
        ctx.drawImage(_video, 0, 0, _video.width, _video.height);
        return hiddenCanvas;
    };

    //another helper
    var sendSnapshotToServer = function sendSnapshotToServer(imgBase64) {
        $scope.snapshotData = imgBase64;
    };

    //and another helper
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

    //does what it says. Triggered by phase switch to thank you
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

    //communicates mictestpass. Should happen via events
    $scope.$watch('audioRecorderService.micTestPass', function(){
        if (audioRecorderService.micTestPass){
            $scope.micTestPass = true;
        }
        console.log('micTest Event Received')
    });

    //for validation phase, to change the formatting
    $scope.$watch('validation.speakerTestInput', function(){
        if ($scope.validation.speakerTestInput) {
            $scope.validation.speakerTestInput = $scope.validation.speakerTestInput.toLowerCase().trim();
            if ($scope.validation.speakerTestInput == 'welcome'){
                $scope.borders.speakers = { border: '5px solid green' };
            }
        }
    });

    //hack to prevent numbers from being entered in the participant ID field
    $scope.$watch('sessionData.partId', function(){
       if($scope.sessionData.partId) {
           $scope.sessionData.partId = $scope.sessionData.partId.replace(/\D/g,'');
       }
    });

    //validation of participant/study pair. Should be conditional on a participant's entry. No dummy runs unless the username is "demo"
    $scope.$watch('phase', function(){
        if ($scope.phase == 'stimulus') {
            validateSession();
        }
    })

    //captures player stop time. This seems like the right way to do this. Maybe not the right place.
    $scope.$on('playerTime', function(event, data){
        $scope.sessionData.stopTime = data;
    });

    //maybe this is the way that I am doing the mictest pass. Which would be the right way. Delete the other one I guess.
    $scope.$on('micTestPass', function(event, data){
        $scope.validation.microphone = true;
        $scope.borders.microphone = {border: '5px solid green'};
        $scope.$apply();
    });

    //play validation sound (welcome)
    $scope.playTestSound = function(){
        document.getElementById('audioTest').play();
    }

    //function for switching phase using a button
    $scope.switchToThankYou = function(){
        postSession($scope.sessionData);
        uploadAudio();
        $scope.phase = "thankyou";
    }

    //prompted by switch to thankyou phase
    var postSession = function(sessionData){
        if ($scope.sessionData.studyId != 'demo') {
            $http({
                method: 'POST',
                url: '/api/sessionData',
                data: sessionData,
                headers: {
                    'x-access-token': authentication.token
                }
            })
        }
    }

    //for welcome phase to validate user session
    var validateSession = function(){
        //hacky
        if ($scope.sessionData.studyId != 'demo') {
            $scope.sessionData.partId = parseInt($scope.sessionData.partId);
            $http({
                method: 'POST',
                url: '/api/auth/session',
                data: $scope.sessionData
            }).then(function (res) {
                console.log(res.data.token);
                authentication = res.data;
                //$rootScope.videoUrl = res.data.stimulusUrl;
            })
        }
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
                $scope.phase = "welcome";
                location.reload();
            }
        }
    });

});