/**
 * User:	zenboss
 * GitHub:	zenboss
 * Date:	2015-07-02
 * Time:	09:54 A.M.
 * Email:	zenyes@gmail.com
 */
"use strict";
var readFileLine	= require('readFileLine');
var workQueue		= require('workqueue');

var fs = require('fs');
var crypto = require('crypto');

var _innerNextTick = setImmediate;

var _md5 = function(str){
	str = str+'';
	var md5hash = crypto.createHash('md5');
	md5hash.update(str);
	return md5hash.digest('hex');
};


var _getDataFileSubDir = function(md5key){
	return md5key[0]+md5key[1]+md5key[2]+'/'+md5key[3]+md5key[4]+md5key[5];
};

var filekv = function(config){
	var self = this;
	self.setFileDir(config.fileDir);

	self._workQueue = workQueue.create({
		workMax:config.workMax||config.workQueueMax||1000
	});



};

filekv.create = function(config){
	return new filekv(config);
};

filekv.prototype.setFileDir = function(path){
	var self = this;
	if(!path){
		throw new Error("Config item:\"fileDir\" can't empty, which not have default value!");
		return;
	}
	self.fileDir = path;
	return self.fileDir;
};
filekv.prototype.setWorkMax = function(maxnum){
	this._workQueue.setQueueMax(maxnum);
}


filekv.prototype.tool = function(){};

filekv.prototype.tool.mkdirs = function(dir,mode,cb){
	var self = this;
    if('function' == typeof mode){
        cb = mode;
        mode = '0777';
    }
    cb = cb || function(){};
    var fs = require('fs');
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


filekv.prototype.has = function(key,opt,cb){
	var self = this;
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};
	var md5key = _md5(key);
	var filePath = this.fileDir+'/'+_getDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	self._workQueue.queue(function(queueCB){
		fs.exists(filePath,function(exists){

	        if(exists){
	        	queueCB(null,filePath);
	            cb(null,filePath);
	        }else{
	        	queueCB(null,exists);
	            cb(null,exists)
	        }
	    });
	});
};


filekv.prototype.get = function(key,opt,cb){
	var self = this;
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};

	var md5key = _md5(key);
	var filePath = this.fileDir+'/'+_getDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	var valueData = null;
	var createTime = 0;
	var expireTime = 0;
	self._workQueue.queue(function(queueCB){

		readFileLine(filePath,function(lineData,lineNum){
			switch(lineNum){
				case 0:

					expireTime = parseInt(lineData+'')||0;
					if(expireTime!=0 && expireTime<=parseInt(Date.now()/1000)){
						self.del(key);

						var cbError = new Error('key expired');
						queueCB(cbError);
						cb(cbError);

						return false;
					}
					break;
				case 1:
					createTime = parseInt(lineData+'')||0;
					break;
				case 2: //data
					try{
						valueData = JSON.parse(lineData+'', function(key, value) {
		    					return value && value.type === 'Buffer' 
		    					? new Buffer(value.data)
		      					: value; // Buffer类型特殊处理
		  				});
					}catch(ex){
						queueCB(ex);
						cb(ex);
						return false;
					}
					break;
				
			}
		},function(err,endType,nowLineNum){

			if(err){
				queueCB(err);
				cb(err);
			}else{
				if(endType=='end'){
					queueCB(null,valueData,createTime,expireTime);
					cb(null,valueData,createTime,expireTime);
				}
			}
		});

	});
	
};

filekv.prototype.set = function(key,value,lifeTime,opt,cb){
	var self = this;
	if('function' == typeof lifeTime){
		cb = lifeTime;
		lifeTime = 0;
	}
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	opt 		= opt||{};
	cb 			= cb||function(){};
	lifeTime	= parseInt(lifeTime)||0;

	var md5key		= _md5(key);
	var filePath	= this.fileDir+'/'+_getDataFileSubDir(md5key)+'/';


	self._workQueue.queue(function(queueCB){
		self.tool.mkdirs(filePath,function(err){
			if(!!err){
				queueCB(err);
				cb(err);
				return;
			}
			var fileAllPath		= filePath+'/'+md5key+'.fkv';
			var createTime		= parseInt(Date.now()/1000);
			var expireTime		= 0;

			if(lifeTime!=0)expireTime = createTime + lifeTime;

			var fileData = '';
			fileData += expireTime+'\n';
			fileData += createTime+'\n';
			fileData += JSON.stringify(value);
				
				fs.writeFile(fileAllPath,fileData,function(err){
					queueCB.apply(self,arguments);
					cb.apply(self,arguments);

					if(expireTime!=0 && expireTime<=createTime){
						self.del(key);
					}
				});

		});

	});
};


filekv.prototype.delete = filekv.prototype.del = function(key,opt,cb){
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};

	var md5key = _md5(key);
	var filePath = this.fileDir+'/'+_getDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	fs.unlink(filePath,cb);
};

module.exports = filekv;
