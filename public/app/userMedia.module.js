angular.module('userMedia', [])
    .constant('UM_Event', {
        GOTSTREAM: 'gotStream'
    })
    .factory('userMediaService', ['$rootScope', 'UM_Event', function($rootScope, UM_Event){
        var _stream = null;
        var _err = null;

        navigator.getMedia = ( navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
        var mediaConstraint = { video: true, audio: true };
        console.log('userMediaSvc | started');
        if (!_stream) {
            navigator.getMedia(mediaConstraint, onSuccess, onFailure);
        }

        function onSuccess(stream){
            console.log('getUserMedia | Got stream')
            $rootScope.$emit(UM_Event.GOTSTREAM, stream, _err);
            _stream = stream;
        }
        function onFailure(err){
            console.log('getUserMedia | Stream failed')
            _err = err;
        }

        return function(){
            if(_stream || _err){
                console.log('Getusermedia requested');
                //$rootScope.$emit(UM_Event.GOTSTREAM, _err, _stream);
            } else {
                navigator.getMedia(mediaConstraint, onSuccess, onFailure);
                console.log('getusermedia requested with no stream')
            }
        }
    }]);