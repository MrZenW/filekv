/**
 * User:    zenboss
 * GitHub:    zenboss
 * Date:    2015-07-02
 * Time:    09:54 A.M.
 * Email:    zenyes@gmail.com
 */
"use strict";

var crypto = require('crypto');
var exports = module.exports = function(){};

exports.md5 = function(str,encode){
    encode = encode || 'utf8';
    str = str+'';
    var md5hash = crypto.createHash('md5');
    md5hash.update(str,encode);
    return md5hash.digest('hex');
};
