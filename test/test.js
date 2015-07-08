"use strict";
var fs = require('fs');
var assert = require('assert')
var fileDir = '/filekv_test_data_folder';
var fkvObj = require('../index.js').create({
	fileDir:fileDir,
	workMax:1000
});

assert.equal(typeof fkvObj,'object');
assert.notEqual(fkvObj,null);
assert.notEqual(fkvObj,undefined);

var value = 'filekv test string';


//test set, and, get
fkvObj.set('testkey',value,function(err){
	fkvObj.get('testkey',function(err,data){

		assert.equal(typeof data,'string');
		assert.equal(data,value);

	})
})

//test set, delete, get
fkvObj.set('testkey2',value,function(err){
	fkvObj.del('testkey2',function(){
		fkvObj.get('testkey2',function(err,data){

			assert.equal(!!data,false);
			assert.notEqual(data,value);

		})		
	});
})

//test key life time
fkvObj.set('testkey3',value,5,function(){
	fkvObj.get('testkey3',function(err,data){
		assert.equal(value,data);
		assert.equal(typeof value,typeof data);

	})
	setTimeout(function(){
		fkvObj.get('testkey3',function(err,data){
			assert.equal(value,data);
			assert.equal(typeof value,typeof data);

		})
	},4e3);

	setTimeout(function(){
		fkvObj.get('testkey3',function(err,data){
			assert.notEqual(value,data);
			assert.notEqual(typeof value,typeof data);
			assert.equal(!!data,false);

		})
	},5e3);

	setTimeout(function(){
		fkvObj.get('testkey3',function(err,data){
			assert.notEqual(value,data);
			assert.notEqual(typeof value,typeof data);
			assert.equal(!!data,false);
		})
	},6e3);
})


//test add function
fkvObj.set('testkey4',value,function(){
	fkvObj.add('testkey4',value,function(err){
		assert.equal(err instanceof Error,true);
	})
	fkvObj.add('testkey4-2',value,function(err){
		assert.equal(err,null);
	})

});

//test replace function
fkvObj.set('testkey5',value,function(){
	fkvObj.replace('testkey5',value,function(err){
		assert.equal(err,null);		
	})
	fkvObj.replace('testkey5-2',value,function(err){
		assert.equal(err instanceof Error,true);
	})

});



/*
 * lib md5 testing
 */
var _md5 = require('../lib/crypto.js').md5;
assert.equal(_md5('123').toUpperCase(),'202cb962ac59075b964b07152d234b70'.toUpperCase());
assert.equal(_md5('filekv').toUpperCase(),'ec9310957ee4cedd23ce617051c58ea3'.toUpperCase());
assert.equal(_md5('中文').toUpperCase(),'a7bac2239fcdcb3a067903d8077c4a07'.toUpperCase());

/*
 * lib mkdirs testing
 */
var testDataFolder = fileDir+'/a/b/c';
var filekvFSTool = require('../lib/fs.js');
fs.unlink(testDataFolder,function(){
	filekvFSTool.mkdirs(testDataFolder,function(){
		fs.exists(testDataFolder,function(isExsts){
			assert.equal(isExsts,true);
		});
	});
});
