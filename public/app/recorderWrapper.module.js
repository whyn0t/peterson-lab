angular.module('audioRecorder', ['userMedia'])
	.factory('audioRecorderService', ['userMediaService', 'recorderService', '$window', '$rootScope', function(userMediaService, recorderService, $window, $rootScope){

		$window.AudioContext = $window.AudioContext || $window.webkitAudioContext;

		var audioContext = new AudioContext();
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
            console.log("blob = ", blob);
		    //recorderService.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
		    //recIndex++;
            audioData = blob;
            console.log("stored audio data in blob");
		}

		function toggleRecording() {
			//console.log("AudioRecorder: " + audioRecorder.toString());
		    if (recording) {
		        // stop recording
		        audioRecorder.stop();
		        recording = false;
		        audioRecorder.getBuffers( gotBuffers );
                console.log('stopped recording');
		    } else {
		        // start recording
		        if (!audioRecorder)
		            return;
		        recording = true;
		        audioRecorder.clear();
		        audioRecorder.record();
                console.log('recording');
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

		function updateAnalysers(time) {
		    if (!analyserContext) {
		        var canvas = document.getElementById("analyser");
		        canvasWidth = canvas.width;
		        canvasHeight = canvas.height;
		        analyserContext = canvas.getContext('2d');
		    }

		    // analyzer draw code here
		    {
		        var SPACING = 3;
		        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

		        analyserNode.getByteFrequencyData(freqByteData); 

		        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
		        analyserContext.fillStyle = '#F6D565';
		        analyserContext.lineCap = 'round';
		        var numBins = analyserNode.frequencyBinCount;
                var maxDec = analyserNode.maxDecibels;

                var freqSum = 0;
                for (var i = 0; i < numBins; ++i){
                    freqSum += freqByteData[i];
                }
                var freqAvg = freqSum / numBins;
                analyserContext.fillStyle = "hsl( " + Math.round((freqAvg*45)/-maxDec) + ", 100%, 50%)";
                analyserContext.fillRect(0, canvasHeight, canvasWidth, -freqAvg * 2);

                if (freqAvg > 50) {
                    $rootScope.$broadcast('micTestPass');
                }

                /*
		        // Draw rectangle for each frequency bin.
		        for (var i = 0; i < numBars; ++i) {
		            var magnitude = 0;
		            var offset = Math.floor( i * multiplier );
		            // gotta sum/average the block, or we miss narrow-bandwidth spikes
		            for (var j = 0; j< multiplier; j++)
		                magnitude += freqByteData[offset + j];
		            magnitude = magnitude / multiplier;
		            var magnitude2 = freqByteData[i * multiplier];
		            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
		            analyserContext.fillRect(0, canvasHeight, BAR_WIDTH, -magnitude);
		        }
		        */
		    }
		    
		    rafID = $window.requestAnimationFrame( updateAnalysers );
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
		    console.log("AudioRecorder: " + audioRecorder.toString());
		    var zeroGain = audioContext.createGain();
		    zeroGain.gain.value = 0;
		    inputPoint.connect( zeroGain );
		    zeroGain.connect( audioContext.destination );
            // for visualizations
		    updateAnalysers();

		}

		function initAudio() {
			userMediaService(gotStream, function(e) {
		            alert('Error getting audio');
		            console.log(e);
		        });

		}

        function getAudioData(){
            console.log("got audioData");
            return audioData;
        }
		
		return {API: {initAudio: initAudio,
						toggleMono: toggleMono,
						toggleRecording: toggleRecording,
						saveAudio: saveAudio,
                        getAudioData: getAudioData
					},
                micTestPass: micTestPass
				}

	}]);