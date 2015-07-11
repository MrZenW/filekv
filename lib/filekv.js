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



filekv.prototype._get = function(key,cb,opt){
	var self = this;

	cb = cb||function(){};
	opt = opt||{};

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
			
		}

		readFileLine(filePath,function(lineData,lineNum){
			var theRead = this;

			switch(lineNum){
				case 1:

					expireTime = parseInt(lineData+'')||0;
					if(expireTime!=0 && expireTime<=parseInt(Date.now()/1000)){
						self._del(key);
						var cbError = new Error('key expired');
						unifyCallBack(cbError);
						theRead.close();
					}
					break;
				case 2:
					updateTime = parseInt(lineData+'')||0;
					break;
				case 3: //data
					try{
						valueData = JSON.parse(lineData+'', function(key, value) {
		    					return value && value.type === 'Buffer' 
		    					? new Buffer(value.data)
		      					: value; // Buffer类型特殊处理
		  				});
					}catch(ex){
						unifyCallBack(ex);
						theRead.close();
					}
					break;
				
			}
		},function(err,endType,totalLineNum){
			if(err){
				unifyCallBack(err);
			}else{
				if(endType=='end'){

					if(updateTime>0 && totalLineNum>=3){
						unifyCallBack(null,valueData,{
							updateTime:updateTime,
							expireTime:expireTime,
							filePath:filePath
						});
					}else{
						unifyCallBack(new Error("file content can't parse"));
					}

				}
			}
		});

	});
	
};


filekv.prototype._set = function(key,value,lifeTime,cb,opt){
	var self = this;
	if('function' == typeof lifeTime){
		cb = lifeTime;
		lifeTime = 0;
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
				unifyCallBack(err,_more);
				if(expireTime!=0 && expireTime<=updateTime){
					self._del(key);
				}
			});

		});

	});
};


filekv.prototype._del = function(key,cb,opt){
	var self = this;
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};

	var md5key = _md5(key);
	var filePath = this.fileDir+'/'+fkvtool.buildDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	fs.unlink(filePath,cb);

};




filekv.prototype.has = function(key,cb,opt){
	var self = this;

	cb = cb||function(){};
	opt = opt || {};
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
			var theRead = this;
			switch(lineNum){
				case 1:
					expireTime = parseInt(lineData)||0;
					unifyCallBack();
					theRead.close();
					return false;
					break;
				default:
					theRead.close();
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

filekv.prototype.add = function(key,value,lifeTime,cb,opt){
	var self = this;
	var callArgs = arguments;
	
	if('function' == typeof lifeTime){
		cb = lifeTime;
		lifeTime = 0;
	}
	cb = cb || function(){};

	var unifyCB = function(){
		cb.apply(self,arguments);
		self.emit('add',callArgs,arguments);
	};
	self.has(key,function(err,isExist){
		if(isExist){
			unifyCB(new Error('key existed'));
		}else{
			self._set(key,value,lifeTime,unifyCB,opt);
		}
	})
};

filekv.prototype.replace = function(key,value,lifeTime,cb,opt){
	var self = this;
	var callArgs = arguments;

	if('function' == typeof lifeTime){
		cb = lifeTime;
		lifeTime = 0;
	}
	cb = cb || function(){};

	var unifyCB = function(){
		cb.apply(self,arguments);
		self.emit('replace',callArgs,arguments);
	};
	self.has(key,function(err,isExist){
		if(!isExist){
			unifyCB(new Error('key not exist'));
		}else{
			self._set(key,value,lifeTime,unifyCB,opt);
		}
	})
};

filekv.prototype.get = function(key,cb,opt){
	var self = this;
	var callArgs = arguments;
	cb = cb || function(){};
	self._get.call(self,key,function(){
		cb.apply(self,arguments);
		self.emit('get',callArgs,arguments);
	},opt);
};

filekv.prototype.set = function(key,value,lifeTime,cb,opt){
	var self = this;
	var callArgs = arguments;
	if('function' == typeof lifeTime){
		cb = lifeTime;
		lifeTime = 0;
	}
	cb = cb || function(){};
	lifeTime = lifeTime||0;
	self._set.call(self,key,value,lifeTime,function(){
		cb.apply(self,arguments);
		self.emit('set',callArgs,arguments);
	},opt);
};


filekv.prototype.delete = filekv.prototype.del =function(key,cb,opt){
	var self = this;
	var callArgs = arguments;
	cb = cb || function(){};
	self._del.call(self,key,function(){
		cb.apply(self,arguments);
		self.emit('delete',callArgs,arguments);
	},opt);
}



module.exports = filekv;
