"use strict";


var now = Date.now();
var util = require('util');
var fs = require('fs');
var assert = require('assert')
var fileDir = __dirname+'/filekv_test_data_folder_'+now;
var fkvObj = require('../index.js').create({
    fileDir:fileDir,
    workMax:1000
});


fkvObj.set('test','test value',function(err,data){
    console.log(err,data);
    fkvObj.get('test',function(err,data,info){
        console.log(err,data,info);
    })

});