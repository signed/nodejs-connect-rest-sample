"use strict";

class CurrentRelease {
  constructor() {
    this.currentRelease = undefined;
  }

  getCurrentRelease() {
    return Promise.resolve(this.currentRelease);
  };

  putCurrentRelease(currentReleaseUpdate) {
    this.currentRelease = currentReleaseUpdate;
    return this.getCurrentRelease();
  };

  deleteCurrentRelease() {
    this.currentRelease = undefined;
    return Promise.resolve();
  };
}

module.exports = new CurrentRelease();