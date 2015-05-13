angular.module('drive.config', [])
    .constant('DB_CONFIG', {
	name: 'Database',
	tables: [
	    {
		name: 'ACCOUNTS',
		columns: [
		    {name: 'id', type: 'integer primary key'},
		    {name: 'account', type: 'text'},
		    {name: 'host', type: 'text'},
		    {name: 'password', type: 'text DEFAULT ""'},
		    {name: 'ssl', type: 'integer'}
		]
	    }
	]
    })
    .constant('IMAGES_CONFIG', {
	thMaxWidth: 200,
	thMaxHeight: 200,
	previewMaxWidth: 1000,
	previewMaxHeight: 1000
    })
