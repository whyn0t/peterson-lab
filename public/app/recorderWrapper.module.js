angular.module('audioRecorder', ['userMedia'])
	.factory('audioRecorderService', ['userMediaService', 'UM_Event', 'recorderService', '$window', '$rootScope', function(userMediaService, UM_Event, recorderService, $window, $rootScope){

		//$window.AudioContext = $window.AudioContext || $window.webkitAudioContext;
        $window.AudioContext = $window.AudioContext;

		var audioContext = new $window.AudioContext();
		var audioInput = null,
		    realAudioInput = null,
		    inputPoint = null,
		    audioRecorder = null,
            micTestPass = false,
            audioData = null;
		var rafID = null;
		var analyserContext = null;
		var canvasWidth, canvasHeight;
		var recIndex = 0;
		var recording = false;
        var analyserNode = null;

        userMediaService
            .then(function(stream){
                gotStream(stream);
            });

        function gotStream(stream) {

            inputPoint = audioContext.createGain();

            // Create an AudioNode from the stream.
            realAudioInput = audioContext.createMediaStreamSource(stream);
            audioInput = realAudioInput;
            audioInput.connect(inputPoint);

            //    audioInput = convertToMono( input );

            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 2048;
            inputPoint.connect( analyserNode );

            audioRecorder = new recorderService( inputPoint );
            var zeroGain = audioContext.createGain();
            zeroGain.gain.value = 0;
            inputPoint.connect( zeroGain );
            zeroGain.connect( audioContext.destination );
            // for visualizations
            //updateAnalysers();

        }

        var getAnalyserNode = function(){
            return analyserNode;
        }

        //function updateAnalysers(time) {
        //    //TODO service modifying DOM is a big nono. Need to put this in a directive. Hack for now!
        //    if (document.getElementById("analyser")) {
        //        if (!analyserContext) {
        //            var canvas = document.getElementById("analyser");
        //            canvasWidth = canvas.width;
        //            canvasHeight = canvas.height;
        //            analyserContext = canvas.getContext('2d');
        //        }
        //
        //        // analyzer draw code here
        //        {
        //            var SPACING = 3;
        //            var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
        //
        //            analyserNode.getByteFrequencyData(freqByteData);
        //
        //            analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        //            analyserContext.fillStyle = '#F6D565';
        //            analyserContext.lineCap = 'round';
        //            var numBins = analyserNode.frequencyBinCount;
        //            var maxDec = analyserNode.maxDecibels;
        //
        //            var freqSum = 0;
        //            for (var i = 0; i < numBins; ++i) {
        //                freqSum += freqByteData[i];
        //            }
        //            var freqAvg = freqSum / numBins;
        //            analyserContext.fillStyle = "hsl( " + Math.round((freqAvg * 45) / -maxDec) + ", 100%, 50%)";
        //            analyserContext.fillRect(0, canvasHeight, canvasWidth, -freqAvg * 2);
        //
        //            if (freqAvg > 50) {
        //                $rootScope.$broadcast('micTestPass');
        //            }
        //        }
        //    }
        //    rafID = $window.requestAnimationFrame( updateAnalysers );
        //}

		function saveAudio() {
		    audioRecorder.exportWAV( doneEncoding );
		    console.log("AudioRecorder: " + audioRecorder.toString());
            // could get mono instead by saying
		    //audioRecorder.exportMonoWAV( doneEncoding );
		}

		function gotBuffers( buffers ) {
		    //var canvas = document.getElementById( "wavedisplay" );

		    //drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

		    // the ONLY time gotBuffers is called is right after a new recording is completed - 
		    // so here's where we should set up the download.
		    audioRecorder.exportWAV( doneEncoding );
		}

		function doneEncoding( blob ) {
		    //recorderService.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
		    //recIndex++;
            audioData = blob;
            $rootScope.$broadcast('audioDoneEncoding', blob);
		}

		function toggleRecording() {
			//console.log("AudioRecorder: " + audioRecorder.toString());
		    if (recording) {
		        // stop recording
		        audioRecorder.stop();
		        recording = false;
		        audioRecorder.getBuffers( gotBuffers );
                console.log('recorderWrapper | stopped recording');
		    } else {
		        // start recording
		        if (!audioRecorder)
		            return;
		        recording = true;
		        audioRecorder.clear();
		        audioRecorder.record();
                console.log('recorderWrapper | started recording');
		    }
		}

		function convertToMono( input ) {
		    var splitter = audioContext.createChannelSplitter(2);
		    var merger = audioContext.createChannelMerger(2);

		    input.connect( splitter );
		    splitter.connect( merger, 0, 0 );
		    splitter.connect( merger, 0, 1 );
		    return merger;
		}

		function cancelAnalyserUpdates() {
		    $window.cancelAnimationFrame( rafID );
		    rafID = null;
		}

		function toggleMono() {
		    if (audioInput != realAudioInput) {
		        audioInput.disconnect();
		        realAudioInput.disconnect();
		        audioInput = realAudioInput;
		    } else {
		        realAudioInput.disconnect();
		        audioInput = convertToMono( realAudioInput );
		    }

		    audioInput.connect(inputPoint);
		}

        function getAudioData(){
            return audioData;
        }
		
		return {API: {toggleMono: toggleMono,
						toggleRecording: toggleRecording,
						saveAudio: saveAudio,
                        getAudioData: getAudioData,
                        getAnalyserNode: getAnalyserNode
					},
                micTestPass: micTestPass
				}

	}]);