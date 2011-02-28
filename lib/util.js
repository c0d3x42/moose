exports.merge = function(obj1, obj2){
    if(exports.isObject(obj1)){throw new Error("When calling merge, the first object must be an object");}
    if(exports.isObject(obj2)){throw new Error("When calling merge, the second object must be an object")}
    for(var i in obj2){
        obj1[i] = obj2[i];
    }
    return obj1;
}

exports.isObject = function(obj){return typeof obj === "object"}