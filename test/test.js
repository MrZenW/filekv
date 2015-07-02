"use strict";
var fs = require('fs');

var fkv = require('../index.js');
var fkvObj = new fkv({fileDir:fs.realpathSync('./data')});

fkvObj.set('test',{name:'zenboss'},function(err1,data1){
	fkvObj.get('test',function(err,data){
		console.log(data,'test')
	});
});

fkvObj.set('test2',{name:'zenboss'},((Date.now()/1000)|0)+1,function(err1,data1){
	fkvObj.get('test2',function(err,data){
		console.log(data,'test2')
	});
});

fkvObj.set('test3','zenboss',function(err1,data1){
	fkvObj.get('test3',function(err,data){
		console.log(data,'test3: save string test')
	});
});

fkvObj.set('test4',{name:'zenboss'},((Date.now()/1000)|0)+1,function(err1,data1){
	fkvObj.get('test4',function(err,data){
		console.log(data,'test4')
	});
});

fkvObj.set('test5',{name:'zenboss'},((Date.now()/1000)|0)-1,function(err1,data1){
	fkvObj.get('test5',function(err,data){
		console.log(data,'test5: expire test')
	});
});

fkvObj.set('test6',{name:'zenboss'},function(err1,data1){
	fkvObj.has('test6',function(err,isHas){

		console.log(isHas,'test6 set, has test')

		fkvObj.del('test6',function(){

			fkvObj.has('test6',function(err,isHas){

				console.log(isHas,'test6 del, has test')

				fkvObj.get('test6',function(err,data){
					
					console.log(data,'test6')
				});	
			});
			
		});
	});
	
});