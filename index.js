/**
 * User:    zenboss
 * GitHub:  zenboss
 * Date:    2015-07-02
 * Time:    09:54 A.M.
 * Email:   zenyes@gmail.com
 */
"use strict";
var readFileLine = require('readFileLine');

var fs = require('fs');
var crypto = require('crypto');

var md5 = function (str) {
    str = str + '';
    var md5hash = crypto.createHash('md5');
    md5hash.update(str);
    return md5hash.digest('hex');
};
var _parseInt = function () {
    return parseInt.apply(this, arguments) || 0;
}

var filekv = function (opt) {
    var self = this;
    if (!!opt.fileDir)self.setFileDir(opt.fileDir);
    
};

filekv.prototype.setFileDir = function (path) {
    var self = this;
    self.fileDir = path;
    return self.fileDir;
};

filekv.prototype.has = function (key, opt, cb) {
    if ('function' == typeof opt) {
        cb = opt;
        opt = {};
    }
    cb = cb || function () {
        };
    var md5key = md5(key);
    var filePath = this.fileDir + '/' + md5key + '.fkv';
    fs.exists(filePath, function (exists) {
        if (exists) {
            cb(null, filePath);
        } else {
            cb(null, exists)
        }
    });
};

filekv.prototype.get = function (key, opt, cb) {
    var self = this;
    if ('function' == typeof opt) {
        cb = opt;
        opt = {};
    }
    cb = cb || function () {
        };
    
    var md5key = md5(key);
    var filePath = this.fileDir + '/' + md5key + '.fkv';
    var valueData = null;
    var createTime = 0;
    var expireTime = 0;
    readFileLine(filePath, function (lineData, lineNum) {
        if (lineNum == 0) {
            expireTime = _parseInt(lineData + '');
            if (expireTime > 0 && expireTime <= _parseInt(Date.now() / 1000)) {
                self.del(key);
                cb(new Error('key expire'));
                return false;
            }
        } else if (lineNum == 1) {
            createTime = _parseInt(lineData + '');
        } else if (lineNum == 2) { //data
            try {
                valueData = JSON.parse(lineData + '', function (key, value) {
                    return value && value.type === 'Buffer'
                        ? new Buffer(value.data)
                        : value; // Buffer类型特殊处理
                });
            } catch (ex) {
                cb(ex);
                return false;
            }
        }
    }, function (err, endType, nowLineNum) {
        // console.log(arguments)
        if (err) {
            cb(err);
        } else {
            if (endType == 'end') {
                cb(null, valueData);
            }
        }
    });
};
filekv.prototype.set = function (key, value, expireTime, opt, cb) {
    if ('function' == typeof expireTime) {
        cb = expireTime;
        expireTime = 0;
    }
    if ('function' == typeof opt) {
        cb = opt;
        opt = {};
    }
    opt = opt || {};
    cb = cb || function () {
        };
    
    var md5key = md5(key);
    var filePath = this.fileDir + '/' + md5key + '.fkv';
    var valueData = null;
    var createTime = _parseInt(Date.now() / 1000);
    expireTime = _parseInt(expireTime);
    var fileData = '';
    fileData += expireTime + '\n';
    fileData += createTime + '\n';
    fileData += JSON.stringify(value);
    
    fs.writeFile(filePath, fileData, cb)
    
};

filekv.prototype.del = function (key, opt, cb) {
    if ('function' === typeof opt) {
        cb = opt;
        opt = {};
    }
    cb = cb || function () {
        };
    
    var md5key = md5(key);
    var filePath = this.fileDir + '/' + md5key + '.fkv';
    fs.unlink(filePath, cb);
};

module.exports = filekv;
