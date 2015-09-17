/**
 * User:    zenboss
 * GitHub:    zenboss
 * Date:    2015-07-02
 * Time:    09:54 A.M.
 * Email:    zenyes@gmail.com
 */
"use strict";
var fs = require('fs');

var exports = module.exports = function(){};

exports.mkdirs = function(dir,mode,cb){
    var self = this;
    if('function' == typeof mode){
        cb = mode;
        mode = '0777';
    }
    cb = cb || function(){};
    var path = require('path');
    fs.exists(dir,function(exists){
        if(exists){
            cb(null,dir);
        }else{
            self.mkdirs(path.dirname(dir),mode,function(){
                fs.mkdir(dir,mode,cb);
            });
        }
    });
};