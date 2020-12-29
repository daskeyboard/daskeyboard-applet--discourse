const assert = require('assert');
const logger = require('daskeyboard-applet/lib/logger');
const t = require('../index');
const auth = require('./auth.json');

describe('QDiscourse', () => {
  async function makeApp() {
    let app = new t.QDiscourse();

    await app.processConfig({
      geometry: {
        width: 1,
        height: 1
      },
      authorization: {
        apiKey: auth.api_key,
      },
      applet: {
        user: { 
        forum:auth.forum_url,
        username:auth.username,
        api_username:auth.api_username,
        upColor: "#00FF00",
        downColor:"#FF0000"
        },
      }
    });

    return app;
  }

  describe('#run()', () => {
    it('runs', async function () {
      return makeApp().then(async app => {
        return app.run().then((signal) => {
          assert.ok(signal);
          logger.info(JSON.stringify(signal));
        }).catch((error) => {
          assert.fail(error);
          logger.info("didn't work");
        });
      })
    })
  })
})