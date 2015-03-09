var jsz = require('../jsz');

var expect = require('chai').expect;

describe('jsz', function() {

    describe('compression', function() {
        var enc = jsz.encode('jsz.js');

        describe('base64url encoding', function() {
            describe('format data', function () {
                it('magic number', function () {
                    expect(enc.charAt(0)).to.be.equal('J');
                    expect(enc.charAt(1)).to.be.equal('Z');
                });

                it('encoding', function () {
                    expect(enc.charCodeAt(2)).to.be.equal(0x65);
                });

                it('version', function () {
                    expect(enc.charAt(3)).to.be.equal('B');
                });

                it('bwtIndex', function () {
                    expect(enc.substr(4, 4)).to.be.equal('AAAC');
                });
            });
            
            it('should compress correct', function() {
                expect(enc).to.be.equal('JZeBAAACB6AuBzBqBqBz');
            })
        });
    });
    
    describe('decompression', function() {
        describe('v1', function() {
            it('should decompress base64url encoding', function () {
                var dec = jsz.decode('JZeBAAACB6AuBzBqBqBz');

                expect(dec).to.be.equal('jsz.js');
            });
        });
    });

});