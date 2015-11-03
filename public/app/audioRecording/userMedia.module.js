angular.module('userMedia', [])
    .factory('userMediaService', function(){
        var liveStream = null;
        var streamErr = null;

        navigator.getMedia = ( navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
        var mediaConstraint = { video: true, audio: true };
        console.log('userMedia service started');
        return function(onSuccess, onFailure){

            function onSuccessLocal(stream){
                console.log('got stream')
                liveStream = stream;
                onSuccess(stream);
            }
            function onFailureLocal(err){
              console.log('stream failed')
                streamErr = err;
                onFailure(err);
            }

            if (!liveStream && !streamErr) {
              navigator.getMedia(mediaConstraint, onSuccessLocal, onFailureLocal);
            }else if (liveStream){
                onSuccess(liveStream);
            } else if (streamErr) {
                onFailure(streamErr);
            } else {
              console.log('userMedia service has failed')
            }
        }
    });