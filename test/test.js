const assert = require('assert');
const t = require('../index');
require('dotenv').config()

describe('QDiscourse', () => {
  async function makeApp() {
    let app = new t.QDiscourse();

    await app.processConfig({
      geometry: {
        width: 1,
        height: 1
      },
      authorization: {
        apikey: process.env.API,
      }
    });

    app.config= {
        forum:"https://qforum.daskeyboard.com/",
        username:process.env.USERNAME,
        api_username:"Matthieu_Rioual",
        upColor: "#00FF00",
        downColor:"#FF0000"
      }
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