angular.module('app').controller('liveStreamCtrl', function($scope) {

    //TODO should be a directive
    $scope.$on('snapshotCtrlOnStream' ,function (event, stream) {
        var videoElem = document.querySelector('#webcam-live');
        // Firefox supports a src object
        if (navigator.mozGetUserMedia) {
            videoElem.mozSrcObject = stream;
            console.log(stream);
        } else {
            var vendorURL = window.URL || window.webkitURL;
            videoElem.src = vendorURL.createObjectURL(stream);
        }
    });
});
