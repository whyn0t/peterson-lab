angular.module('userMedia', [])
    .constant('UM_Event', {
        GOTSTREAM: 'gotStream'
    })
    .factory('userMediaService', ['$rootScope', 'UM_Event', '$q', function($rootScope, UM_Event, $q){
        var _stream = null;
        var _err = null;

        navigator.getMedia = ( navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
        var mediaConstraint = { video: true, audio: true };
        console.log('userMediaSvc | started');
        navigator.getMedia(mediaConstraint, onSuccess, onFailure);

        function onSuccess(stream){
            console.log('getUserMedia | Got stream')
            //$rootScope.$emit(UM_Event.GOTSTREAM, stream, _err);
            _stream = stream;
        }
        function onFailure(err){
            console.error('getUserMedia | Stream failed')
            _err = err;
        }

        return $q(function(resolve, reject){
            if(_stream){
                resolve(_stream);
            //} else if (_err){
            //    reject(_err);
            } else {
                navigator.getMedia(mediaConstraint,
                    function(stream) {
                        _stream = stream;
                        resolve(stream);
                    },
                    function(err) {
                        _err = err;
                        reject(err);
                    });
            }
        });
    }]);