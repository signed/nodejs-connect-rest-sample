const express = require('express');
const router = express.Router();
const authHelper = require('./authHelper.js');
const requestUtil = require('./requestUtil.js');
const emailer = require('./emailer.js');
const JiraClient = require('./JiraClient');
const _ = require('lodash');
const currentRelease = require('./CurrentRelease');

router.get('/', function (req, res) {
  // check for token
  if (req.cookies.REFRESH_TOKEN_CACHE_KEY === undefined) {
    res.redirect('login');
    return;
  }
  requestUtil.getUserData(req.cookies.ACCESS_TOKEN_CACHE_KEY, processUserDataResponse(req, res));
});

// curl -X GET "http://localhost:3000/releases/current"
router.get('/releases/current', function (req, res) {
  currentRelease.getCurrentRelease()
    .then(currentRelease => {
      if (!currentRelease) {
        res.send(404);
        return;
      }
      res.json(currentRelease)
    })
    .catch(error => res.send(500));
});

router.post('/releases/current', function (req, res) {
  currentRelease.getCurrentRelease()
    .then(release => {
      if (release) {
        res.send(409);
        return;
      }
      const initial = {
        version: '0.3.0',
        items: [
          {
            name: 'SAM-7',
            text: 'First new issue with version',
            category: 'customer-facing',
            link: 'http://localhost:2990/jira/browse/SAM-7'
          },
          {
            name: 'SAM-6',
            text: 'What\'s next',
            category: 'customer-facing',
            link: 'http://localhost:2990/jira/browse/SAM-6'
          }
        ]
      };
      return currentRelease.putCurrentRelease(initial);
    })
    .then(currentRelease => res.json(currentRelease))
    .catch(e => {
      console.log(e);
      res.send(500);
    })
});

// curl -X PUT -H "Content-Type: application/json" -d '{"version":"1.2.3"}' "http://localhost:3000/releases/current"
router.put('/releases/current', function (req, res) {
  currentRelease.putCurrentRelease(req.body)
    .then(release => res.json(release))
    .catch(error => res.send(500));
});

router.delete('/releases/current', function (req, res) {
  currentRelease.deleteCurrentRelease()
    .then(() => res.send(204))
    .catch(error => res.send(500))
});

router.get('/releases/last', function (req, res) {
  res.send(404);
});

router.get('/jira/versions', function (req, res) {
  new JiraClient().versionsFor('SAM')
    .then(versionsString => {
      const versions = JSON.parse(versionsString);

      res.json(_.map(versions, function (version) {
        return {
          id: version.id,
          link: 'http://localhost:2990/jira/browse/SAM/fixforversion/' + version.id,
          name: version.name,
          description: version.description,
        }
      }));
    })
    .catch(error => res.send(500));
});

router.get('/jira/versions/:id', function (req, res) {
  //new JiraClient().
});

router.get('/jira', function (req, res) {
  const jiraClient = new JiraClient();
  const renderError = (err) => res.render('jira', {error: err});

  const responseData = {header: 'Welcome'};

  const issues = jiraClient.search('project=SAM AND fixVersion = next-release')
    .then(issuesJson => Object.assign(responseData, {issues: JSON.parse(issuesJson)}.issues));
  const versions = jiraClient.versionsFor('SAM')
    .then(versionsJson => Object.assign(responseData, {versions: JSON.parse(versionsJson)}));

  Promise.all([versions, issues])
    .then(() => res.render('jira', responseData))
    .catch(renderError);

});

router.get('/disconnect', function (req, res) {
  req.session.destroy();
  res.clearCookie('nodecookie');
  clearCookies(res);
  res.status(200);
  res.redirect('http://localhost:3000');
});

/* GET home page. */
router.get('/login', function (req, res) {
  if (req.query.code !== undefined) {
    authHelper.getTokenFromCode(req.query.code, function (e, accessToken, refreshToken) {
      if (e === null) {
        // cache the refresh token in a cookie and go back to index
        res.cookie(authHelper.ACCESS_TOKEN_CACHE_KEY, accessToken);
        res.cookie(authHelper.REFRESH_TOKEN_CACHE_KEY, refreshToken);
        res.redirect('/');
      } else {
        console.log(JSON.parse(e.data).error_description);
        res.status(500);
        res.send();
      }
    });
  } else {
    res.render('login', {auth_url: authHelper.getAuthUrl()});
  }
});

const processUserDataResponse = function (req, res) {
  return function (firstRequestError, firstTryUser) {
    if (firstTryUser !== null) {
      req.session.user = firstTryUser;
      res.render(
        'sendMail',
        {
          display_name: firstTryUser.displayName,
          user_principal_name: firstTryUser.userPrincipalName
        }
      );
      return;
    }

    if (hasAccessTokenExpired(firstRequestError)) {
      // Handle the refresh flow
      authHelper.getTokenFromRefreshToken(
        req.cookies.REFRESH_TOKEN_CACHE_KEY,
        function (refreshError, accessToken) {
          res.cookie(authHelper.ACCESS_TOKEN_CACHE_KEY, accessToken);
          if (accessToken !== null) {
            requestUtil.getUserData(
              req.cookies.ACCESS_TOKEN_CACHE_KEY,
              function (secondRequestError, secondTryUser) {
                if (secondTryUser !== null) {
                  req.session.user = secondTryUser;
                  res.render(
                    'sendMail',
                    {
                      display_name: secondTryUser.displayName,
                      user_principal_name: secondTryUser.userPrincipalName
                    }
                  );
                } else {
                  clearCookies(res);
                  renderError(res, secondRequestError);
                }
              }
            );
          } else {
            renderError(res, refreshError);
          }
        });
      return;
    }

    renderError(res, firstRequestError);
  };
};

router.post('/', function (req, res) {
  const destinationEmailAddress = req.body.default_email;
  const mailBody = emailer.generateMailBody(
    req.session.user.displayName,
    destinationEmailAddress
  );
  const templateData = {
    display_name: req.session.user.displayName,
    user_principal_name: req.session.user.userPrincipalName,
    actual_recipient: destinationEmailAddress
  };

  requestUtil.postSendMail(
    req.cookies.ACCESS_TOKEN_CACHE_KEY,
    JSON.stringify(mailBody),
    function (firstRequestError) {
      if (!firstRequestError) {
        res.render('sendMail', templateData);
      } else if (hasAccessTokenExpired(firstRequestError)) {
        // Handle the refresh flow
        authHelper.getTokenFromRefreshToken(
          req.cookies.REFRESH_TOKEN_CACHE_KEY,
          function (refreshError, accessToken) {
            res.cookie(authHelper.ACCESS_TOKEN_CACHE_KEY, accessToken);
            if (accessToken !== null) {
              requestUtil.postSendMail(
                req.cookies.ACCESS_TOKEN_CACHE_KEY,
                JSON.stringify(mailBody),
                function (secondRequestError) {
                  if (!secondRequestError) {
                    res.render('sendMail', templateData);
                  } else {
                    clearCookies(res);
                    renderError(res, secondRequestError);
                  }
                }
              );
            } else {
              renderError(res, refreshError);
            }
          });
      } else {
        renderError(res, firstRequestError);
      }
    }
  );
});

function hasAccessTokenExpired(e) {
  if (!e.innerError) {
    return false;
  }
  return e.code === 401 &&
    e.innerError.code === 'InvalidAuthenticationToken' &&
    e.innerError.message === 'Access token has expired.';

}

function clearCookies(res) {
  res.clearCookie(authHelper.ACCESS_TOKEN_CACHE_KEY);
  res.clearCookie(authHelper.REFRESH_TOKEN_CACHE_KEY);
}

function renderError(res, e) {
  res.render('error', {
    message: e.message,
    error: e
  });
}

module.exports = router;
