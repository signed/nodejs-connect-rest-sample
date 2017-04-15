const express = require('express');
const router = express.Router();
const authHelper = require('./authHelper.js');
const requestUtil = require('./requestUtil.js');
const emailer = require('./emailer.js');
const {httpRequest} = require('./httpClient');

/* GET home page. */
router.get('/', function (req, res) {
  // check for token
  if (req.cookies.REFRESH_TOKEN_CACHE_KEY === undefined) {
    res.redirect('login');
    return;
  }
  requestUtil.getUserData(req.cookies.ACCESS_TOKEN_CACHE_KEY, processUserDataResponse(req, res));
});

router.get('/jira', function (req, res) {

  //curl -u admin:admin -X GET -H "Content-Type: application/json" https://localhost:2990/jira/rest/api/2/project/SAM/versions
  //curl -u admin:admin -X GET -H "Content-Type: application/json" https://localhost:2990/jira/rest/api/2/search?jql=project%20%3D%20SAM%20AND%20fixVersion%20%3D%20next-release
  let projectKey = 'SAM';
  const options = {
    protocol: 'http:',
    host: 'localhost',
    port: '2990',
    path: '/jira/rest/api/2/project/' + projectKey + '/versions',
    method: 'GET',
    auth: 'admin:admin',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  httpRequest(options)
    .then((versionsJson) => res.render('jira', {versions: JSON.parse(versionsJson)}))
    .catch((err) => res.render('jira', {error: err}));
});

router.get('/disconnect', function (req, res) {
  // check for token
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
