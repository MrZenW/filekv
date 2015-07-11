# FileKV

This is a key&value storage library, which uses file system to store data.

![filekv logo](https://raw.githubusercontent.com/zenboss/zenboss.github.io/master/images/filekv_logo.png)

[![Build Status](https://travis-ci.org/zenboss/filekv.svg?branch=master)](https://travis-ci.org/zenboss/filekv) [![Build status](https://ci.appveyor.com/api/projects/status/rg01h0j4eals8rwt?svg=true)](https://ci.appveyor.com/project/zenboss/filekv)

# Install

>$ npm install filekv -g


# How to use

``` javascript

var filekv = require('filekv');

var filekvClient = filekv.create({
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

## filekv.set(key,value/object[,lifeTime[,callback]])

>Use this function setting a key&value

## filekv.get(key[,callback])

>Use this function get a key&value

## filekv.has(key[,callback])

>Use this function check a key exist

## filekv.del(key[,callback])

>Use this function delete a key

## filekv.add(key,value/object[,lifeTime[,callback]])

>**Note:**
>1.If the key not exist, the api will be create the key&value.
>2.If the key already exist, the api callback function's the 1st variable will is Error object

## filekv.replace(key,value/object[,lifeTime[,callback]])

>**Note:**
>1.If the key already exist, the api will be replace the key's value.
>2.If the key not exist, the api callback function's the 1st variable will is Error object

# Events

## Event:'set'
When you use "set" api setting a key&value, it will emit 'set' event.
``` javascript
filekvClient.on('set',function(input,output){
    // The "input" variable is "set" api's arguments object
    // The "output" variable is "set" api's callback function's callback variable.
});
```

## Event:'get'
When you use "get" api get a key&value, it will emit 'get' event.
``` javascript
filekvClient.on('get',function(input,output){
    // The "input" variable is "get" api's arguments object
    // The "output" variable is "get" api's callback function's callback variable.
});
```

## Event:'add'
When you use "add" api to create a was not exist key&value, it will emit 'add' event.
``` javascript
filekvClient.on('add',function(input,output){
    // The "input" variable is "add" api's arguments object
    // The "output" variable is "add" api's callback function's callback variable.
});
```

## Event:'replace'
When you use "replace" api to replace a already exist key's new value, it will emit 'replace' event.
``` javascript
filekvClient.on('replace',function(input,output){
    // The "input" variable is "replace" api's arguments object
    // The "output" variable is "replace" api's callback function's callback variable.
});
```

## Event:'delete'
When your use "del"/"delete" api delete a key&value in your store, it will emit 'delete' event.
``` javascript
filekvClient.on('delete',function(input,output){
    // The "input" variable is "del"/"delete" api's arguments object
    // The "output" variable is "del"/"delete" api's callback function's callback variable.
});
```

