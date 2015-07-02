"use strict";
var fs = require('fs');
var readline = require('readline');
var readFileLine = function(path,cb,endCB){

    cb = cb||function(){};
    endCB = endCB||function(){};

    fs.stat(path,function(err,stats){

        if(err){
            endCB(err);
            return;
        }
        var fl = fs.createReadStream(path,{bufferSize:512});

        
        var rl = readline.createInterface({
            input:fl,
            output:fl
        });

        var lineNum = -1;
        rl.on('line',function(line){
            lineNum++;
            if(cb.call(rl,line,lineNum)===false){
                rl.close();
            }
        })
        fl.on('end',function(){
            endCB.call(rl,null,'end',lineNum);
        });
        fl.on('close',function(){
            endCB.call(rl,null,'close',lineNum);
        });
    });

};
module.exports = readFileLine;