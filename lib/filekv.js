/**
 * User:	zenboss
 * GitHub:	zenboss
 * Date:	2015-07-02
 * Time:	09:54 A.M.
 * Email:	zenyes@gmail.com
 */
"use strict";
var readFileLine	= require('readfileline');
var workQueue		= require('workqueue');

var fs = require('fs');

var events = require('events');
var util = require('util');

var _md5 = require('./crypto.js').md5;
var fkvtool = require('./tool.js');

var _innerNextTick = setImmediate;



var filekv = function(config){
	events.EventEmitter.call(this);

	var self = this;
	self.setFileDir(config.fileDir);

	self._workQueue = workQueue.create({
		workMax:config.workMax||config.workQueueMax||1000
	});

};
util.inherits(filekv,events.EventEmitter);

filekv.create = function(config){
	return new filekv(config);
};

filekv.prototype.fs = require('./fs.js');


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





filekv.prototype.has = function(key,opt,cb){
	var self = this;
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};
	var md5key = _md5(key);
	var filePath = this.fileDir+'/'+fkvtool.buildDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	var expireTime = 0;
	self._workQueue.queue(function(queueCB){

		var unifyCallBack = function(){
			if(expireTime!=0 && expireTime<=parseInt(Date.now()/1000)){
				cb(new Error('key expired'),false);
			}else{
				cb(null,filePath);
			}
			queueCB(null,filePath);
		}

		readFileLine(filePath,function(lineData,lineNum){
			switch(lineNum){
				case 0:
					expireTime = parseInt(lineData)||0;
					unifyCallBack();
					return false;
					break;
				default:
					return false;
			}

		},function(err,endType,nowLineNum){
			if(err){
				cb(err,false);
			}else{
				if(endType=='end'){
					unifyCallBack();
				}
			}
		});
	});
};

filekv.prototype.add = function(key,opt,cb){
	var self = this;
	self.has(key,function(err,isExist){
		if(isExist){
			cb = cb||function(){};
			cb(new Error('key existed'));
		}else{
			self.set(key,opt,cb);
		}
	})
};

filekv.prototype.replace = function(key,opt,cb){
	var self = this;
	self.has(key,function(err,isExist){
		if(!isExist){
			cb = cb || function(){};
			cb(new Error('key not exist'));
		}else{
			self.set(key,opt,cb);
		}
	})
};

filekv.prototype.get = function(key,opt,cb){
	var self = this;
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};

	var md5key = _md5(key);
	var filePath = this.fileDir+'/'+fkvtool.buildDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	var valueData = null;
	var updateTime = 0;
	var expireTime = 0;

	self._workQueue.queue(function(queueCB){

		//this function is unify callback function, it do many job.
		var unifyCallBack = function(err,valueData,info){ 

			queueCB.apply(self,arguments);
			cb.apply(self,arguments);
			self.emit('get',key,err,valueData,info,opt);
		}

		readFileLine(filePath,function(lineData,lineNum){
			switch(lineNum){
				case 0:

					expireTime = parseInt(lineData+'')||0;
					if(expireTime!=0 && expireTime<=parseInt(Date.now()/1000)){
						self.del(key);

						var cbError = new Error('key expired');
						// queueCB(cbError);
						// cb(cbError);
						unifyCallBack(cbError);

						return false;
					}
					break;
				case 1:
					updateTime = parseInt(lineData+'')||0;
					break;
				case 2: //data
					try{
						valueData = JSON.parse(lineData+'', function(key, value) {
		    					return value && value.type === 'Buffer' 
		    					? new Buffer(value.data)
		      					: value; // Buffer类型特殊处理
		  				});
					}catch(ex){
						// queueCB(ex);
						// cb(ex);
						unifyCallBack(ex);
						return false;
					}
					break;
				
			}
		},function(err,endType,nowLineNum){
			if(err){
				// queueCB(err);
				// cb(err);

				unifyCallBack(err);
			}else{
				if(endType=='end'){
					// queueCB(null,valueData,updateTime,expireTime);
					// cb(null,valueData,updateTime,expireTime);
					unifyCallBack(null,valueData,{
						updateTime:updateTime,
						expireTime:expireTime
					});
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
	var filePath	= this.fileDir+'/'+fkvtool.buildDataFileSubDir(md5key)+'/';


	self._workQueue.queue(function(queueCB){
		var unifyCallBack = function(err,_more){
			queueCB(err,_more);
			cb(err,_more);
			self.emit('set',key,value,lifeTime,opt);
		}
		self.fs.mkdirs(filePath,function(err,_more){
			if(!!err){
				unifyCallBack(err,_more);
				return;
			}
			var fileAllPath		= filePath+'/'+md5key+'.fkv';
			var updateTime		= parseInt(Date.now()/1000);
			var expireTime		= 0;

			if(lifeTime!=0)expireTime = updateTime + lifeTime;

			var fileData = '';
			fileData += expireTime+'\n';
			fileData += updateTime+'\n';
			fileData += JSON.stringify(value);
				
			fs.writeFile(fileAllPath,fileData,function(err,_more){
				// queueCB.apply(self,arguments);
				// cb.apply(self,arguments);
				// self.emit('set',key,value,lifeTime,opt);
				unifyCallBack(err,_more);
				if(expireTime!=0 && expireTime<=updateTime){
					self.del(key);
				}
			});

		});

	});
};


filekv.prototype.delete = filekv.prototype.del = function(key,opt,cb){
	var self = this;
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};

	var md5key = _md5(key);
	var filePath = this.fileDir+'/'+fkvtool.buildDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	fs.unlink(filePath,function(err){
		cb(err);
		self.emit('del',key,err,opt);
	});

};

module.exports = filekv;
