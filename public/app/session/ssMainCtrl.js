angular.module('app').controller('ssMainCtrl', function($rootScope, $scope, $window, $document, $interval, $http, $location, $sce, audioRecorderService, UM_Event, sessionAuth){
    'use strict';

    //VARIABLES
    var ctrl = this;
    $scope.user = {};
    $scope.validation = {};
    $scope.sessionData = {};
    $scope.audioUploaded = false;
    //sessionAuth.then(function (res) {
    //    $scope.sessionData = res.data;
    //    ctrl.instructions = $scope.sessionData.instructions;
    //}, function (res) {
    //    //TODO sessionAuth failed
    //});

    //CALIBRATION VALIDATION
    //for validation phase, to change the formatting
    $scope.$watch('validation.speakerTestInput', function(){
        if ($scope.validation.speakerTestInput) {
            $scope.validation.speakerTestInput = $scope.validation.speakerTestInput.toLowerCase().trim();
            //if ($scope.validation.speakerTestInput == 'welcome'){
            //    $scope.borders.speakers = { border: '5px solid green' };
            //}
        }
    });

    //play validation sound (welcome)
    $scope.playTestSound = function(){
        document.getElementById('audioTest').play();
    };

    //HANDLE A/V DATA
    //captures player stop time. This seems like the right way to do this. Maybe not the right place.
    $scope.$on('playerTime', function(event, data){
        var time = Math.floor( data * 1000 ); //convert to milliseconds and remove decimals
        $scope.sessionData.stopTime = time;
    });

    $scope.$on('audioDoneEncoding', function(event, data){
        if ($scope.sessionData.sid != 'demo') {
            var fd = new FormData();
            fd.append('file', data, 'audio.wav');
            var postUrl = '/api/avData?sid=' + $scope.sessionData.sid + '&pid=' + $scope.sessionData.pid;
            $http.post(postUrl, fd,
                {
                    transformRequest: function (data) {
                        return data;
                    },
                    headers: {
                        'Content-Type': undefined,
                        'x-access-token': $scope.sessionData.token
                    }
                }).success(function () {
                    console.log("recorderWrapper | Uploaded audio");
                    $scope.audioUploaded = true;
                }).error(function () {
                    console.log("recorderWrapper | Audio upload failed");
                });
        }
    });

    //PHASE CONTROL
    //TODO put phase control in a service?

    //ensure the audio has been uploaded before redirecting to the post-survey
    $scope.$watch('audioUploaded', function(){
        if ( $scope.audioUploaded && ctrl.phase == 'debrief' ){
            $location.path($scope.sessionData.redirect).search({
                sid: $scope.sessionData.sid,
                pid: $scope.sessionData.pid,
                stopTime: $scope.sessionData.stopTime
            });
        }
    });
    $scope.$on('debriefPhase', function(){
        if ( $scope.audioUploaded ){
            $location.path($scope.sessionData.redirect).search({
                sid: $scope.sessionData.sid,
                pid: $scope.sessionData.pid,
                stopTime: $scope.sessionData.stopTime
        });
        }
    });

    //to detect mediaStreamReady and change to welcome phase
    $rootScope.$on(UM_Event.GOTSTREAM, function(event, stream, err){
        if (err){
            console.error(err);
        } else {
            ctrl.phase = 'welcome';

        }
    });

    $rootScope.$on("FFORCHROME", function(event, stream, err){ //TODO is there a need for all of these parameters?
        if (err){
            console.error(err);
        } else {
            //authenticate the session
            sessionAuth.then(function (res) {
                $scope.sessionData = res.data;
                ctrl.instructions = $scope.sessionData.instructions;
                ctrl.phase = 'permissions';
            }, function (res) {
                ctrl.phase = 'invalid-url';
            });

        }
    });

    var stopImg;
    ctrl.phase = "browser-detect";

    angular.element($window).on('keydown', function(e) {
        if (e.keyCode == 32) {
            switch(ctrl.phase) {
                case "welcome":
                    if ($scope.validation.speakerTestInput == 'welcome'
                    && $scope.validation.microphone
                    && $scope.validation.webcam) {
                        ctrl.phase = "briefing";
                    }
                    break;
                case "briefing":
                    $scope.$broadcast('stimulusPhase');
                    audioRecorderService.API.toggleRecording();
                    ctrl.phase = "stimulus";
                    break;
                case "stimulus":
                    $scope.$broadcast('stopPlayer');
                    $scope.$broadcast('debriefPhase');
                    //TODO maybe figure out separating the audio component one day
                    audioRecorderService.API.toggleRecording();
                    ctrl.phase = "debrief";
                    break;
                ////deprecated
                //case "thankyou":
                //        ctrl.phase = "welcome";
                //        location.reload();
                //    break;
            }
        }
    });

});