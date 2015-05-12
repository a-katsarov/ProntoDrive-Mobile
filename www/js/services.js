angular.module('drive.services', ['drive.config'])
    .factory('basePath', function($q, Accounts, $prefs) {
	var self = this;
	self.base = "";
	self.baseRoot = ""
	self.updateBase = function () {
    	    var q = $q.defer();
	    Accounts.getLastUsed().then(
		function (account) {
		    // TODO: check OS
		    self.baseRoot = cordova.file.externalRootDirectory;
		    self.base = self.baseRoot + "/ProntoDrive/" + account.account + "/";
		    q.resolve(self.base);
		},
		function (err) {
		    q.reject(err);
		}
	    );

	    return q.promise;
	};
	return self;
    })
    .factory('XIMSS', function($q, $http, Accounts) {
	var self = this;
	self.x2js = null;
	self.init = function() {
	    self.x2js = new X2JS({escapeMode: false});
	};
	self.checkAccount = function (account, server, password, ssl) {
    	    var q = $q.defer();
	    if (! server ) {
		server = account.split("@")[1];
	    }
	    // TODO: escape URL variables
	    var result = $http.get((ssl?"https://":"http://") + server + (ssl?":9100":":8100") + "/ximsslogin/?username=" + encodeURIComponent(account) + "&password=" + encodeURIComponent(password));
	    result.success(function(data, status, headers, config) {
	        var response = self.x2js.xml_str2json(data);
		if (response.XIMSS.session._urlID) {
		    self.sessionID = response.XIMSS.session._urlID;
		    q.resolve("true");
		} else {
		    q.reject("Wrong account, password or server.");
		}
	    });
	    result.error(function(data, status, headers, config) {
		q.reject("Unable to authenticate. Please check your credentials and network connection.");
	    });
    	    return q.promise;
	};
	// Get Active Session or make connection
	self.getSession = function () {
    	    var q = $q.defer();
	    Accounts.getLastUsed().then(
	    	function (account) {
		    if (self.sessionID) {
			// ssl?"https://":"http://") + server + (ssl?":9100":":8100") + "
	    		var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + self.sessionID + "/sync", "<XIMSS><noop id='id' /></XIMSS>");
	    		res.success(function(data, status, headers, config) {
			    q.resolve({sessionID: self.sessionID,account: account});
	    		});
			res.error(function(data, status, headers, config) {
	    		    var result = $http.get((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/ximsslogin/?username=" + encodeURIComponent(account.account) + "&password=" + encodeURIComponent(account.password));
	    		    result.success(function(data, status, headers, config) {
	    			var response = self.x2js.xml_str2json(data);
	    			self.sessionID = response.XIMSS.session._urlID;
				q.resolve({sessionID: self.sessionID,account: account});
	    		    });
	    		    result.error(function(data, status, headers, config) {
				q.reject(status);
	    		    });
			});
		    } else {
	    		var result = $http.get((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/ximsslogin/?username=" + encodeURIComponent(account.account) + "&password=" + encodeURIComponent(account.password));
	    		result.success(function(data, status, headers, config) {
	    		    var response = self.x2js.xml_str2json(data);
	    		    self.sessionID = response.XIMSS.session._urlID;
			    q.resolve({sessionID: self.sessionID,account: account});
	    		});
	    		result.error(function(data, status, headers, config) {
			    q.reject(status);
	    		});
		    }
		});
    	    return q.promise;
	};
	self.folderListing = function (path) {
    	    var q = $q.defer();
	    self.getSession().then(
		function (sessionData) {
		    var sessionID = sessionData.sessionID;
		    var account = sessionData.account;
		    if (! path.match(/^~/))
			path = "private/" + path;
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileList directory='" + path + "' id='id' /></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    if( response.XIMSS.fileInfo && Object.prototype.toString.call( response.XIMSS.fileInfo ) !== '[object Array]' ) {
	    			response.XIMSS.fileInfo = [response.XIMSS.fileInfo];
			    }
			    q.resolve(response.XIMSS.fileInfo);
			}
	    	    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
	    	    });
		},
		function (error) {
		    q.reject(error);
		}
	    );
    	    return q.promise;
	};
	self.fileListing = function (path) {
    	    var q = $q.defer();
	    self.getSession().then(
		function (sessionData) {
		    var sessionID = sessionData.sessionID;
		    var account = sessionData.account;
		    if (! path.match(/^~/))
			path = "private/" + path;
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileList fileName='" + path + "' id='id' /></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    if( response.XIMSS.fileInfo && Object.prototype.toString.call( response.XIMSS.fileInfo ) !== '[object Array]' ) {
	    			response.XIMSS.fileInfo = [response.XIMSS.fileInfo];
			    }
			    q.resolve(response.XIMSS.fileInfo);
			}
	    	    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
	    	    });
		},
		function (error) {
		    q.reject(error);
		}
	    );
    	    return q.promise;
	};
	self.listSubscriptions = function (path) {
    	    var q = $q.defer();
	    self.getSession().then(
		function (sessionData) {
		    var sessionID = sessionData.sessionID;
		    var account = sessionData.account;
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileSubList id='id' /></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    if( response.XIMSS.fileSubscription && Object.prototype.toString.call( response.XIMSS.fileSubscription ) !== '[object Array]' ) {
	    			response.XIMSS.fileSubscription = [response.XIMSS.fileSubscription];
			    }
			    q.resolve(response.XIMSS.fileSubscription);
			}
	    	    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
	    	    });
		},
		function (error) {
		    q.reject(error);
		}
	    );
    	    return q.promise;
	};
	self.createFolder = function (path) {
    	    var q = $q.defer();
	    self.getSession().then(
		function (sessionData) {
		    var sessionID = sessionData.sessionID;
		    var account = sessionData.account;
		    if (! path.match(/^~/))
			path = "private/" + path;
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileDirCreate fileName='" + path + "' id='id' /></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    q.resolve(response.XIMSS.fileInfo);
			}
	    	    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
	    	    });
		},
		function (error) {
		    q.reject(error);
		}
	    );
    	    return q.promise;
	};
	self.fileStore = function (file, uploadID) {
    	    var q = $q.defer();
	    self.getSession().then(
		function (sessionData) {
		    var sessionID = sessionData.sessionID;
		    var account = sessionData.account;
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileStore fileName='" + file + "' uploadID='" + uploadID + "' id='id' /></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    q.resolve(response.XIMSS.fileInfo);
			}
	    	    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
	    	    });
		},
		function (error) {
		    q.reject(error);
		}
	    );
    	    return q.promise;
	};
	self.getAllAttributes = function (fileList) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
	    	    // if (! path.match(/^~/))
	    	    // 	path = "private/" + path;
		    var ximss = fileList.map(function (file, id) {
			return "<fileAttrRead fileName='" + file._directory + file._fileName + "' id='" + id + "' />";
		    }).join(" ");
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS>" + ximss + "</XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
	    		if (response.XIMSS.response && response.XIMSS.response._errorText) {
	    		    q.reject(response.XIMSS.response._errorText);
	    		} else {
	    		    if( response.XIMSS.fileAttrData && Object.prototype.toString.call( response.XIMSS.fileAttrData ) !== '[object Array]' ) {
	    			response.XIMSS.fileAttrData = [response.XIMSS.fileAttrData];
	    		    }
	    		    q.resolve(response.XIMSS.fileAttrData);
	    		}
	    	    });
	    	    res.error(function(data, status, headers, config) {
	    		q.reject(data);
	    	    });
	    	},
	    	function (error) {
	    	    q.reject(error);
	    	});
    	    return q.promise;
	};


	self.getFoldersInfo = function (fileList) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
		    // Filter only the directories
		    fileList = fileList.filter(function (item) {
			return item._type == "directory";
		    });
	    	    // if (! path.match(/^~/))
	    	    // 	path = "private/" + path;
		    var ximss = fileList.map(function (file, id) {
		    	return "<fileDirInfo directory='" + file._directory + file._fileName + "' id='" + id + "' />";
		    }).join(" ");
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS>" + ximss + "</XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    	    	var response = self.x2js.xml_str2json(data);
	    	    	if (response.XIMSS.response && response.XIMSS.response._errorText) {
	    	    	    q.reject(response.XIMSS.response._errorText);
	    	    	} else {
	    	    	    if( response.XIMSS.fileDirInfo && Object.prototype.toString.call( response.XIMSS.fileDirInfo ) !== '[object Array]' ) {
	    	    		response.XIMSS.fileDirInfo = [response.XIMSS.fileDirInfo];
	    	    	    }
	    	    	    q.resolve(response.XIMSS.fileDirInfo);
	    	    	}
	    	    });
	    	    res.error(function(data, status, headers, config) {
	    	    	q.reject(data);
	    	    });
	    	},
	    	function (error) {
	    	    q.reject(error);
	    	});
    	    return q.promise;
	};


	self.allAccountsUsage = function (accounts) {
    	    var q = $q.defer();
	    var accountData = {};
	    for (var i = 0; i < accounts.length; i++) {
		account = accounts[i];
		// Create a temp session ofr each account
	    	var result = $http.get((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/ximsslogin/?username=" + encodeURIComponent(account.account) + "&password=" + encodeURIComponent(account.password));
	    	result.success(function(data, status, headers, config) {
	    	    var response = self.x2js.xml_str2json(data);
	    	    var sessionID = response.XIMSS.session._urlID;
		    // Get the storage info
		    var account = this.account;
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileDirInfo id='" + account.account + "' /></XIMSS>");
		    res.success(function(data, status, headers, config) {
	    	    	var response = self.x2js.xml_str2json(data);
	    	    	if( response.XIMSS.fileDirInfo ) {
			    accountData[this.account.account] = response.XIMSS.fileDirInfo;
	    	    	}
			if (accounts.length - 1 == this.i) {
			    q.resolve(accountData);
			}
			// Close the session when done
			var account = this.account;
	    		var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><bye id='666' /></XIMSS>");
		    }.bind(this));
	    	    res.error(function(data, status, headers, config) {
			// q.reject(status);
			if (accounts.length - 1 == this) {
			    q.resolve(accountData);
			}
	    	    });
		}.bind({i:i, account: account}));
	    	result.error(function(data, status, headers, config) {
		    // q.reject(status);
		    if (accounts.length - 1 == this) {
			q.resolve(accountData);
		    }
	    	});
	    }
    	    return q.promise;
	};

	self.updateACL = function (file, acl) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
		    // first get files Attributes
		    var ximss = "<fileAttrRead fileName='" + file + "' id='0' />";
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS>" + ximss + "</XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    // Find old accounts
			    var oldUsers = (response.XIMSS.fileAttrData && response.XIMSS.fileAttrData.ACL && response.XIMSS.fileAttrData.ACL.subKey) ? response.XIMSS.fileAttrData.ACL.subKey : [];
			    if (Object.prototype.toString.call( oldUsers ) !== '[object Array]') {
				oldUsers = [oldUsers];
			    }
			    oldUsers = oldUsers.map(function (user) {
				var userId = user._key;
				if (! userId.match(/@/)) {
				    userId = userId + "@" + account.host;
				}
				return userId;
			    }).filter(function (e, i, arr) {
				return arr.indexOf(e, i+1) === -1;
			    });
			    var newACL = {};
			    newACL.subKey = acl.map(function (item, id) {
				return {_key: item._key, __text: item.__text};
			    });
			    if (acl && acl.length) {
				response.XIMSS.fileAttrData.ACL = newACL;
			    } else {
				if (response.XIMSS.fileAttrData.ACL)
				    response.XIMSS.fileAttrData.ACL = [];
			    }
			    // Find new accoutns
			    var newUsers = acl ? acl : [];
			    newUsers = newUsers.map(function (user) {
				var userId = user._key;
				if (! userId.match(/@/)) {
				    userId = userId + "@" + account.host;
				}
				return userId;
			    }).filter(function (e, i, arr) {
				return arr.indexOf(e, i+1) === -1;
			    });
			    // Find newly added users
			    var addedUsers = newUsers.filter(function(user) {return oldUsers.indexOf(user) < 0;});
			    // Now update the ACL
	    		    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileAttrWrite id='0' fileName='" + file + "'>" + self.x2js.json2xml_str(response.XIMSS.fileAttrData) + "</fileAttrWrite></XIMSS>");
	    		    res.success(function(data, status, headers, config) {
	    			var response = self.x2js.xml_str2json(data);
				if (response.XIMSS.response && response.XIMSS.response._errorText) {
				    q.reject(response.XIMSS.response._errorText);
				} else {
				    q.resolve("OK");
				    // We can notify new users
				    for (var i = 0; i < addedUsers.length; i++) {
					// Compose an subscription e-mail
					var ximss = "<XIMSS><messageSubmit id='A001'> \
<EMail> \
<From>" + account.account + "</From> \
<Subject>" + account.account + " has granted you access to their file(s)</Subject> \
<To>" + addedUsers[i] + "</To> \
<X-Autogenerated>sharing notification</X-Autogenerated> \
<MIME type='multipart' subtype='mixed'> \
<MIME charset='utf-8' type='text' subtype='html'>" + account.account + " has granted you access to file(s) contained in the user's eDisc. To view " + file + " click on the Subscribe button above and open it in your Files.</MIME> \
<MIME charset='utf-8' disposition='inline' subtype='pronto+xml' type='application'> \
<syncRequest> \
<title>Subscribe: " + file + "</title> \
<titleId id='SubscribeButton'>SubscribeButton : " + file + "</titleId> \
<request>filesSubscribe</request> \
<params>~" + account.account + "/" + file + "</params> \
</syncRequest> \
</MIME> \
</MIME> \
</EMail> \
</messageSubmit> \
</XIMSS>";
					$http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", ximss);
				    }
				}
			    });
	    		    res.error(function(data, status, headers, config) {
				q.reject(data);
	    		    });
			}
	    	    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
	    	    });
		},
	    	function (error) {
	    	    q.reject(error);
	    	});
    	    return q.promise;
	};

	self.updateAccessPwd = function (file, pwd) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
		    // first get files Attributes
		    var ximss = "<fileAttrRead fileName='" + file + "' id='0' />";
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS>" + ximss + "</XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    // Now update the ACL
			    if (pwd) {
				if (! response.XIMSS.fileAttrData.accessPwd) {
				    response.XIMSS.fileAttrData.accessPwd = {};
				}
				response.XIMSS.fileAttrData.accessPwd.key = pwd;
			    } else {
				if (response.XIMSS.fileAttrData.accessPwd) {
				    response.XIMSS.fileAttrData.accessPwd = {};
				}
			    }
			    var ximss = "<XIMSS><fileAttrWrite id='0' fileName='" + file + "'>" + self.x2js.json2xml_str(response.XIMSS.fileAttrData) + "</fileAttrWrite></XIMSS>";
	    		    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", ximss);
	    		    res.success(function(data, status, headers, config) {
	    		    	var response = self.x2js.xml_str2json(data);
			    	if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    	    q.reject(response.XIMSS.response._errorText);
			    	} else {
			    	    q.resolve("OK");
			    	}
			    });
	    		    res.error(function(data, status, headers, config) {
			    	q.reject(data);
	    		    });
			}
	    	    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
	    	    });
		},
	    	function (error) {
	    	    q.reject(error);
	    	});
    	    return q.promise;
	};

	self.checkSubsFiles = function (files, base) {
    	    var q = $q.defer();
	    var results = [];
	    for (var i = 0; i < files.length; i++) {
		var currentIndex = 0;
		var isSub = (files[i].match(/\//g) || []).length == 1;
		// escaping double folder names (gitHub like :-) )
		files[i] = "/" + files[i].split("/")[1];
		self.fileListing(base + files[i]).then(
		    function (result) {
			result[0]._fileName = result[0]._fileName.split(base)[1].replace(/^\//, "");
			if (this.isSub) {
			    result[0].subscription = 1;
			}
			results.push(result[0]);
			if (files.length - 1 == this.i) {
			    q.resolve(results);
			}
		    }.bind({i: i, isSub: isSub}),
		    function (err) {
			if (files.length - 1 == this.i) {
			    q.resolve(results);
			}
		    }.bind({i: i, isSub: isSub})
		);
	    }
    	    return q.promise;
	};
	self.unsubscribe = function (filePath) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
		    // first get files Attributes
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileSubUpdate id='id'><fileSubscription fileName='" + filePath + "'></fileSubscription></fileSubUpdate></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    q.resolve("ok");
			}
		    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
		    });
		});

    	    return q.promise;
	};
	self.checkSubsRequests = function (filePath) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
		    // first get files Attributes
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><prefsRead id='id'><name>ProntoDriveAlerts</name></prefsRead></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    // Return an array
			    if (response.XIMSS.prefs.ProntoDriveAlerts) {
				var subs = response.XIMSS.prefs.ProntoDriveAlerts.subKey;
				if (! subs)
				    return;
				if (Object.prototype.toString.call( subs ) !== '[object Array]') {
				    subs = [subs];
				}
				q.resolve(subs.map(function (item) {return item._key}));
			    }
			}
		    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
		    });
		});

    	    return q.promise;
	};
	self.removeSubsRequest = function (acl) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
		    // first get files Attributes
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><prefsRead id='id'><name>ProntoDriveAlerts</name></prefsRead></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    var subkeys = response.XIMSS.prefs.ProntoDriveAlerts.subKey;
			    if (Object.prototype.toString.call( subkeys ) !== '[object Array]') {
				subkeys = [subkeys]
			    }
			    var newRequests = subkeys.filter(function (item) { return item._key != acl; });
			    var ximss = "<XIMSS><prefsStore id='id'><ProntoDriveAlerts>" + self.x2js.json2xml_str({subKey: newRequests}) + "</ProntoDriveAlerts></prefsStore></XIMSS>";
	    		    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", ximss);
	    		    res.success(function(data, status, headers, config) {
	    			var response = self.x2js.xml_str2json(data);
				if (response.XIMSS.response && response.XIMSS.response._errorText) {
				    q.reject(response.XIMSS.response._errorText);
				} else {
				    q.resolve("ok");
				}
			    });
	    		    res.error(function(data, status, headers, config) {
				q.reject(data);
			    });
			}
		    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
		    });
		});

    	    return q.promise;
	};
	self.acceptSubsRequest = function (acl) {
    	    var q = $q.defer();
	    self.getSession().then(
	    	function (sessionData) {
	    	    var sessionID = sessionData.sessionID;
	    	    var account = sessionData.account;
		    // first get files Attributes
	    	    var res = $http.post((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + sessionID + "/sync", "<XIMSS><fileSubUpdate id='id'><fileSubscription fileName='" + acl + "' mode='add'></fileSubscription></fileSubUpdate></XIMSS>");
	    	    res.success(function(data, status, headers, config) {
	    		var response = self.x2js.xml_str2json(data);
			if (response.XIMSS.response && response.XIMSS.response._errorText) {
			    q.reject(response.XIMSS.response._errorText);
			} else {
			    self.removeSubsRequest(acl).then(function (result) {
				q.resolve("ok");
			    },function (err) {
				q.reject(err);
			    });
			}
		    });
	    	    res.error(function(data, status, headers, config) {
			q.reject(data);
		    });
		});

    	    return q.promise;
	};
	//
	return self;
    })

// DB wrapper
    .factory('DB', function($q, DB_CONFIG) {
    	var self = this;
    	self.db = null;

    	self.init = function() {
    	    self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'Database', 3000000);

    	    angular.forEach(DB_CONFIG.tables, function(table) {
    		var columns = [];

    		angular.forEach(table.columns, function(column) {
    		    columns.push(column.name + ' ' + column.type);
    		});

    		var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
    		self.query(query);
    	    });
    	};

    	self.query = function(query, bindings) {
    	    bindings = typeof bindings !== 'undefined' ? bindings : [];
    	    var deferred = $q.defer();
    	    self.db.transaction(function(transaction) {
    		transaction.executeSql(query, bindings, function(transaction, result) {
    		    deferred.resolve(result);
    		}, function(transaction, error) {
    		    deferred.reject(error);
    		});
    	    });

    	    return deferred.promise;
    	};

    	self.fetchAll = function(result) {
    	    var output = [];

    	    for (var i = 0; i < result.rows.length; i++) {
    		output.push(result.rows.item(i));
    	    }
    	    return output;
    	};

    	self.fetch = function(result) {
	    if (result.rows.length)
    		return result.rows.item(0);
	    return {};
    	};

    	return self;
    })
    .factory('Accounts', function(DB, $prefs, $q) {
	var self = this;
	self.all = function() {
	    return DB.query('SELECT * FROM ACCOUNTS')
		.then(function(result){
		    return DB.fetchAll(result);
		});
	};
	self.add = function (account, server, password, ssl) {
	    return DB.query('INSERT INTO ACCOUNTS VALUES(NULL, ?, ?, ?, ?)', [account, server, password, (ssl?1:0)])
		.then(function(result) {
		    return DB.fetchAll(result);
		});
	};
	self.lastAdded = function () {
	    return DB.query('SELECT last_insert_rowid()')
		.then(function(result){
		    return DB.fetch(result);
		});
	};
	self.remove = function(id) {
	    return DB.query('DELETE FROM ACCOUNTS WHERE id = ?', [id])
		.then(function(result){
		    return result;
		});
	};
	self.updateAccount = function (id, password, ssl) {
	    return DB.query('UPDATE ACCOUNTS SET password= ?, ssl= ? WHERE id = ?', [password, ssl, id])
		.then(function(result) {
		    return DB.fetchAll(result);
		});
	};
	self.getLastUsed = function() {
	    var q = $q.defer();
	    $prefs.get("lastUsedAccount").then(
		function (value) {
		    DB.query('SELECT * FROM ACCOUNTS WHERE id = ? LIMIT 1', [value])
			.then(
			    function(result) {
				q.resolve(DB.fetch(result));
			    },
			    function (err) {
				q.reject(err);
			    }
			);
		},
		function () {
		    DB.query('SELECT * FROM ACCOUNTS LIMIT 1')
			.then(
			    function(result) {
				q.resolve(DB.fetch(result));
			    },
			    function (err) {
				q.reject(err);
			    }
			);
		}
	    );
	    return q.promise;
	};
	self.setLastUsedToExisitng = function () {
	    DB.query('SELECT * FROM ACCOUNTS LIMIT 1')
		.then(
		    function(result) {
			var account = DB.fetch(result);
			$prefs.set("lastUsedAccount", account.id);
		    },
		    function (err) {
			q.reject(err);
		    }
		);
	};
	return self;
    })
    .factory('$prefs', function($q) {
	return {
	    set: function (key, value) {
		var q = $q.defer();
		plugins.appPreferences.store(function (result) {
		    q.resolve(result);
		}, function (err) {
		    q.reject(err);
		}, key, value);
		return q.promise;
	    },
	    get: function (key) {
		var q = $q.defer();
		plugins.appPreferences.fetch(function (value) {
		    q.resolve(value);
		}, function (err) {
		    q.reject(err);
		}, key);
		return q.promise;
	    }
	}
    })
    .factory('Opener', function () {
	var self = this;
	self.open = function (fullPath) {
	    window.plugins.fileOpener.open(fullPath);
	}
	return self;
    })
    .factory('Downloader', function ($q, $cordovaFileTransfer, $ionicPopup, XIMSS) {
	var self = this;
	self.download = function (file, to, scope) {
	    scope.cancelDownload = function () {alert(999)};
	    var q = $q.defer();
	    var downloadPopup = $ionicPopup.show({
		templateUrl: "templates/downloading.html",
		title: 'Downloading',
		subTitle: file._fileName,
		scope: scope,
	    	buttons: [
		    { text: 'Cancel' }
		]
	    });
	    downloadPopup.then(function () {
		scope.cancelDownload();
	    });
	    scope.downloadProgress = 0;
	    XIMSS.getSession().then(
		function (sessionData) {
		    var account = sessionData.account;
		    var SessionID = sessionData.sessionID;
		    scope.downloadProgressTotal = scope.sizeReadable(file._size);
		    var downloadPromice = $cordovaFileTransfer.download((account.ssl?"https://":"http://") + account.host + (account.ssl?":9100":":8100") + "/Session/" + SessionID + "/DOWNLOAD/" + file._directory + file._fileName, to, {}, true);
	    	    downloadPromice.then(function(result) {
			downloadPopup.close();
			file.local = true;
			var ext = file._fileName.substring(file._fileName.lastIndexOf('.')+1).toLowerCase();
			if (scope.checkAudioFormat(ext)) {
			    file.audioplay = to;
			}

			q.resolve(file._fileName + " downloaded.");
	    	    }, function(err) {
			downloadPopup.close();
			// q.reject(err);
	    	    }, function (progress) {
			q.notify(progress);
			scope.downloadProgressLoaded = scope.sizeReadable(progress.loaded);
	    		scope.downloadProgress = (Math.round(100 * progress.loaded/progress.total));
	    	    });
		    scope.cancelDownload = downloadPromice.abort;
		},
		function (error) {
		    q.reject(error);
		}
	    );
	    return q.promise;
	}
	return self;
    })
    .factory('ImageResizer', function ($q, $cordovaFile) {
	var self = this;
	self.resize = function (file, dest, MAX_WIDTH, MAX_HEIGHT) {
	    var q = $q.defer();
	    var folder = file.substring(0,file.lastIndexOf('/') + 1);
	    var filename = file.substring(file.lastIndexOf('/') + 1);
	    $cordovaFile.readAsDataURL(folder, filename).then(
		function (data) {
		    var image = new Image();
		    image.onload = function(){
			var canvas = document.createElement("canvas");

			// Calculate image size
			if (image.width > image.height) {
			    if (image.width > MAX_WIDTH) {
				image.height *= MAX_WIDTH / image.width;
				image.width = MAX_WIDTH;
			    }
			} else {
			    if (image.height > MAX_HEIGHT) {
				image.width *= MAX_HEIGHT / image.height;
				image.height = MAX_HEIGHT;
			    }
			}

			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			canvas.width = image.width;
			canvas.height = image.height;
			ctx.drawImage(image, 0, 0, image.width, image.height);
			var ext = file.substring(file.lastIndexOf('.') + 1).toLowerCase();
			var buf;
			if (ext == "png") {
			    buf =  _base64ToArrayBuffer(canvas.toDataURL("image/png"));
			} else {
			    buf =  _base64ToArrayBuffer(canvas.toDataURL("image/jpeg", 0.9));
			}

			var filename = dest.substring(dest.lastIndexOf('/') + 1);
			var folder = dest.substring(0,dest.lastIndexOf('/') + 1);
			$cordovaFile.writeFile(folder, filename, buf, true).then(
			    function () {
				q.resolve(1);
			    },
			    function (err) {
				console.log(JSON.stringify(err));
				q.reject(err);
			    });
		    };
		    image.src = data;
		}, function (err) {
		    q.reject(err);
		}
	    );
	    return q.promise;
	}
	return self;
    })

function _base64ToArrayBuffer(base64) {
    base64 = base64.replace(/^.*?\;base64\,/, "");
    var binary_string =  window.atob(base64),
        len = binary_string.length,
        bytes = new Uint8Array( len ),
        i;

    for (i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
