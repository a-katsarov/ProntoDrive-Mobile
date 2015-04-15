angular.module('starter.controllers', [])
    .controller('AppCtrl', function($scope, $ionicModal) {
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
	$scope.search = function () {
	    alert(22);
	};
    })
    .controller('HomeCtrl', function($scope, $stateParams, $ionicActionSheet) {
	$scope.iface.grid = false;
	$scope.folderItems = [
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder with a longer name than normal. And some more text."
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	    {
		_fileName: "Folder 1"
	    },
	];
	$scope.fileAction = function (file) {
	    var fullpath = file._fileName;
	    if ($stateParams.path) {
		fullpath = $stateParams.path + "/" + file._fileName;
	    }
	    var buttons = [];
	    buttons.push({text: "Access control"});
	    buttons.push({text: "Share"});
	    var actionOptions = {
		buttons: buttons,
		titleText: file._fileName,
		cancelText: 'Cancel',
		buttonClicked: function(index) {
		}
	    };
	    actionOptions.destructiveText = "Delete local file";
	    hideSheet = $ionicActionSheet.show(actionOptions);

	};
    })
    .controller('AccountsCtrl', function($scope, $ionicModal, $timeout) {
	$scope.accounts = [
	    {
		name: "anton@webface.bg",
		usage: "72",
		active: true
	    },
	    {
		name: "anton@katsarov.org",
		usage: "33"
	    },
	    {
		name: "a.katsarov@icn.bg",
		usage: "56"
	    }
	];
	$scope.addAccount = function () {
	    $scope.useSSL = true;
	    $ionicModal.fromTemplateUrl('templates/addAccount.html', {
		scope: $scope,
		animation: 'slide-in-up',
		backdropClickToClose: false,
		hardwareBackButtonClose: false
	    }).then(function(modal) {
		$scope.addAccountsModal = modal;
		if ($scope.accountsModal.isShown()) {
		    $scope.accountsModal.hide();
		}
		$scope.addAccountsModal.show();
	    });
	};
	$scope.closeAddAccountModal = function () {
	    $scope.addAccountsModal.remove();
	    $scope.accountsModal.remove();
	};
    })