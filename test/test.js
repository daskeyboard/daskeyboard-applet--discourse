const assert = require('assert');
const logger = require('daskeyboard-applet/lib/logger');
const t = require('../index');
const auth = require('./auth.json');

describe('QDiscourse', () => {
    async function makeApp(apikey, forum, username) {
        let app = new t.QDiscourse();

        await app.processConfig({
            geometry: {
                width: 1,
                height: 1,
            },
            authorization: {
                apiKey: apikey,
            },
            applet: {
                user: {
                    forum_url: forum,
                    username: username,
                    downColor: '#FF0000',
                    downColor: 'SET_COLOR',
                },
            },
        });

        return app;
    }

    // Test global run function
    describe('#run()', () => {
        it('runs', async function () {
            return makeApp(auth.api_key, auth.forum_url, auth.username).then(
                async (app) => {
                    return app
                        .run()
                        .then((signal) => {
                            assert.ok(signal);
                            logger.info(JSON.stringify(signal));
                        })
                        .catch((error) => {
                            assert.fail(error);
                        });
                }
            );
        });
    });

    // Generate signal without errors with 0 then 2 notification unread
    describe('#generateSignal()', () => {
        it('generate a signal', async function () {
            return makeApp(auth.api_key, auth.forum_url, auth.username).then(
                async (app) => {
                    const actions = require('./goodResponseWith2NotificationsMock.json');
                    const signal = await app.generateSignal(
                        actions,
                        app.config.downColor,
                        app.config.downEffect
                    );
                    assert.ok(
                        signal.message.includes('2 notifications unread')
                    );
                }
            );
        });
    });

    // Fetch the notifications of the testing user
    describe('#getNotifications()', () => {
        it('fetch the notifications', async function () {
            return makeApp(auth.api_key, auth.forum_url, auth.username).then(
                async (app) => {
                    const response = await app.getNotifications(
                        app.config.forum_url,
                        app.config.username
                    );
                    logger.info(JSON.stringify(response));
                    assert.ok(response.notifications);
                }
            );
        });
    });

    // Trigger API Key error
    describe('#API-Key-error()', () => {
        it('trigger API Key error', async function () {
            return makeApp('56875645645', auth.forum_url, auth.username).then(
                async (app) => {
                    return app.run().then((signal) => {
                        logger.info(JSON.stringify(signal.errors));
                        assert(signal.errors);
                    });
                }
            );
        });
    });

    // Trigger url forum error
    describe('#URL error()', () => {
        it('trigger non existing url forum error', async function () {
            return makeApp(
                auth.api_key,
                'fjdkhfkjdsfh.com',
                auth.username
            ).then(async (app) => {
                return app.run().then((signal) => {
                    logger.info(JSON.stringify(signal.errors));
                    assert(signal.errors);
                });
            });
        });
    });
});
