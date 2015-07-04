/**
 * User:	zenboss
 * GitHub:	zenboss
 * Date:	2015-07-03
 * Time:	15:58
 * Email:	zenyes@gmail.com
 */
"use strict";

var _innerNextTick = setImmediate;

var _parseInt = function(){
	return parseInt.apply(this,arguments)||0;
}


var workqueue = function(opt){
	var self = this;
	opt = opt||{};
	if(!!opt.workMax)self.setQueueMax(opt.workMax);
	self._queueArray = [];
	self._workMax = _parseInt(self._workMax)||1000;
	self._queueNowRun = 0;

}
workqueue.create = function(opt){
	return new workqueue(opt);
}
workqueue.prototype.setQueueMax = function(maxnum){
	this._workMax = _parseInt(maxnum);
}

workqueue.prototype.queue = function(doFn){
	var self = this;

	self._queueArray.push(doFn);//将函数放入全局队列
	self._doQueue();
};
workqueue.prototype._doQueue = function(){
	var self = this;
	_innerNextTick(function(){
		if(self._queueNowRun<self._workMax){
			self._queueNowRun++;
			var fn = self._queueArray.pop();

			if(!!fn){
				fn(function(){
					self._queueNowRun--;
					self._doQueue();
				})
			}else{
				self._queueNowRun--;
			}

		}
	});
	
};

module.exports = workqueue;