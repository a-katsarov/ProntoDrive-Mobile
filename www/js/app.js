// Ionic Drive App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'drive' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('drive', ['ngCordova', 'ionic', 'drive.controllers', 'drive.filters', 'drive.services', 'drive.directives', 'angular-progress-arc'])
    .run(function($ionicPlatform, DB, XIMSS, $rootScope) {
	DB.init();
	XIMSS.init();
	$ionicPlatform.ready(function() {
	    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
	    // for form inputs)
	    if(window.cordova && window.cordova.plugins.Keyboard) {
		cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	    }
	    if(window.StatusBar) {
		StatusBar.styleDefault();
	    }
	    document.addEventListener("menubutton", function () {
		$rootScope.$broadcast('hwMenu');
	    }, false);
	});
    })
    . config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/home/')
	$stateProvider
	    .state('home', {
		url: '/home/{path:.*}',
		templateUrl: 'templates/home.html',
		controller: 'HomeCtrl'
	    })
	    .state('imageviewer', {
		url: '/imageviewer/{index:.*}',
		templateUrl: 'templates/image-viewer.html',
		controller: 'ImageViewerCtrl'
	    })
    })