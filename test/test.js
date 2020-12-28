const assert = require('assert');
const t = require('../index');

describe('QDiscourse', () => {
  async function makeApp() {
    let app = new t.QDiscourse();

    await app.processConfig({
      geometry: {
        width: 1,
        height: 1
      },
      authorization: {
        apikey: "ef2de42be8ce7a61fbd49b67796ec20d237d06fcb760c2dcf65d29ed242adc84"
      }
    });

    app.config= {
        forum:"https://qforum.daskeyboard.com/",
        username:"Matthieu_Rioual",
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