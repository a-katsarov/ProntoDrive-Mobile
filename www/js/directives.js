angular.module('drive.directives', [])
    .directive('wfTap', function() {
	return function(scope, element, attrs) {
	    element.bind('touchstart', function() {
		scope.$apply(attrs['wfTap']);
	    });
	};
    })
    .directive('videoPlayer', function($rootScope) {
        return {
            restrict: 'E',
            scope: {
		videosrc: "=videosrc"
	    },
            controller: function($scope, $element, $window, $timeout) {
                $scope.video = angular.element(document.querySelector( '#videoPlayer' ))[0];
                $scope.currentNum = 0;
		$scope.video.src = $scope.videosrc;
		$scope.volume = {};
		$scope.volume.value = $scope.video.volume;
		$scope.volume.slider = {width: ($scope.volume.value * 100) + "%"};
		$scope.title = $scope.videosrc.substring($scope.videosrc.lastIndexOf('/')+1);
		$scope.playpauseicon = "ion-play";
                $scope.playpause = function(){
		    if($scope.video.paused) {
			$scope.video.play();
		    } else {
			$scope.video.pause();
		    }
		};
		$scope.chnageVolume = function () {
		    $scope.video.volume = $scope.volume.value;
		    $scope.volume.slider = {width: ($scope.volume.value * 100) + "%"};
		};
                $scope.video.addEventListener('play', function(){
		    $rootScope.$broadcast('video.play', this);
		    $scope.playpauseicon = "ion-pause";
		});
                $scope.video.addEventListener('pause', function(){
		    $rootScope.$broadcast('video.pause', this);
		    $scope.playpauseicon = "ion-play";
		});
                $scope.video.addEventListener('loadeddata', function(){
		    $scope.duration = secondsToTime($scope.video.duration);
		});
                $scope.video.addEventListener('timeupdate', function(){
		    $rootScope.$broadcast('video.time', this);
		    if ($scope.video.currentTime > ($scope.video.duration - 0.5)) {
			$scope.video.currentTime = 0;
			$scope.localTime = 0;
			$scope.video.pause();
		    }
		    if (Math.abs($scope.localTime - $scope.video.currentTime) > 2 && ! document.webkitFullscreenElement) {
			$scope.video.currentTime = $scope.localTime;
		    } else {
			$scope.localTime = $scope.video.currentTime;
		    }
		    $scope.time = secondsToTime($scope.video.currentTime);
		    $scope.progress = {width: String(100 * $scope.video.currentTime / $scope.video.duration) + "%"};
		    $scope.duration = secondsToTime($scope.video.duration);
		});
                $scope.video.addEventListener('ended', function(){ $rootScope.$broadcast('video.ended', this); });
                $scope.video.addEventListener('webkitfullscreenchange', function () {
		    if (! document.webkitFullscreenElement) {
			StatusBar.show();
		    }
		});

		$scope.fullScreen = function () {
		    StatusBar.hide();
		    if ($scope.video.requestFullscreen) {
		    	$scope.video.requestFullscreen();
		    } else if ($scope.video.mozRequestFullScreen) {
		    	$scope.video.mozRequestFullScreen();
		    } else if ($scope.video.webkitRequestFullscreen) {
		    	$scope.video.webkitRequestFullscreen();
		    }
		};
                setInterval(function(){ $scope.$apply(); }, 250);
            },

            templateUrl: 'templates/video-player-skin.html'
        };
    })
    .directive('inlineAudio', function($rootScope) {
        return {
            restrict: 'E',
            scope: {
		size: "@size",
		paused: "=",
		progress: "="
	    },
            controller: function($scope, $element, $window, $timeout) {
                // $scope.audio = new Audio($scope.audiosrc.replace(/\/+/g,"/"));
		// $scope.audio.src = $scope.audiosrc.replace("file://","");
		$scope.progress = 1;
		$scope.paused = true;
                // $scope.playpause = function() {
		//     if($scope.audio.paused) {
		// 	$scope.audio.play();
		//     } else {
		// 	$scope.audio.pause();
		//     }
		// };

                // $scope.audio.addEventListener('timeupdate', function(){
		//     $rootScope.$broadcast('audio.time', this);
		//     $scope.progress = 1 - (Math.round(100 * $scope.audio.currentTime / $scope.audio.duration) / 100);
		//     if ( $scope.audio.duration - $scope.audio.currentTime < 1 ) {
		// 	$timeout(function () {
		// 	    $scope.progress = 1;
		// 	    $scope.audio.currentTime = 0;
		// 	    if ($scope.audio.stop)
		// 		$scope.audio.stop();
		// 	}, 2000);
		//     }
		//     $scope.$apply();
		// });
		// $scope.controls = {
		//     playpause: $scope.playpause
		// };

	    },
            templateUrl: 'templates/inline-audio.html'
	}
    })
    .directive('audioPlayer', function($rootScope) {
        return {
            restrict: 'E',
            scope: {
		controls: "="
	    },
            controller: function($scope, $element, $window, $timeout) {
                $scope.audio = new Audio();
		$scope.fileObject = {};
		$scope.src = "";
		$scope.files;
                $scope.playpause = function(base, fileObject, files) {
		    if (fileObject && base + fileObject._fileName != $scope.src) {
			if ($scope.audio.src) {
			    $scope.audio.pause();
			    $scope.fileObject.paused = true;
			    $scope.fileObject.progress = 1;
			    $scope.progress = 0;
			    $scope.files = files;
			}
			$scope.audio.src = base + fileObject._fileName;
			$scope.src = base + fileObject._fileName;
			$scope.fileObject = fileObject;
		    }
		    if ($scope.audio.src) {
			if($scope.audio.paused) {
			    $scope.audio.play();
			} else {
			    $scope.audio.pause();
			}
		    }
		    if ($scope.fileObject) {
			$scope.fileObject.paused = $scope.audio.paused;
		    }
		};
                $scope.audio.addEventListener('timeupdate', function(){
		    $rootScope.$broadcast('audio.time', this);
		    if ($scope.fileObject) {
			$scope.fileObject.progress = 1 - (Math.round(100 * $scope.audio.currentTime / $scope.audio.duration) / 100);
			$scope.progress = Math.round(1000 * $scope.audio.currentTime / $scope.audio.duration)/10;
		    }
		    if ( $scope.audio.duration - $scope.audio.currentTime < 1 ) {
			$timeout(function () {
			    $scope.audio.currentTime = 0;
			    if ($scope.fileObject) {
				$scope.fileObject.paused = true;
				$scope.progress = 0;
				$scope.fileObject.progress = 1;
			    }
			    if ($scope.audio.stop)
				$scope.audio.stop();
			}, 2000);
		    }
		    $scope.$apply();
		});
		$scope.controls = {
		    playFile: $scope.playpause,
		    paused: $scope.audio.paused
		};
                // $scope.audio = angular.element(document.querySelector( '#audioPlayer' ))[0];
                // //$scope.audio = new ;
                // $scope.currentNum = 0;
		// $scope.audio.src = $scope.audiosrc;
		// $scope.volume = {};
		// $scope.volume.value = $scope.audio.volume;
		// $scope.volume.slider = {width: ($scope.volume.value * 100) + "%"};
		// $scope.title = $scope.audiosrc.substring($scope.audiosrc.lastIndexOf('/')+1);

                // // tell audio element to play/pause, you can also use $scope.audio.play() or $scope.audio.pause();
		// $scope.playpauseicon = "ion-play";
                // $scope.playpause = function(){
		//     if($scope.audio.paused) {
		// 	$scope.audio.play();
		// 	$scope.playpauseicon = "ion-pause";
		//     } else {
		// 	$scope.audio.pause();
		// 	$scope.playpauseicon = "ion-play";
		//     }
		// };
		// $scope.chnageVolume = function () {
		//     $scope.audio.volume = $scope.volume.value;
		//     $scope.volume.slider = {width: ($scope.volume.value * 100) + "%"};
		// };
                // // listen for audio-element events, and broadcast stuff
                // $scope.audio.addEventListener('play', function(){ $rootScope.$broadcast('audio.play', this); });
                // $scope.audio.addEventListener('pause', function(){ $rootScope.$broadcast('audio.pause', this); });
                // $scope.audio.addEventListener('loadeddata', function(){
		//     $scope.duration = secondsToTime($scope.audio.duration);
		// });
                // $scope.audio.addEventListener('timeupdate', function(){
		//     $rootScope.$broadcast('audio.time', this);
		//     if (Math.abs($scope.localTime - $scope.audio.currentTime) > 2) {
		// 	$scope.audio.currentTime = $scope.localTime;
		//     } else {
		// 	$scope.localTime = $scope.audio.currentTime;
		//     }
		//     $scope.time = secondsToTime($scope.audio.currentTime);
		//     $scope.progress = {width: String(100 * $scope.audio.currentTime / $scope.audio.duration) + "%"};
		//     $scope.duration = secondsToTime($scope.audio.duration);
		// });
                // $scope.audio.addEventListener('ended', function(){ $rootScope.$broadcast('audio.ended', this); });
                // setInterval(function(){ $scope.$apply(); }, 500);
            },

            templateUrl: 'templates/audio-player-skin.html'
        };
    })

var secondsToTime = function (seconds) {
    var hours   = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = Math.floor(seconds - (hours * 3600) - (minutes * 60));
    var time = "";

    if (hours != 0) {
	time = String(hours) + ":";
    }
    if (time === "") {
	minutes = (minutes < 10 && time !== "") ? "0" + String(minutes) : String(minutes);
	time += minutes+":";
	time += (seconds < 10) ? "0" + String(seconds) : String(seconds);
    }
    return time;
}
