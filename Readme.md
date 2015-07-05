# FileKV

This is a key&value storage library, which uses file system to store data.

![filekv logo](https://raw.githubusercontent.com/zenboss/zenboss.github.io/master/images/filekv_logo.png)




# Install

>$ npm install filekv -g



# How to use

``` javascript

var filekv = require('filekv');

var filekvClient = new filekv({
		//Here is your datafile dir!
		//!!!This config item not have default value!!!
        fileDir:__dirname+'/data', 

		//This number can't greater than your OS open file max number!
		//This config item default is 1000
        workMax:1000 

});



filekvClient.set('userinfo',{name:'wzy',sex:1,github:'http://www.github.com/zenboss'},3600,function(err){

	console.log(err);

});

filekvClient.get('userinfo',function(err,data){

	console.log(err,data);

});

filekvClient.has('userinfo',function(err,isHas){

	console.log(err,isHas);

});

filekvClient.del('userinfo',function(err){

	console.log(err);

});

```

# API

### filekv.prototype.set(key,value/object[,lifeTime[,callback]])

>Use this function setting a key&value

### filekv.prototype.get(key[,callback])

>Use this function get a key&value

### filekv.prototype.has(key[,callback])

>Use this function check a key exist

### filekv.prototype.del(key[,callback])

>Use this function delete a key