angular.module('app').controller('videoStreamCtrl', function($scope, $interval, $http) {
    //TODO webcam capture junk needs to be put into a directive?
    var _video = null,
        patData = null;
    $scope.patOpts = {x: 0, y: 0, w: 25, h: 25};

    //from webcam directive for storing data
    $scope.channel = {};

    $scope.webcamError = false;
    $scope.onError = function (err) {
        $scope.$apply(
            function () {
                $scope.webcamError = err;
            }
        );
    };
    var stopSnapshots;

    $scope.$on('stimulusPhase', function(event, data){
        stopSnapshots = $interval(function () {
            $scope.makeSnapshot();
        }, 5000);
    });

    $scope.$on('debriefPhase', function(event, data){
        $interval.cancel(stopSnapshots);
    });

    //webcam directive seeks stream form usermedia service
    //onStream, link the stream to the video element's source
    //this should be a directive that receives the stream via a stream-ready event
    $scope.onStream = function (stream) {
        console.log('videoStreamCtrl | ')
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
        //audioRecorderService.API.initAudio();
    }
    //also for webcam, sets up webcam capture by storing video feed as _video?
    $scope.onSuccess = function () {
        // The video element contains the captured camera data
        _video = $scope.channel.video;
        $scope.$apply(function () {
            //sets dimensions for later image capture
            $scope.patOpts.w = _video.width;
            $scope.patOpts.h = _video.height;
        });
    };


    //for snapshot
    $scope.imageCount = 0;

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
    var getVideoData = function getVideoData() {
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
    function uploadImage(blob) {
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
                        'x-access-token': $scope.authentication.token
                    }
                }).success(function () {
                    console.log("Uploaded image");
                }).error(function () {
                    console.log("Image upload failed");
                });
            $scope.imageCount += 1;
        }
    }

})
