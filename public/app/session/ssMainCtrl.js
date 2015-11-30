angular.module('app').controller('ssMainCtrl', function($scope, $window, $document, $interval, $http, $location, audioRecorderService){
    'use strict';

    var ctrl = this;
    $scope.user = {};

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
    $scope.authentication = {};



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
                        'x-access-token': $scope.authentication.token
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

    //maybe this is the way that I am doing the mictest pass. Which would be the right way. Delete the other one I guess.
    $scope.$on('micTestPass', function(event, data){
        $scope.validation.microphone = true;
        $scope.borders.microphone = {border: '5px solid green'};
        $scope.$apply();
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

    //play validation sound (welcome)
    $scope.playTestSound = function(){
        document.getElementById('audioTest').play();
    }

    //function for switching phase using a button
    $scope.switchToThankYou = function(){
        postSession($scope.sessionData);
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
                    'x-access-token': $scope.authentication.token
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
                $scope.authentication = res.data;
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

                $scope.$broadcast('stimulusPhase');
                //start video capture
                //audioRecorderService.API.toggleRecording();
                //$scope.makeSnapshot();
                //stopImg = $interval(function () {
                 //   $scope.makeSnapshot();
                //}, 5000);
                //start audio capture
                $scope.phase = "stimulus";
            } else if ($scope.phase == "stimulus") {
                $scope.$broadcast('debriefPhase', $scope.sessionData.studyId, $scope.sessionData.partId, $scope.authentication);
                $scope.$broadcast('stopPlayer');
                //audioRecorderService.API.toggleRecording();
                //$interval.cancel(stopImg);
                $scope.phase = "debrief";
            } else if ($scope.phase == "thankyou") {
                $scope.phase = "welcome";
                location.reload();
            }
        }
    });

});