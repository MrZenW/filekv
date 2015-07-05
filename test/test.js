"use strict";
var fs = require('fs');


var fkvObj = require('../index.js').create({
	fileDir:__dirname+'/data',

	workMax:1000

});

for(var i =0;i<90000;i++){
	(function(){

		var innerI = i;
		console.log(innerI);
		fkvObj.set(innerI,{id:innerI,str:Math.random()},function(err,data){
			console.log(err,data,'for set text '+innerI);
		});
	})();
}

// for(var i =0;i<1000;i++){
// 	(function(){

// 		var innerI = i;
// 		console.log(innerI);
// 		fkvObj.get(innerI,function(err,data){
// 			console.log(err,data,'for set text '+innerI);
// 		});
// 	})();
// }



fkvObj.set('test',{name:'zenboss'},function(err1,data1){
	fkvObj.get('test',function(err,data){
		console.log(data,'test')
	});
});

fkvObj.set('test2',{name:'zenboss'},3600,function(err1,data1){
	fkvObj.get('test2',function(err,data){
		console.log(data,'test2')
	});
});

fkvObj.set('test3','zenboss',function(err1,data1){
	fkvObj.get('test3',function(err,data){
		console.log(data,'test3: save string test')
	});
});

fkvObj.set('test4',{name:'zenboss'},1,function(err1,data1){
	fkvObj.get('test4',function(err,data){
		console.log(data,'test4')
	});
});

fkvObj.set('test5',{name:'zenboss'},-1,function(err1,data1){
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

