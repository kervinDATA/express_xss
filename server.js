const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const cache = require('memory-cache');

const { createMessage, getMessages, seedUsers } = require('./data-interface');

require('./authentication-setup');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secretKeyThatShouldBeInEnvironmentConfig',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/messages', (_, res) => res.send({ messages: getMessages() }));

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user) => {
    if (error) {
      return res.status(401).send({ error });
    }
    return req.login(user, () => res.send({ username: user.username }));
  })(req, res, next);
});

app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.sendStatus(401);
});

app.post(
  '/messages',
  [
    check('content').not().isEmpty().withMessage('Content may not be empty'),
    check('personalWebsiteURL')
      .isURL({ require_protocol: true })
      .withMessage('URL must be a valid HTTP URL starting with http:// or https://'),
  ],
  (req, res) => {
    const { content, personalWebsiteURL } = req.body;
    const errors = validationResult(req).array();

    if (errors.length) {
      return res.status(400).send({ errors: errors.reduce((acc, error) => ({ ...acc, [error.param]: error.msg }), {}) });
    }

    createMessage(req.user.username, content, personalWebsiteURL);
    return res.status(201).send({ messages: getMessages() });
  }
);

module.exports = app;
