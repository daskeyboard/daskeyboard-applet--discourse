const assert = require('assert');
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
        apikey: auth.apikey,
      },
      applet: {
        user: { 
        forum:"https://qforum.daskeyboard.com/",
        username:auth.username,
        api_username:"Matthieu_Rioual",
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
        }).catch((error) => {
          assert.fail(error)
        });
      })
    })
  })
})