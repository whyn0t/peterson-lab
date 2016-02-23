angular.module('app').controller('audioStreamCtrl', function($scope, audioRecorderService) {
    /*
    $scope.$on('stimulusPhase', function(event, data){
        audioRecorderService.API.toggleRecording();
        console.log("audioStreamCtrl | audio recording started");
    });

    $scope.$on('$debriefPhase', function(event, data){
        audioRecorderService.API.toggleRecording();
        console.log("audioStreamCtrl | audio recording stopped");
        uploadAudio();
    });

    //does what it says. Triggered by phase switch to thank you
    function uploadAudio(){
        if ($scope.sessionData.sid != 'demo') {
            var fd = new FormData();
            fd.append('file', audioRecorderService.API.getAudioData(), 'audio.wav');
            var postUrl = '/api/avData?sid=' + $scope.sessionData.sid + '&pid=' + $scope.sessionData.pid;
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
    */

    $scope.$on('micTestPass', function(event, data){
        $scope.validation.microphone = true;
        $scope.$apply();
    });
});

