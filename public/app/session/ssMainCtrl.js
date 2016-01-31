angular.module('app').controller('ssMainCtrl', function($rootScope, $scope, $window, $document, $interval, $http, $location, $sce, audioRecorderService, UM_Event){
    'use strict';

    var ctrl = this;
    $scope.user = {};

    $scope.validation = {};
    //for validation
    //
    //$scope.style = {webcam: '',
    //                    microphone: { border: '5px solid red' },
    //                    speakers: { border: '5px solid red' }};

    //HACK to get studyId from url when or format /run/:studyId
    var urlPath = $location.absUrl().split('/');
    if (urlPath[urlPath.length - 2] == 'run'){
        $scope.sessionData = {studyId: urlPath[urlPath.length - 1]}
    } else {
        $scope.sessionData = {studyId: 'demo'};
    }
    //$scope.sessionData = {studyId: $location.search().studyId || 'demo'};
    $scope.authentication = {};

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
        ctrl.phase = "thankyou";
    }

    $scope.$on('audioDoneEncoding', function(event, data){
        if ($scope.sessionData.studyId != 'demo') {
            var fd = new FormData();
            fd.append('file', data, 'audio.wav');
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
                    console.log("recorderWrapper | Uploaded audio");
                }).error(function () {
                    console.log("recorderWrapper | Audio upload failed");
                });
        }
    });

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
    var authenticateSession = function(){
        //hacky
        if ($scope.sessionData.studyId != 'demo') {
            $scope.sessionData.partId = parseInt($scope.sessionData.partId);
            $http({
                method: 'POST',
                url: '/api/auth/session',
                data: $scope.sessionData
            }).then(function(res) {
                $scope.authentication = res.data;
                $scope.stimulus = res.data.stimulus;
                $scope.$broadcast('stimulusPhase');
                audioRecorderService.API.toggleRecording();
                ctrl.phase = "briefing";
            }, function(res) {
                //TODO use alert instead
                ctrl.phase="authFail";
            })
        }
    }

    //to detect mediaStreamReady and change to welcome phase
    $rootScope.$on(UM_Event.GOTSTREAM, function(event, stream, err){
        if (err){
            console.error(err);
        } else {
            ctrl.phase = 'welcome';

        }
    });

    var stopImg;
    ctrl.phase = "permissions";
    //ctrl.phase = "welcome";

    angular.element($window).on('keydown', function(e) {
        if (e.keyCode == 32) {
            switch(ctrl.phase) {
                case "permissions":
                    ctrl.phase = "welcome";
                    break;
                case "welcome":
                    if (!ctrl.idForm.input.$error.required
                        && $scope.validation.speakerTestInput == 'welcome'
                        && $scope.validation.microphone
                        && $scope.validation.webcam) {
                        authenticateSession();
                    }
                    break;
                case "briefing":
                    ctrl.phase = "stimulus";
                    break;
                case "stimulus":
                    $scope.$broadcast('stopPlayer');
                    $scope.$broadcast('debriefPhase');
                    //TODO maybe figure out separating the audio component one day
                    audioRecorderService.API.toggleRecording();
                    ctrl.phase = "debrief";
                    break;
                case "thankyou":
                        ctrl.phase = "welcome";
                        location.reload();
                    break;
            }
        }
    });

});