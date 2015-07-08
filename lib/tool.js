/**
 * User:	zenboss
 * GitHub:	zenboss
 * Date:	2015-07-02
 * Time:	09:54 A.M.
 * Email:	zenyes@gmail.com
 */
"use strict";
exports = module.exports = function(){};
exports.buildDataFileSubDir = function(md5key){
	return md5key[0]+md5key[1]+md5key[2]+'/'+md5key[3]+md5key[4]+md5key[5];
};