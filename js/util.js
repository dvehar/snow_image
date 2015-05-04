//////////////////////////
// HELPER FUNCTIONS! ////
//////////////////////////

DO_NOTHING = function () {};

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function myXor (a,b) {
	return ( a ? 1 : 0 ) ^ ( b ? 1 : 0 );
}

function endsIn (str, toFind) {
	if (str == null || toFind == null || str == undefined || toFind == undefined ||
			str.length < toFind.length)
	{
		return false;
	} else {
		var startIdx = str.length - toFind.length;
		for (var i = 0; i < toFind.length; ++i) {
			if (str[startIdx + i] != toFind[i]) {
				return false;
			}
		}
	}
	
	return true;
}

function min (a,b) {
  return ((a < b)? a:b); 
}

function max (a,b) {
  return ((a > b)? a:b); 
}

// return a number in [0,max_val]. assumes max is > 0.
function random_int (max_val) {
    return Math.floor(Math.floor(max_val+1) * Math.random());
}

function myClone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = myClone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = myClone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}