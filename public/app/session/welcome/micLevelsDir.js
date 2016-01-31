angular.module('app')
    .directive('micLevels', ['$rootScope', '$window', 'audioRecorderService', function($rootScope, $window, audioRecorderService) {
        function link (scope, element, attrs){

            var rafID = null;
            var analyserContext = null;
            //TODO try initializing the analyser node once here
            var analyserNode = null;
            function nodeRefresh(){
                analyserNode = audioRecorderService.API.getAnalyserNode();
            }

            var canvas = document.getElementById("analyser");
            canvasWidth = canvas.width;
            canvasHeight = canvas.height;
            analyserContext = canvas.getContext('2d');
            rafID = $window.requestAnimationFrame( updateAnalysers );

            function updateAnalysers(){
                nodeRefresh();
                var SPACING = 3;
                var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

                analyserNode.getByteFrequencyData(freqByteData);

                analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
                analyserContext.fillStyle = '#F6D565';
                analyserContext.lineCap = 'round';
                var numBins = analyserNode.frequencyBinCount;
                var maxDec = analyserNode.maxDecibels;

                var freqSum = 0;
                for (var i = 0; i < numBins; ++i) {
                    freqSum += freqByteData[i];
                }
                var freqAvg = freqSum / numBins;
                analyserContext.fillStyle = "hsl( " + Math.round((freqAvg * 45) / -maxDec) + ", 100%, 50%)";
                analyserContext.fillRect(0, canvasHeight, canvasWidth, -freqAvg * 2);

                if (freqAvg > 50) {
                    $rootScope.$broadcast('micTestPass');
                }

                $window.requestAnimationFrame( updateAnalysers );
            }

            var onDestroy = function() {
                $window.cancelAnimationFrame( rafID );
                rafID = null;
            }

            //scope.on('$destroy', onDestroy);
        }

        return {
            restrict: 'E',
            template: "<div><canvas id='analyser'><canvas/></div>",
            link: link
        }
    }]);