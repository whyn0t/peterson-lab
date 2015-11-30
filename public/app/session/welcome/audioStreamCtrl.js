angular.module('app').controller('audioStreamCtrl', function($scope, audioRecorderService) {

    $scope.$on('stimulusPhase', function(event, data){
        audioRecorderService.API.toggleRecording();
    });

    $scope.$on('$debriefPhase', function(event, studyId, partId, authentication){
        audioRecorderService.API.toggleRecording();
        uploadAudio(studyId, partId, authentication);
    });

    //does what it says. Triggered by phase switch to thank you
    function uploadAudio(studyId, partId, authentication){
        if ($scope.sessionData.studyId != 'demo') {
            var fd = new FormData();
            fd.append('file', audioRecorderService.API.getAudioData(), 'audio.wav');
            var postUrl = '/api/avData?studyId=' + studyId + '&partId=' + partId;
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

    //maybe this is the way that I am doing the mictest pass. Which would be the right way. Delete the other one I guess.
    $scope.$on('micTestPass', function(event, data){
        $scope.validation.microphone = true;
        $scope.borders.microphone = {border: '5px solid green'};
        $scope.$apply();
    });
});

