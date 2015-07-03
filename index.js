/**
 * User:	zenboss
 * GitHub:	zenboss
 * Date:	2015-07-02
 * Time:	09:54 A.M.
 * Email:	zenyes@gmail.com
 */
"use strict";
var readFileLine = require('readFileLine');

var fs = require('fs');
var crypto = require('crypto');

var md5 = function(str){
	str = str+'';
	var md5hash = crypto.createHash('md5');
	md5hash.update(str);
	return md5hash.digest('hex');
};
var _parseInt = function(){
	return parseInt.apply(this,arguments)||0;
}

var _getDataFileSubDir = function(md5key){
	return md5key[0]+md5key[1]+md5key[2]+'/'+md5key[3]+md5key[4]+md5key[5];
}

var filekv = function(opt){
	var self = this;
	if(!!opt.fileDir)self.setFileDir(opt.fileDir);
	if(!!opt.workQueueMax)self.setWorkQueueMax(opt.workQueueMax);
	self.workQueue = [];
	self.workQueueMax = self.workQueueMax||1000;
	self.workQueueNowRun = 0;

};

filekv.prototype.setFileDir = function(path){
	var self = this;
	self.fileDir = path;
	return self.fileDir;
};
filekv.prototype.setWorkQueueMax = function(maxnum){
	self.workQueueMax = maxnum;
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


filekv.prototype._queue = function(doFn){
	var self = this;
	self.workQueue.push(doFn);//将函数放入全局队列
	self._doQueue();
	


};
filekv.prototype._doQueue = function(){
	var self = this;
	if(self.workQueueNowRun<self.workQueueMax){
		self.workQueueNowRun++;
		var fn = self.workQueue.pop();

		if(!!fn){
			fn(function(){
				self.workQueueNowRun--;
				self._doQueue();
			})
		}else{
			self.workQueueNowRun--;
		}

	}
	
};




filekv.prototype.has = function(key,opt,cb){
	var self = this;
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};
	var md5key = md5(key);
	var filePath = this.fileDir+'/'+_getDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	self._queue(function(queueCB){
		fs.exists(filePath,function(exists){

	        if(exists){
	        	queueCB.call(self,null,filePath);
	            cb(null,filePath);
	        }else{
	        	queueCB.call(self,null,exists);
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

	var md5key = md5(key);
	var filePath = this.fileDir+'/'+_getDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	var valueData = null;
	var createTime = 0;
	var expireTime = 0;
	self._queue(function(queueCB){

		readFileLine(filePath,function(lineData,lineNum){
			if(lineNum==0){
				expireTime = _parseInt(lineData+'');
				if(expireTime>0 && expireTime<=_parseInt(Date.now()/1000)){
					self.del(key);

					queueCB.call(self,new Error('key expire'));

					cb(new Error('key expire'));
					return false;
				}
			}else if(lineNum==1){
				createTime = _parseInt(lineData+'');
			}else if(lineNum==2){ //data
				try{
					valueData = JSON.parse(lineData+'', function(key, value) {
	    					return value && value.type === 'Buffer' 
	    					? new Buffer(value.data)
	      					: value; // Buffer类型特殊处理
	  				});
				}catch(ex){
					queueCB.call(self,ex);

					cb(ex);
					return false;
				}
			}
		},function(err,endType,nowLineNum){

			if(err){
				queueCB.call(self,err);
				cb(err);
			}else{
				if(endType=='end'){
					queueCB.call(self,null,valueData);
					cb(null,valueData);
				}
			}
		});

	});
	
};

filekv.prototype.set = function(key,value,expireTime,opt,cb){
	var self = this;
	if('function' == typeof expireTime){
		cb = expireTime;
		expireTime = 0;
	}
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	opt = opt||{};
	cb = cb||function(){};

	var md5key = md5(key);
	var filePath = this.fileDir+'/'+_getDataFileSubDir(md5key)+'/';


	self.tool.mkdirs(filePath,function(){
		var fileAllPath = filePath+'/'+md5key+'.fkv';
		var valueData = null;
		var createTime = _parseInt(Date.now()/1000);
		expireTime = _parseInt(expireTime);
		var fileData = '';
		fileData += expireTime+'\n';
		fileData += createTime+'\n';
		fileData += JSON.stringify(value);
		self._queue(function(queueCB){
			
			fs.writeFile(fileAllPath,fileData,function(err){
				cb.apply(self,arguments);
				queueCB.apply(self,arguments);
			});

		});
		
	});

};

filekv.prototype.del = function(key,opt,cb){
	if('function' == typeof opt){
		cb = opt;
		opt = {};
	}
	cb = cb||function(){};

	var md5key = md5(key);
	var filePath = this.fileDir+'/'+_getDataFileSubDir(md5key)+'/'+md5key+'.fkv';
	fs.unlink(filePath,cb);
};


module.exports = filekv;
