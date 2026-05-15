const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./env');
const logger = require('./logger');

// Google OAuth 2.0 Strategy
// The actual user upsert is handled in auth.service.js
// Here we just pass the profile along.
const initPassport = () => {
    if (!config.google.clientId || config.google.clientId === "") {
        logger.warn('Google OAuth not configured — social login disabled');
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: config.google.clientId,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackUrl,
                scope: ['profile', 'email'],
            },
            (accessToken, refreshToken, profile, done) => {
                // done by controller
                return done(null, profile);
            }
        )
    );

    logger.info('Google OAuth strategy initialized');
};

module.exports = { initPassport, passport };
