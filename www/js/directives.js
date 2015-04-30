angular.module('drive.directives', ['drive.services'])
    .directive('wfTap', function() {
	return function(scope, element, attrs) {
	    element.bind('touchstart', function() {
		scope.$apply(attrs['wfTap']);
	    });
	};
    })
    .directive("ngScopeElement", function () {
	var directiveDefinitionObject = {
	    restrict: "A",
	    compile: function compile(tElement, tAttrs, transclude) {
		return {
		    pre: function preLink(scope, iElement, iAttrs, controller) {
			scope[iAttrs.ngScopeElement] = iElement;
		    }
		};
	    }
	};

	return directiveDefinitionObject;
    })
    .directive('videoPlayer', function($rootScope, $window, $timeout) {
        return {
            restrict: 'E',
            scope: {
		controls: "="
    	    },
	    link: function(scope, element, attrs) {
		scope.video = scope.player[0];
		scope.video.paused = true;
		scope.fileObject = {};
		scope.src = "";
		scope.files;

                scope.video.addEventListener('timeupdate', function() {
		    scope.progress = Math.round(1000 * scope.video.currentTime / scope.video.duration)/10;
		    if ( scope.video.duration - scope.video.currentTime < 1 ) {
			$timeout(function () {
			    scope.video.currentTime = 0;
			}, 1100);
		    }
		    scope.$apply();
		});
		angular.element(scope.video).on('click', function(e) {
		    if (document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled) {
			if (scope.video.requestFullscreen) {
		    	    scope.video.requestFullscreen();
			} else if (scope.video.webkitRequestFullscreen) {
			    scope.video.webkitRequestFullscreen();
			}
		    } else {
		    	document.webkitExitFullscreen();
		    }
		});

            },
            controller: function($scope, $timeout) {
                $scope.playpause = function(base, fileObject, files, nopause) {
		    if (fileObject && (base + fileObject._fileName != $scope.src || nopause)) {
			if ($scope.video.src) {
			    $scope.video.pause();
			    $scope.fileObject.paused = true;
			    $scope.fileObject.progress = 1;
			    $scope.progress = 0;
			}
			$scope.video.src = base + fileObject._fileName;
			$scope.src = base + fileObject._fileName;
			$scope.fileObject = fileObject;
			$scope.files = files;
			$scope.base = base;
		    }
		    if ($scope.video.src) {
			if($scope.video.paused) {
			    $scope.video.play();
			} else {
			    $scope.video.pause();
			}
		    }
		    if ($scope.fileObject) {
			$scope.fileObject.paused = $scope.video.paused;
		    }
		};

		$scope.panelVisible = true;
		$scope.togglePanel = function () {
		    $scope.panelVisible = ! $scope.panelVisible;
		};

		$scope.isPaused = function () {
		    return $scope.video.paused;
		};
		$scope.forward = function (stopOnLast) {
		    var currentIndex = $scope.files.indexOf($scope.fileObject);
		    if (currentIndex < ($scope.files.length - 1) && currentIndex >= 0) {
			$scope.playpause($scope.base, $scope.files[currentIndex + 1], $scope.files, true);
		    } else if (!stopOnLast) {
			$scope.playpause($scope.base, $scope.files[0], $scope.files, true);
		    }
		};
		$scope.back = function () {
		    var currentIndex = $scope.files.indexOf($scope.fileObject);
		    if ($scope.video.currentTime > 1) {
			$scope.playpause($scope.base, $scope.files[currentIndex], $scope.files, true);
		    } else {
			if (currentIndex > 0  && currentIndex < $scope.files.length) {
			    $scope.playpause($scope.base, $scope.files[currentIndex - 1], $scope.files, true);
			} else {
			    $scope.playpause($scope.base, $scope.files[$scope.files.length - 1], $scope.files, true);
			}
		    }
		};

		$scope.controls = {
		    playFile: $scope.playpause,
		    paused: $scope.isPaused,
		    togglePanel: $scope.togglePanel
		};




    //             $scope.currentNum = 0;
    // 		$scope.video.src = $scope.videosrc;
    // 		$scope.volume = {};
    // 		$scope.volume.value = $scope.video.volume;
    // 		$scope.volume.slider = {width: ($scope.volume.value * 100) + "%"};
    // 		$scope.title = $scope.videosrc.substring($scope.videosrc.lastIndexOf('/')+1);
    // 		$scope.playpauseicon = "ion-play";
    //             $scope.playpause = function(){
    // 		    if($scope.video.paused) {
    // 			$scope.video.play();
    // 		    } else {
    // 			$scope.video.pause();
    // 		    }
    // 		};
    // 		$scope.chnageVolume = function () {
    // 		    $scope.video.volume = $scope.volume.value;
    // 		    $scope.volume.slider = {width: ($scope.volume.value * 100) + "%"};
    // 		};
    //             $scope.video.addEventListener('play', function(){
    // 		    $rootScope.$broadcast('video.play', this);
    // 		    $scope.playpauseicon = "ion-pause";
    // 		});
    //             $scope.video.addEventListener('pause', function(){
    // 		    $rootScope.$broadcast('video.pause', this);
    // 		    $scope.playpauseicon = "ion-play";
    // 		});
    //             $scope.video.addEventListener('loadeddata', function(){
    // 		    $scope.duration = secondsToTime($scope.video.duration);
    // 		});
    //             $scope.video.addEventListener('timeupdate', function(){
    // 		    $rootScope.$broadcast('video.time', this);
    // 		    if ($scope.video.currentTime > ($scope.video.duration - 0.5)) {
    // 			$scope.video.currentTime = 0;
    // 			$scope.localTime = 0;
    // 			$scope.video.pause();
    // 		    }
    // 		    if (Math.abs($scope.localTime - $scope.video.currentTime) > 2 && ! document.webkitFullscreenElement) {
    // 			$scope.video.currentTime = $scope.localTime;
    // 		    } else {
    // 			$scope.localTime = $scope.video.currentTime;
    // 		    }
    // 		    $scope.time = secondsToTime($scope.video.currentTime);
    // 		    $scope.progress = {width: String(100 * $scope.video.currentTime / $scope.video.duration) + "%"};
    // 		    $scope.duration = secondsToTime($scope.video.duration);
    // 		});
    //             $scope.video.addEventListener('ended', function(){ $rootScope.$broadcast('video.ended', this); });
    //             $scope.video.addEventListener('webkitfullscreenchange', function () {
    // 		    if (! document.webkitFullscreenElement) {
    // 			StatusBar.show();
    // 		    }
    // 		});

    // 		$scope.fullScreen = function () {
    // 		    StatusBar.hide();
    // 		    if ($scope.video.requestFullscreen) {
    // 		    	$scope.video.requestFullscreen();
    // 		    } else if ($scope.video.mozRequestFullScreen) {
    // 		    	$scope.video.mozRequestFullScreen();
    // 		    } else if ($scope.video.webkitRequestFullscreen) {
    // 		    	$scope.video.webkitRequestFullscreen();
    // 		    }
    // 		};
    //             setInterval(function(){ $scope.$apply(); }, 250);
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
		$scope.progress = 1;
		$scope.paused = true;
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
		$scope.audio.paused = true;
		$scope.fileObject = {};
		$scope.src = "";
		$scope.files;
                $scope.playpause = function(base, fileObject, files, nopause) {
		    if (fileObject && (base + fileObject._fileName != $scope.src || nopause)) {
			if ($scope.audio.src) {
			    $scope.audio.pause();
			    $scope.fileObject.paused = true;
			    $scope.fileObject.progress = 1;
			    $scope.progress = 0;
			}
			$scope.audio.src = base + fileObject._fileName;
			$scope.src = base + fileObject._fileName;
			$scope.fileObject = fileObject;
			$scope.files = files;
			$scope.base = base;
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

		$scope.panelVisible = true;
		$scope.togglePanel = function () {
		    $scope.panelVisible = ! $scope.panelVisible;
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
			    $scope.forward(true);
			}, 1200);
		    }
		    $scope.$apply();
		});
		$scope.isPaused = function () {
		    return $scope.audio.paused;
		};
		$scope.forward = function (stopOnLast) {
		    var currentIndex = $scope.files.indexOf($scope.fileObject);
		    if (currentIndex < ($scope.files.length - 1) && currentIndex >= 0) {
			$scope.playpause($scope.base, $scope.files[currentIndex + 1], $scope.files, true);
		    } else if (!stopOnLast) {
			$scope.playpause($scope.base, $scope.files[0], $scope.files, true);
		    }
		};
		$scope.back = function () {
		    var currentIndex = $scope.files.indexOf($scope.fileObject);
		    if ($scope.audio.currentTime > 1) {
			$scope.playpause($scope.base, $scope.files[currentIndex], $scope.files, true);
		    } else {
			if (currentIndex > 0  && currentIndex < $scope.files.length) {
			    $scope.playpause($scope.base, $scope.files[currentIndex - 1], $scope.files, true);
			} else {
			    $scope.playpause($scope.base, $scope.files[$scope.files.length - 1], $scope.files, true);
			}
		    }
		};

		$scope.controls = {
		    playFile: $scope.playpause,
		    paused: $scope.isPaused,
		    togglePanel: $scope.togglePanel
		};
            },

            templateUrl: 'templates/audio-player-skin.html'
        };
    })
