(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], function (exports) {
            factory((root.commonJsStrictGlobal = exports));
        });
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory((root.commonJsStrictGlobal = {}));
    }
}(this, function (exports) {

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

	var BWT = {
		encode: function(data) {
			var l = data.length;

			var matrix = new Array(l);
			for(var i = -1; ++i < l;) {
				matrix[i] = data.substr(l - i) + data.substr(0, l - i);
			}

			matrix.sort(function(a, b) {
				return a === b ? 0 : a < b ? -1 : 1;
			});

			var enc = '',
				index;
			for(var i = -1; ++i < l;) {
				enc += matrix[i].charAt(l - 1);
				if(matrix[i] === data) {
					index = i;
				}
			}
			console.log('encode', index);
			return [enc, index];
		},

		decode: function(data, index) {
			var l = data.length;

			var table = new Array(l);
			for(var i = -1; ++i < l;) {
				table[i] = '';
			}

			for(var n = -1; ++n < l;) {
				for(var i = -1; ++i < l;) {
					table[i] = data.charAt(i) + table[i];
				}

				table.sort(function(a, b) {
					return a === b ? 0 : a < b ? -1 : 1;
				});
			}
			return table[index];
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
		var d = String.fromCharCode(bwt[1] >>> 8 & 0xFF)
			+ String.fromCharCode(bwt[1] & 0xFF)
			+ bwt[0];
		var lzw = LZW.encode(d);

		return B64.fromUint16Array(lzw);
	}


	function decode(data) {
		var uint16array = B64.toUint16Array(data);
		var lzw = LZW.decode(uint16array);
		var bwt = BWT.decode(lzw.substr(2), (lzw.charCodeAt(0) << 8) | lzw.charCodeAt(1));

		return bwt;
	}

	exports.B64 = B64;
	exports.BWT = BWT;
	exports.LZW = LZW;
	exports.encode = encode;
	exports.decode = decode;
});