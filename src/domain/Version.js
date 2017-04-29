"use strict";
class Version {

  static parse(versionString) {
    const parts = versionString.split('.');
    return new Version({major: parts[0], minor: parts[1], patch: parts[2]});
  }

  constructor(args) {
    args = args || {};
    this.major = args.major || 0;
    this.minor = args.minor || 0;
    this.patch = args.patch || 0;
  }

  string() {
    return `${this.major}.${this.minor}.${this.patch}`
  }
}

module.exports = Version;