"use strict";
const httpRequest = require('./httpClient').httpRequest;

class JiraClient {
  //curl -u admin:admin -X GET -H "Content-Type: application/json" https://localhost:2990/jira/rest/api/2/project/SAM/versions
  //curl -u admin:admin -X GET -H "Content-Type: application/json" https://localhost:2990/jira/rest/api/2/search?jql=project%20%3D%20SAM%20AND%20fixVersion%20%3D%20next-release

  constructor() {
    this.basePath = '/jira/rest/api/2/';
    this.baseOptions = {
      protocol: 'http:',
      host: 'localhost',
      port: '2990',
      method: 'GET',
      auth: 'admin:admin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }

  search(jql) {
    const options = {
      path: this.completeBasePathWith('search'),
      method: 'POST'
    };
    const body = {
      jql: jql
    };
    return httpRequest(Object.assign({}, this.baseOptions, options), body);
  }

  versionsFor(projectKey) {
    const options = {
      path: this.completeBasePathWith(`project/${projectKey}/versions`)
    };
    return httpRequest(Object.assign({}, this.baseOptions, options));
  }

  completeBasePathWith(suffix) {
    return this.basePath + suffix;
  }
}

module.exports = JiraClient;