angular.module('drive.controllers', [])
    .controller('AppCtrl', function($scope, $ionicModal, $ionicPlatform, Accounts, $cordovaToast, XIMSS, $prefs) {
	$scope.iface = {};
	$scope.iface.search = false;
	$scope.iface.searchString = "";
	$scope.openAccountsModal = function () {
	    $ionicModal.fromTemplateUrl('templates/accounts.html', {
		scope: $scope,
		animation: 'slide-in-up'
	    }).then(function(modal) {
		$scope.accountsModal = modal;
		$scope.accountsModal.show();
	    });
	}
	$scope.closeAccountsModal = function () {
	    $scope.accountsModal.remove();
	}

	$ionicPlatform.ready(function() {
	    Accounts.all().then(
		function (accounts) {
		    if (! accounts[0]) {
			$scope.addAccount();
		    }
		},
		function (error) {
		    $cordovaToast.show(error, 'long', 'bottom');
		}
	    );
	});
	// Global account management functions
	// show add account dialg
	$scope.addAccount = function () {
	    $scope.accountData = {};
	    $scope.accountData.useSSL = true;
	    $ionicModal.fromTemplateUrl('templates/addAccount.html', {
		scope: $scope,
		animation: 'slide-in-up',
		backdropClickToClose: false,
		hardwareBackButtonClose: false
	    }).then(function(modal) {
		$scope.addAccountsModal = modal;
		if ($scope.accountsModal && $scope.accountsModal.isShown()) {
		    $scope.accountsModal.hide();
		}
		$scope.addAccountsModal.show();
	    });
	};
	// close add account dialog
	$scope.closeAddAccountModal = function () {
	    $scope.addAccountsModal.remove();
	    if ($scope.accountsModal) {
		$scope.accountsModal.remove();
	    }
	};
	// add the account
	$scope.doAddAccount = function () {
	    var account = $scope.accountData.accountName;
	    var server = $scope.accountData.accountServer;
	    var password = $scope.accountData.accountPassword;
	    var ssl = $scope.accountData.useSSL;
	    if (! server ) {
		server = account.split("@")[1];
	    }
	    XIMSS.checkAccount(account, server, password, ssl).then(
		function () {
		    Accounts.add(account, server, password, ssl).then(function (response) {
		    	$scope.closeAddAccountModal();
		    	$cordovaToast.show("Account added.", 'long', 'bottom');
			Accounts.lastAdded().then(function (response) {
			    $prefs.set("lastUsedAccount", response["last_insert_rowid()"]);
			    $scope.$broadcast('forceReload');
			});
		    });
		},
		function (error) {
		    $cordovaToast.show(error, 'long', 'bottom');
		}
	    );
	};
	$scope.$on('forceReloadAll', function(event, args) {
	    $scope.$broadcast('forceReload');
	});
	// Readable file size
	$scope.sizeReadable = function (bytes) {
	    if(bytes == 0 || ! bytes) return '0B';
	    var k = 1024;
	    var sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	    var i = Math.floor(Math.log(bytes) / Math.log(k));
	    return Math.round(10 * bytes / Math.pow(k, i))/10  + sizes[i];
	};
    })
    .controller('HomeCtrl', function($scope, $stateParams, $ionicActionSheet, $ionicPlatform, $ionicLoading, basePath, XIMSS, $timeout, $filter, $cordovaFile, $prefs, $ionicScrollDelegate, $ionicPopup, $cordovaFileTransfer, $cordovaToast, Accounts, $cordovaClipboard, $ionicModal, Opener, Downloader, $rootScope, $state) {
	$scope.searches = {};
	$scope.path = $stateParams.path;
	var folders = $scope.path.split("/");
	$scope.title = folders[folders.length - 2] || 'Pronto!Drive';
	$scope.iface.grid = false;
	// List folders
	$scope.listFolder = function () {
	    // Start with simple debounce
	    var now = new Date().getTime();
	    if ($scope.listFolderDebounce && now - $scope.listFolderDebounce < 300) {
		return;
	    }
	    $scope.listFolderDebounce = now;
	    basePath.updateBase();
	    $ionicLoading.show({
	    	templateUrl: 'templates/loading.html'
	    });
	    XIMSS.folderListing($stateParams.path || "").then(
		function (folderItems) {
		    $scope.$broadcast('scroll.refreshComplete');
		    $timeout($ionicLoading.hide, 100);
		    $scope.requestComplete = true;
		    $scope.noConnection = false;
		    if (folderItems && folderItems[0])
			var items = folderItems.sort(compareFilesAndFolders);
		    if (! $stateParams.path) {
		    	items = $filter('filter')(items, function (item, index) {
		    	    if (item._directory == "private/" && (item._fileName == "IM" || item._fileName == "_upload" || item._fileName == "settings" || item._fileName == "logs"))
		    		return false;
		    	    return true;
		    	});
			XIMSS.checkSubsRequests().then(
			    function (result) {
				$scope.subsAlets = result;
			    }
			);
		    }
		    $scope.folderItems = items;
		    $timeout(function () {
			$scope.folderItems = $scope.findLocal(items);
		    });
		    // $scope.listSubscriptions();
		},
		function (error) {
		    $scope.$broadcast('scroll.refreshComplete');
		    $timeout($ionicLoading.hide, 100);
		    $scope.requestComplete = true;
		    if (error == 0) {
			$scope.noConnection = true;
		    }
		    $scope.folderItems = []; // Empty the folder items for the current view
		    // $scope.listSubscriptions(); // List subscriptions even if no files
		}
	    );
	};
	// Find local files
	$scope.findLocal = function (fileList) {
	    if (fileList && fileList.length) {
		// Get shared files
 		XIMSS.getAllAttributes(fileList).then(
		    function (response) {
			if (response)
			    for (var i = 0; i < response.length; i++) {
				if (response[i].ACL) {
				    fileList[response[i]._id].acl = response[i].ACL;
				}
				if (response[i].accessPwd) {
				    fileList[response[i]._id].shared = response[i].accessPwd.key;
				}
			    }
		    },
		    function (error) {
			// $cordovaToast.show(error, 'long', 'bottom');
		    }
		);
		// Get folders sizes
 		XIMSS.getFoldersInfo(fileList).then(
		    function (response) {
			$scope.folderSize = {};
			if (response) {
			    for (var i = 0; i < response.length; i++) {
				var splitPath = response[i]._directory.split("/");
				var name = splitPath[splitPath.length - 1];
				$scope.folderSize[name] = response[i]._size;
			    }
			}
		    }
		);
	    }
	    // Find local downloaded files
	    angular.forEach(fileList, function(value, key) {
	    	var fullpath = basePath.base + $scope.path + value._fileName;
	    	$cordovaFile.checkFile(fullpath.replace("file://", "")).then(
	    	    function (res) {
	    		value.local = true;
			var ext = value._fileName.substring(value._fileName.lastIndexOf('.')+1);
			if ($scope.checkAudioFormat(ext)) {
			    value.audioplay = basePath.base + $scope.path + value._fileName;
			}
	    	    }
	    	);
	    });
	    return fileList;
	};

	// $scope.dateReadable = function (XIMSSdate) {
	//     if (XIMSSdate)
	// 	return XIMSSdate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/i, "$3/$2/$1 $4:$5");
	//     return "";
	// };

	// Get icon types
	$scope.getIcon = function (item) {
	    if (item) {
		var name = item._fileName || item.name;
		if (item._type == "directory" || item.isDirectory) return "ion-folder positive";
		if (name.match(/\.(png|jpg|jpeg|gif|bmp|tif|tiff|svg|psd)$/i))
		    return "fa fa-file-image-o";
		if (name.match(/\.(mp3|ogg|wav|flac|acc|oga|m4a)$/i)) {
		    return "fa fa-file-audio-o";
		}
		if (name.match(/\.(avi|mpeg|mp4|mov|ogv|webm|flv|mpg)$/i))
		    return "fa fa-file-video-o";
		if (name.match(/\.(zip|tar|tgz|bz|gz|7z|arj|rar)$/i))
		    return "fa fa-file-archive-o";
		if (name.match(/\.(xml|html|htm)$/i))
		    return "fa fa-file-code-o";
		if (name.match(/\.(pdf)$/i))
		    return "fa fa-file-pdf-o icon-color-pdf";
		if (name.match(/\.(apk)$/i))
		    return "fa fa-android  icon-color-android";
		if (name.match(/\.(txt)$/i))
		    return "fa fa-file-text-o";
		if (name.match(/\.(doc|docx|odt|ott|fodt|uot|rdf|dot)$/i))
		    return "fa fa-file-word-o icon-color-word";
		if (name.match(/\.(xls|ods|ots|fods|uos|xlsx|xlt|csv)$/i))
		    return "fa fa-file-excel-o icon-color-excel";
		if (name.match(/\.(odp|otp|fodp|ppt|pptx|ppsx|potm|pps|pot)$/i))
		    return "fa fa-file-powerpoint-o icon-color-powerpint";
	    }
	    return "fa fa-file-o";
	};

	$scope.showGlobalAction = function () {
	    $scope.hideGlobalAction = $ionicActionSheet.show({
		buttons: [
		    {text: "Create folder"},
		    {text: "Upload file"}
		],
		cancelText: 'Cancel',
		buttonClicked: function(index) {
		    if (index == 0) {
			$scope.createFolder($scope.path);
		    } else if ( index == 1 ) {
			$scope.uploadHere($scope.path);
		    }
		    $scope.hideGlobalAction();
		}
	    });
	};


	$scope.fileAction = function (file) {
	    var fullPath = file._fileName;
	    if ($stateParams.path) {
		fullPath = $stateParams.path + "/" + file._fileName;
	    }
	    fullPath = basePath.base + fullPath;
	    var buttons = [];
	    var baseIndex = 0;
	    var hideSheet;
	    // If it is a file
	    if (file._size) {
		var actionOptions = {};
		if (file._directory.match(/^~/)) {
		    if (file.subscription) {
			buttons.push({text: "Unsubscribe"});
			baseIndex = 1;
		    } else {
		    baseIndex = 2;
		    }
		} else {
		    buttons.push({text: "Access control"});
		    buttons.push({text: "Share"});
		}
		// Define file action options
		actionOptions = {
		    buttons: buttons,
		    titleText: file._fileName,
		    cancelText: 'Cancel',
		    buttonClicked: function(index) {
			if (baseIndex + index == 0) {
			    $scope.showUpdateACL(file);
			} else if (baseIndex + index == 1) {
			    if (file.subscription) {
				$scope.unsubscribe(file);
			    } else {
				$scope.updateAccessPwd(file);
			    }
			} else if (baseIndex + index == 2) {
			    Downloader.download(file, fullPath, $scope).then(
				function (result) {
				    $cordovaToast.show(result, 'long', 'bottom');
				},
				function (error) {
				    $cordovaToast.show(error, 'long', 'bottom');
				}
			    );
			} else if (baseIndex + index == 3) {
			    Opener.open(fullPath);
			}
			hideSheet();
		    },
		    destructiveButtonClicked: function() {
			$cordovaFile.removeFile(fullPath).then(function(result) {
			    $cordovaToast.show("File deleted.", 'long', 'bottom');
			    file.local = false;
			    hideSheet();
			}, function(err) {
			    $cordovaToast.show(err, 'long', 'bottom');
			});
		    }
		};
		if (file.local) {
		    actionOptions.buttons.push({ text: 'reDownload' });
		    actionOptions.buttons.push({ text: 'Open with' });
		    actionOptions.destructiveText = "Delete local file";
	    	} else {
		    actionOptions.buttons.push({ text: 'Download' });
		}
	    } else {
		var buttons = [
		    {
			text: "Access control"
		    },
		    {
			text: "Share"
		    }
		];
		if (file.subscription) {
		    buttons = [
			{
			    text: "Unsubscribe"
			}
		    ];
		}
		var actionOptions = {
		    buttons: buttons,
 		    titleText: file._fileName,
		    cancelText: 'Cancel',
		    buttonClicked: function(index) {
			if (index == 0) {
			    if (file.subscription) {
				$scope.unsubscribe(file);
			    } else {
				$scope.showUpdateACL(file);
			    }
			    hideSheet();
			} else if (index == 1) {
			    $scope.updateAccessPwd(file);
			    hideSheet();
			}
		    }
		};
	    }
	    //actionOptions.destructiveText = "Delete local file";
	    hideSheet = $ionicActionSheet.show(actionOptions);
	};

	$scope.updateAccessPwd = function (file) {
	    Accounts.getLastUsed().then(
		function (account) {
		    var password = file.shared ? file.shared : Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
		    var filePath = ($stateParams.path ?  ($stateParams.path + "/") : "") + file._fileName;
		    if (file._size) {
			$scope.formData = {
			    shared: true,
			    link: "http://" + account.host + "/~" + account.account + "/protected/pwd/" + password + "/" + filePath
			};
		    } else {
			$scope.formData = {
			    shared: true,
			    link: "http://" + account.host + "/filebrowser.wcgp?subDir=~" + account.account + "/protected/pwd/" + password + "/" + filePath
			};
		    }

		    var sharePopup = $ionicPopup.show({
			templateUrl: "templates/shareLink.html",
			title: 'Share',
			subTitle: file._fileName,
			scope: $scope,
			buttons: [
			    {text: 'Cancel'},
			    {
				text: 'Save',
				type: 'button-positive',
				onTap: function(e) {
				    e.preventDefault();
				    XIMSS.updateAccessPwd("private/" + filePath, $scope.formData.shared ? password : false).then(
					function (result) {
					    sharePopup.close();
					    file.shared = $scope.formData.shared?password:false;
					},
					function (err) {
					    $cordovaToast.show(err, 'long', 'bottom');
					}
				    );
				}
			    }
			]
		    });
		});
	};

	$scope.copyLink = function (link) {
	    $cordovaClipboard.copy(link).then(function () {
		$cordovaToast.show("Link copied to clipboard.", 'long', 'bottom');
	    });
	};

	$scope.showUpdateACL = function (item) {
	    $scope.acls = [];
	    $ionicModal.fromTemplateUrl('templates/accessControl.html', {
		scope: $scope,
	    }).then(function(modal) {
		if (item.acl) {
		    $scope.acls = JSON.parse(JSON.stringify(item.acl.subKey));
		    if(Object.prototype.toString.call($scope.acls) !== '[object Array]' ) {
			$scope.acls = [$scope.acls];
		    }
		}
		$scope.newACL = {__text: "lr"};
		$scope.file = item;
		$scope.accessModal = modal;
		$scope.accessModal.show();
	    });
	};
	$scope.updateACLClose = function () {
	    $scope.accessModal.hide().then(function () {
		$scope.accessModal.remove();
	    });
	};
	$scope.updateACL = function (file) {
	    if ( this.newACL._key && this.newACL.__text ) {
		if (!this.acls)
		    this.acls = [];
		this.acls.push(this.newACL);
	    };
	    this.acls = $filter('filter')(this.acls, function (item, index) {
		if (item._key && item.__text)
		    return true;
		return false;
	    });
	    XIMSS.updateACL(this.file._directory + this.file._fileName, this.acls).then(
		function (ok) {
		    $scope.updateACLClose();
		    file.acl = this.acls.length?{subKey: this.acls}:null;
		}.bind(this),
		function (error) {
		    $cordovaToast.show(error, 'long', 'bottom');
		}
	    );
	};

	$scope.doRefresh = function () {
	    // stop the refresh in 10 seconds anyway
	    $timeout(function() {
		$scope.$broadcast('scroll.refreshComplete');
	    }, 10000);
	    $scope.$broadcast('forceReload');
	};

	$scope.setGridView = function (state) {
	    $scope.iface.grid = state;
	    $prefs.set("gridView", state);
	}

	$scope.toggleFilter = function (what) {
	    // searches.folders?searches={}:searches={folders:true}
	    if (what == "folders") {
		if ($scope.searches.folders) {
		    $scope.searches = {};
		} else {
		    $scope.searches = {folders: true};
		}
	    } else if (what == "docs") {
		if ($scope.searches.docs) {
		    $scope.searches = {};
		} else {
		    $scope.searches = {docs: true};
		}
	    } else if (what == "sounds") {
		if ($scope.searches.sounds) {
		    $scope.searches = {};
		} else {
		    $scope.searches = {sounds: true};
		}
	    } else if (what == "images") {
		if ($scope.searches.images) {
		    $scope.searches = {};
		} else {
		    $scope.searches = {images: true};
		}
	    }
	    $ionicScrollDelegate.$getByHandle('contentScroll').scrollTop();
	}

	$scope.viewFile = function (folderItem) {
	    if (folderItem.local) {
		// alert();
		$scope.openFile(folderItem);
	    } else {
		Downloader.download(folderItem, basePath.base + $scope.path + folderItem._fileName, $scope).then(
		    function (result) {
			$cordovaToast.show(result, 'long', 'bottom');
			$scope.openFile(folderItem);
		    },
		    function (error) {
			$cordovaToast.show(error, 'long', 'bottom');
		    }
		);
	    }

	}

	$scope.checkAudioFormat = function (format) {
	    var testEl = new Audio();
	    if ( testEl.canPlayType ) {
		mp3 = "" !== testEl.canPlayType( 'audio/mpeg;' );
		m4a = "" !== ( testEl.canPlayType( 'audio/x-m4a;' )
				|| testEl.canPlayType( 'audio/aac;' ) );
		ogg = "" !== testEl.canPlayType( 'audio/ogg; codecs="vorbis"' );
		wav = "" !== testEl.canPlayType( 'audio/wav; codecs="1"' );
		if (format == "mp3" && mp3)
		    return true;
		if (format == "m4a" && m4a)
		    return true;
		if ((format == "oga" || format == "ogg") && ogg)
		    return true;
		if (format == "wav" && wav)
		    return true;
	    }
	    return false;
	};
	$scope.checkVideoFormat = function (format) {
	    var testEl = document.createElement( "video" );
	    if ( testEl.canPlayType ) {
		mpeg4 = "" !== testEl.canPlayType( 'video/mp4; codecs="mp4v.20.8"' );
		h264 = "" !== ( testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E"' )
				|| testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' ) );
		ogg = "" !== testEl.canPlayType( 'application/ogg; codecs="theora"' );
		webm = "" !== testEl.canPlayType( 'video/webm; codecs="vp8, vorbis"' );
		if (format == "mp4" && mpeg4 && h264)
		    return true;
		if ((format == "ogv" || format == "ogg") && ogg)
		    return true;
		if (format == "webm" && webm)
		    return true;
	    }
	    return false;
	};

	$scope.openFile = function (folderItem) {
	    filePath = basePath.base + $scope.path + folderItem._fileName;
	    var ext = filePath.split('.').pop().toLowerCase();
	    if ((ext == "mp4" || ext == "ogg"  || ext == "ogv" || ext == "webm") && $scope.checkVideoFormat(ext)) {
		$state.go('videoplayer', {
		    filepath: filePath
		});
	    } else if ((ext == "mp3" || ext == "wav" || ext == "oga" || ext == "ogg") && $scope.checkAudioFormat(ext)) {
		// if (folderItem.controls) {folderItem.controls.playpause};
	    } else if (ext == "jpg" || ext == "jpeg" || ext == "png" || ext == "gif" || ext == "tiff" || ext == "tif" || ext == "bmp") {
		var storageBase = cordova.file.externalRootDirectory.replace("file://", "");
		$cordovaFile.listDir(basePath.base + $scope.path).then(function(result) {
		    images = $filter('filter')(result, function (item, index) {
		    	if (item.isFile && item.name.match(/\.(jpg|jpeg|png|gif|tif|tiff|bmp)$/i) )
		    	    return true;
		    	return false;
		    }).map(function (image) {
			return  (storageBase + image.fullPath).replace(/\/+/g, "/");
		    }).sort();
		    var index = images.indexOf(filePath.replace("file://", "").replace(/\/+/g, "/"));
		    $rootScope.images = images;
		    $state.go('imageviewer', {
			index: index
		    });
		}, function(err) {
		    // An error occurred. Show a message to the user
		});
	    } else {
		window.plugins.fileOpener.open(filePath);
	    }
	};


	// Create new folder

	$scope.createFolder = function (path) {
	    $scope.formData = {};
	    var addFolderPopup = $ionicPopup.show({
		templateUrl: "templates/addFolder.html",
		title: 'Create folder',
		subTitle: "Please enter a folder name:",
		scope: $scope,
		buttons: [
		    {text: 'Cancel'},
		    {
			text: 'Create',
			type: 'button-positive',
			onTap: function(e) {
			    e.preventDefault();
			    if ($scope.formData.folder) {
				XIMSS.createFolder(path + $scope.formData.folder).then(
				    function () {
					$scope.listFolder();
					addFolderPopup.close();
				    },
				    function (err) {
					$cordovaToast.show(err, 'long', 'bottom');
				    }
				);
			    } else {
				$cordovaToast.show("Please enter a folder name", 'long', 'bottom');
			    }
			}
		    }
		]
	    });
	};

	// Upload
	$scope.uploadHere = function (path) {
	    $scope.browseFolder(basePath.baseRoot);
	    $scope.uploadFiles = {};
	    $ionicModal.fromTemplateUrl('templates/browseFiles.html', {
		scope: $scope,
	    }).then(function(modal) {
		$scope.browseModal = modal;
		$scope.browseModal.show();
	    });
	};
	$scope.browseFolder = function (path) {
	    // TODO: Do a check for OS in order to replace
	    path = path.replace("file://", "");
	    $ionicLoading.show({
	    	templateUrl: 'templates/loading.html'
	    });
	    $scope.browsePath = path;
	    $cordovaFile.listDir(path).then(
		function (ok) {
		    $scope.uploadItems = ok.sort(compareFilesAndFoldersUpload);
		    $ionicScrollDelegate.$getByHandle('uploadModalContent').scrollTop(true);
		    $ionicLoading.hide();
		},
		function (error) {
		    console.log("Error: " + JSON.stringify(error));
		}
	    );
	};

	$scope.closeUploadFiles = function () {
	    $scope.browseModal.hide().then(function () {
		$scope.browseModal.remove();
	    });
	};
	$scope.doUploadFiles = function () {
	    var files = [];
	    angular.forEach($scope.uploadFiles, function(value, key) {
		if (value)
		    this.push(key);
	    }, files);
	    if (!files.length) {
		$cordovaToast.show("Please select at least one file!", 'long', 'bottom');
		return;
	    }
	    $scope.uploadProgress = 0;
	    $scope.uploadCurrent = 0;
	    $scope.uploadCount = files.length;
	    var uploadPopup = $ionicPopup.show({
	    	templateUrl: "templates/uploading.html",
	    	title: 'Uploading',
	    	scope: $scope,
	    	buttons: []
	    });
	    $scope.serialUploadFile(files, uploadPopup);
	};
	$scope.serialUploadFile = function (files, uploadPopup) {
	    $scope.uploadProgressCurrent = 0;
	    $scope.uploadFilename = "";
	    var progressChunks = 100/$scope.uploadCount;
	    if (files.length) {
		var file = files.shift();
		var fileName = file.replace(/^.*[\\\/]/, '');
		$scope.uploadFilename = fileName;
		XIMSS.getSession().then(
		    function (sessionData) {
		    	var account = sessionData.account;
		    	var SessionID = sessionData.sessionID;
			var uploadID = makeId();
			$cordovaFileTransfer.upload((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + SessionID + "/UPLOAD/" + uploadID , file.replace("file://",""), {
			    "fileKey": "fileData",
			    "fileName": fileName
			}, true)
			    .then(function(result) {
				// Success!
				var filePath = $scope.path + fileName;
				if (! filePath.match(/^~/))
				    filePath = "/private/" + filePath;
				XIMSS.fileStore(filePath, uploadID).then(
				    function (ok) {
					$scope.uploadCurrent = $scope.uploadCount - files.length;
	    	    			// $scope.uploadProgress = (Math.round(100 * ($scope.uploadCount - files.length)/$scope.uploadCount));
 					$scope.serialUploadFile(files,uploadPopup);
				    },
				    function (err) {
 					uploadPopup.close();
					$cordovaToast.show(err, 'long', 'bottom');
				    }
				);
			    }, function(err) {
				// Error
 				uploadPopup.close();
			    }, function (progress) {
	    	    		$scope.uploadProgressCurrent = (Math.round(100 * progress.loaded/progress.total));
	    	    		$scope.uploadProgress = Math.round( ($scope.uploadCount - files.length - 1)*progressChunks + progressChunks * progress.loaded/progress.total );
			    });
		    },
		    function (error) {
			$cordovaToast.show(error, 'long', 'bottom');
		    }
		);
	    } else {
		uploadPopup.close();
		$scope.closeUploadFiles();
		$scope.listFolder();
		// $state.go('tab.dash', {path: $stateParams.path});
	    }

	};
	$scope.levelUp = function (path) {
	    // Durty hack
	    return path + "../";
	}
	// END Upload files

	$scope.playAudio = function (file, files) {
	    // folderItem.controls.playpause
	    $scope.iface.audioControls.playFile(basePath.base + $scope.path, file, files);
	}

	$ionicPlatform.ready(function() {
	    StatusBar.show();
	    $scope.listFolder();
	    $prefs.get("gridView").then(
		function (state) {
		    $scope.iface.grid = state;
		}
	    );
	});
	$scope.$on('forceReload', function(event, args) {
	    $scope.listFolder();
	});

	// $scope.$on('hwMenu', function(event, args) {
	//     if ($scope.hideGlobalAction) {
	// 	$scope.hideGlobalAction();
	//     } else {
	// 	$scope.showGlobalAction();
	//     }
	// });
    })
    .controller('AccountsCtrl', function($scope, $ionicModal, $timeout, $prefs, $cordovaToast, $ionicLoading, Accounts, XIMSS, $ionicPopup) {
	$scope.initSettings = function () {
	    $prefs.get("storageBase").then(
		function (storageBase) {
		    $scope.storageBase = storageBase;
		},
		function () {
		    $scope.storageBase = cordova.file.externalRootDirectory.replace("file://", "");
		}
	    );
	    Accounts.all().then(
		function (accounts) {
		    $scope.accounts = accounts;
		    // Get hea account's usage
		    XIMSS.allAccountsUsage(accounts).then(function (usage) {
			var keys = Object.keys(usage);
			for ( var i = 0; i < keys.length; i++ ) {
			    usage[keys[i]].percent = Math.round(usage[keys[i]]._size * 1000/usage[keys[i]]._sizeLimit)/10;
			}
			$scope.accountsUsage = usage;
		    });
		    $ionicLoading.hide();
		},
		function (error) {
		    $cordovaToast.show(error, 'long', 'bottom');
		}
	    );
	    $prefs.get("lastUsedAccount").then(
		function (selectedAccount) {
		    $scope.selectedAccount = selectedAccount;
		}
	    );
	};
	$scope.initSettings();
	$scope.selectAccount = function (id) {
	    $prefs.set("lastUsedAccount", id).then(
		function () {
		    XIMSS.sessionID = null;
		    $scope.$emit('forceReloadAll');
		    $scope.selectedAccount = id;
		}
	    );
	};
	$scope.editAccount = function (account) {
	    $scope.accountData = {
		accountName: account.account
	    };
	    $scope.account = account;
	    $scope.accountData.useSSL = account.ssl;
	    $ionicModal.fromTemplateUrl('templates/editAccount.html', {
		scope: $scope,
		animation: 'slide-in-up',
		backdropClickToClose: false,
		hardwareBackButtonClose: false
	    }).then(function(modal) {
		$scope.editAccountsModal = modal;
		// if ($scope.accountsModal && $scope.accountsModal.isShown()) {
		//     $scope.accountsModal.hide();
		// }
		$scope.editAccountsModal.show();
	    });
	};
	// close edit account dialog
	$scope.closeEditAccountModal = function () {
	    $scope.editAccountsModal.remove();
	    // if ($scope.accountsModal) {
	    // 	$scope.accountsModal.remove();
	    // }
	};
	$scope.doEditAccount = function () {
	    var newPassword = $scope.accountData.accountPassword?$scope.accountData.accountPassword:account.password;
	    XIMSS.checkAccount(account.account, account.host, newPassword, $scope.accountData.useSSL).then(
		function () {
		    Accounts.updateAccount(account.id, newPassword, $scope.accountData.useSSL).then(
			function () {
			    $cordovaToast.show("Account updated.", 'long', 'bottom');
			    $prefs.set("lastUsedAccount", account.id).then(
				function () {
				    XIMSS.sessionID = null;
				    $scope.$emit('forceReloadAll');
				    $scope.selectedAccount = account.id;
				}
			    );
			    $scope.closeEditAccountModal();
			},
			function (error) {
			    $cordovaToast.show(error, 'long', 'bottom');
			}
		    );
		},
		function (error) {
		    $cordovaToast.show(error, 'long', 'bottom');
		}
	    );
	};
	// Delete account
	$scope.deleteAccount = function (account) {
	    var confirmPopup = $ionicPopup.confirm({
		title: 'Remove account',
		template: 'Are you sure you want to remove ' + account.account + '?'
	    });
	    confirmPopup.then(function(res) {
		if(res) {
		    Accounts.remove(account.id).then(
			function () {
			    XIMSS.sessionID = null;
			    $scope.initSettings();
			    $prefs.get("lastUsedAccount").then(
				function (accId) {
				    if (accId = account.id) {
					Accounts.setLastUsedToExisitng();
					$scope.closeEditAccountModal();
					$timeout( function () {$scope.$emit('forceReloadAll');}, 100);
				    }
				}
			    );
			},
			function (err) {
			    $cordovaToast.show(err, 'long', 'bottom');
			}
		    );
		}
	    });
	};
	$scope.$on('forceReload', function(event, args) {
	    $scope.initSettings();
	});
    })

// Image viewer
    .controller('ImageViewerCtrl', function($scope, $stateParams, $rootScope, $ionicSlideBoxDelegate, $timeout, $ionicActionSheet) {
	// $scope.$root.tabsHidden = "tabs-item-hide";
	// $scope.hiddenHeader = false;
	$scope.visibleImages = new Array($rootScope.images.length);
	$scope.visibleImages[$stateParams.index] = $rootScope.images[$stateParams.index];
	$timeout(function () {
	    $ionicSlideBoxDelegate.slide($stateParams.index, 1);
	}, 100);
	$scope.addPrevNextImage = function (currentVisible) {
	    currentVisible = parseInt(currentVisible);
	    if (currentVisible > 0 && $scope.visibleImages[currentVisible - 1] == null) {
		// Add one at begiining
		$scope.visibleImages[currentVisible - 1] = $rootScope.images[currentVisible - 1];
	    }
	    if (currentVisible < ($rootScope.images.length - 1) && $scope.visibleImages[currentVisible + 1] == null) {
		// Add one at end
		$scope.visibleImages[currentVisible + 1] = $rootScope.images[currentVisible + 1];
	    }
	};
	$timeout( function () {
	    $scope.addPrevNextImage($stateParams.index);
	}, 800);
	$scope.toggleFullscreen = function ($event) {
	    var slider = angular.element(document.querySelector( '.slider' ))[0];
	    if (StatusBar.isVisible) {
		StatusBar.hide();
		$scope.hiddenHeader = true;
	    } else {
		StatusBar.show();
		$scope.hiddenHeader = false;
	    }
	};
	$scope.slideChanged = function ($index) {
	    $timeout( function () {
		$scope.addPrevNextImage($index);
	    }, 500);
	};
	$scope.openWith = function () {
	    var hideSheet = $ionicActionSheet.show({
		buttons: [
		    { text: 'Open with' }
		],
		cancelText: 'Cancel',
		cancel: function() {
		    // add cancel code..
		},
		buttonClicked: function(index) {
		    window.plugins.fileOpener.open("file://" + $rootScope.images[$ionicSlideBoxDelegate.currentIndex()]);
		    hideSheet();
		}
	    });
	};
    })
// Viedeo player
    .controller('VideoPlayerCtrl', function($scope, $stateParams, $ionicActionSheet) {
	// $scope.$root.tabsHidden = "tabs-item-hide";
	$scope.title = $stateParams.filepath.substring($stateParams.filepath.lastIndexOf('/')+1);
	$scope.video = $stateParams.filepath;
	$scope.openWith = function () {
	    var hideSheet = $ionicActionSheet.show({
		buttons: [
		    { text: 'Open with' }
		],
		cancelText: 'Cancel',
		cancel: function() {
		    // add cancel code..
		},
		buttonClicked: function(index) {
		    window.plugins.fileOpener.open($stateParams.filepath);
		    hideSheet();
		}
	    });
	};
    })
// Audio player
    .controller('AudioPlayerCtrl', function($scope, $stateParams, $ionicActionSheet) {
	// $scope.$root.tabsHidden = "tabs-item-hide";
	$scope.title = $stateParams.filepath.substring($stateParams.filepath.lastIndexOf('/')+1);
	$scope.audio = $stateParams.filepath;
	$scope.openWith = function () {
	    var hideSheet = $ionicActionSheet.show({
		buttons: [
		    { text: 'Open with' }
		],
		cancelText: 'Cancel',
		cancel: function() {
		    // add cancel code..
		},
		buttonClicked: function(index) {
		    window.plugins.fileOpener.open($stateParams.filepath);
		    hideSheet();
		}
	    });
	};
    })


function compareFilesAndFolders(a,b) {
    // if type differs
    if (a._size && b._type)
	return 1;
    if (a._type && b._size)
	return -1;
    // if type equals
    if (a._fileName > b._fileName)
	return 1;
    if (a._fileName < b._fileName)
	return -1;
    return 0;
}
function compareFilesAndFoldersUpload(a,b) {
    // if type differs
    if (a.isFile && b.isDirectory)
	return 1;
    if (a.isDirectory && b.isFile)
	return -1;
    // if type equals
    if (a.name > b.name)
	return 1;
    if (a.name < b.name)
	return -1;
    return 0;
}

function makeId () {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
