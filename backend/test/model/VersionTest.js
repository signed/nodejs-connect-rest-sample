"use strict";

const Version = require('../../src/domain/Version');

var assert = require('assert');
describe('Version', function () {

  it('defaults to all 0 ', function () {
    assert.equal('0.0.0', new Version().string());
  });

  it('parses from string', function () {
    const parsed = Version.parse('17.2.43');
    assert.equal(17, parsed.major);
    assert.equal(2, parsed.minor);
    assert.equal(43, parsed.patch);
  });

  describe('render into a proper version string', function () {
    it('take version parts in constructor', function () {
      assert.equal('1.2.3', new Version({major: 1, minor: 2, patch: 3}).string());
    });
  });
});
