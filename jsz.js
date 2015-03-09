(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], function (exports) {
            factory((root.jsz = exports));
        });
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory((root.jsz = {}));
    }
}(this, function (exports) {
	var CURRENT_VERSION = 1;


    var mergeSort = (function() {
        return mergeSort;
        
        function mergeSort(array, compare) {
            var length = array.length,
                middle = length >>> 1;
            
            if(2 > length) {
                return array.slice();
            }
            
            if(!compare) {
                compare = function(a, b) {
                    return a === b ? 0 : a < b ? -1 : 1;
                }
            }
            
            return merge(
                mergeSort(array.slice(0, middle), compare),
                mergeSort(array.slice(middle, length), compare),
                compare
            )
        }
        
        function merge(left, right, compare) {
            var result = [];
            while(0 < left.length || 0 < right.length) {
                if(0 < left.length && 0 < right.length) {
                    if(compare(left[0], right[0]) <= 0) {
                        result.push(left[0]);
                        left = left.slice(1);
                    } else {
                        result.push(right[0]);
                        right = right.slice(1);
                    }
                } else if(0 < left.length) {
                    result.push(left[0]);
                    left = left.slice(1);
                } else if(0 < right.length) {
                    result.push(right[0]);
                    right = right.slice(1);
                }
            }
            return result;
        }
    })();
    
    var UTF8 = {
        encode: function(str) {
            str += '';
            
            var utf8 = '',
                i = -1,
                length = str.length,
                start = 0,
                end = 0,
                c1, c2, enc;
            
            while(++i < length) {
                c1 = str.charCodeAt(i);
                enc = null;
                
                if(c1 < 128) {
                    ++end;
                } else if(c1 < 2048) {
                    enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
                } else if((c1 & 0xF800) !== 0xD800) {
                    enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
                } else {
                    if((c1 & 0xFC00) !== 0xD800) {
                        throw new RangeError('Unmatched trail surrogate at ' + i);
                    }
                    c2 = str.charCodeAt(++i);
                    if((c2 & 0xFC00) !== 0xD800) {
                        throw new RangeError('Unmatched trail surrogate at ' + i);
                    }
                    c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000
                    enc = String.fromCharCode((c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
                }
                
                if(null !== enc) {
                    if(end > start) {
                        utf8 += str.slice(start, end);
                    }
                    utf8 += enc;
                    start = end = i + 1;
                }
            }
            
            if(end > start) {
                utf8 += str.slice(start, length);
            }
            
            return utf8;
        },
        decode: function(str) {
            str += '';
            
            var result = [],
                i = 0,
                l = str.length,
                c1, c2, c3, c4;
            
            while(i < l) {
                c1 = str.charCodeAt(i);
                if(c1 <= 191) {
                    result.push(String.fromCharCode(c1));
                    i += 1;
                } else if(c1 <= 223) {
                    c2 = str.charCodeAt(i + 1);
                    result.push(String.fromCharCode(((c1 & 31) << 6) | (c2 & 63)));
                    i += 2;
                } else if(c1 <= 239) {
                    c2 = str.charCodeAt(i + 1);
                    c3 = str.charCodeAt(i + 2);
                    result.push(String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)));
                    i += 3;
                } else {
                    c2 = str.charCodeAt(i + 1);
                    c3 = str.charCodeAt(i + 2);
                    c4 = str.charCodeAt(i + 3);
                    c1 = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
                    c1 -= 0x10000;
                    result.push(String.fromCharCode(0xD800 | ((c1 >> 10) & 0x3FF)));
                    result.push(String.fromCharCode(0xDC00 | (c1 & 0x3FF)));
                    i += 4;
                }
            }
            
            return result.join('');
        }
    };
    
	var B64 = {
		TABLE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
		toUint16Array: function(string) {
			return string.split('').map(function(b) {
				return B64.TABLE.indexOf(b);
			}).reduce(function(a, c, i) {
				if(i % 2) {
					a[i >>> 1] |= c;
				} else {
					a[i >>> 1] = c << 6;
				}
				return a;
			}, new Uint16Array(string.length >>> 1))
		},
		fromUint16Array: function(array) {
			return Array.prototype.map.call(array, function(n) {
				return B64.TABLE[n >>> 6] + B64.TABLE[n & 0x3F];
			}).join('');
		}
	}
    
    
    var sort = function(a, b) {
        return a > b ? 1 : 0;
    }
	var BWT = {
		encode: function(data) {
			var l = data.length;

			var matrix = new Array(l);
			for(var i = -1; ++i < l;) {
				matrix[i] = data.substr(l - i) + data.substr(0, l - i);
			}
            
			matrix = mergeSort(matrix, sort);

			var enc = '',
				index;
			for(var i = -1; ++i < l;) {
				enc += matrix[i].charAt(l - 1);
				if(matrix[i] === data) {
					index = i;
				}
			}
			return [enc, index];
		},

		decode: function(data, index) {
            var l = data.length;
            
            var table = new Array(l);
            for(var i = -1; ++i < l;) {
                table[i] = { p: i, c: data[i] };
            }
            
            table = mergeSort(table, function(a, b) { return sort(a.c, b.c) });
            
            var result = '';
            
            for(var i = -1; ++i < l;) {
                result += table[index].c;
                index = table[index].p;
            }
            
            return result;
		}
	}

	var LZW = {
		initPatternTable: function() {
			var table = new Array(256);
			for(var i = -1; ++i < 256;) {
				table[i] = String.fromCharCode(i);
			}
			return table;
		},
		encode: function(data) {
			var patternTable = LZW.initPatternTable(),
				pattern = '';
			var result = [];
			for(var i = -1, c = data.length; ++i < c;) {
				var chr = data.charAt(i);
				if(-1 < patternTable.indexOf(pattern + chr)) {
					pattern += chr;
				} else {
					patternTable.push(pattern + chr);
					result.push(patternTable.indexOf(pattern));
					pattern = chr;
				}
			}
			if('' !== pattern) {
				result.push(patternTable.indexOf(pattern));
			}

			return new Uint16Array(result);
		},
		decode: function(array) {
			var patternTable = LZW.initPatternTable();

			var next, last = array[0], result = patternTable[last];
			for(var i = 0, c = array.length; ++i < c;) {
				next = array[i];
				if(next < patternTable.length) {
					patternTable.push(patternTable[last] + patternTable[next].charAt(0));
				} else {
					patternTable.push(patternTable[last] + patternTable[last].charAt(0));
				}
				result += patternTable[next];
				last = next;
			}
			return result;
		}
	}


	function encode(data) {
		var bwt = BWT.encode(data);
        var utf8 = UTF8.encode(bwt[0]);
        var lzw = LZW.encode(utf8);

		return writeFormat(B64.fromUint16Array(lzw), bwt[1]);
	}


	function decode(data) {
		var format = readFormat(data);
		var uint16array = B64.toUint16Array(format.data);
		var lzw = LZW.decode(uint16array);
        var utf8 = UTF8.decode(lzw);
        var bwt = BWT.decode(utf8, format.bwtIndex);

		return bwt;
	}

	function writeFormat(data, bwtIndex) {
		return [
			String.fromCharCode(74),
			String.fromCharCode(90),
			String.fromCharCode(0x65),
			B64.TABLE[CURRENT_VERSION],
			B64.TABLE[(bwtIndex >>> 18) & 0x3F],
			B64.TABLE[(bwtIndex >>> 12) & 0x3F],
			B64.TABLE[(bwtIndex >>>  6) & 0x3F],
			B64.TABLE[(bwtIndex >>>  0) & 0x3F],
			data
		].join('');
	}

	function readFormat(data) {
		if(74 !== data.charCodeAt(0) || 90 !== data.charCodeAt(1)) {
			throw new Error('No jsz compression found');
		}

		switch(data.charCodeAt(2)) {
			case 0x65: // base64url
				return {
					encoding: 'base64url',
					version: B64.TABLE.indexOf(data.charAt(3)),
					bwtIndex: (B64.TABLE.indexOf(data.charAt(4)) << 18)
						| (B64.TABLE.indexOf(data.charAt(5)) << 12)
						| (B64.TABLE.indexOf(data.charAt(6)) << 6)
						| B64.TABLE.indexOf(data.charAt(7)),
					data: data.substr(8)
				}
				break;
			default:
				throw new Error('Unknown encoding');
		}
	}

    exports.UTF8 = UTF8;
	exports.B64 = B64;
	exports.BWT = BWT;
	exports.LZW = LZW;
	exports.encode = encode;
	exports.decode = decode;
}));