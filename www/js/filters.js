angular.module('drive.filters', [])
    .filter('fileFilter', function($filter) {
	return function(files, searches) {
	    if (searches.string) {
		return $filter('filter')(files, function (item, index) {
		    return item._fileName.toLowerCase().match(searches.string.toLowerCase());
		});
	    } else if (searches.folders) {
		return $filter('filter')(files, function (item, index) {
		    return ! item._size;
		});
	    } else if (searches.docs) {
		return $filter('filter')(files, function (item, index) {
		    return item._fileName.match(/\.(doc|docx|odt|ott|fodt|uot|rdf|dot|pdf|xls|ods|ots|fods|uos|xlsx|xlt|csv|odp|otp|fodp|ppt|pptx|ppsx|potm|pps|pot)$/i);
		});
	    } else if (searches.sounds) {
		return $filter('filter')(files, function (item, index) {
		    return item._fileName.match(/\.(mp3|ogg|wav|flac|acc|oga|m4a)$/i);
		});
	    } else if (searches.images) {
		return $filter('filter')(files, function (item, index) {
		    return item._fileName.match(/\.(png|jpg|jpeg|gif|bmp|tif|tiff|svg|psd)$/i);
		});
	    } else {
		return files;
	    }
	};
    })