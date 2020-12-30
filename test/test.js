const assert = require('assert');
const logger = require('daskeyboard-applet/lib/logger');
const t = require('../index');
const auth = require('./auth.json');


describe('QDiscourse', () => {
  async function makeApp(apikey,forum,username,api_username) {
    let app = new t.QDiscourse();

    await app.processConfig({
      geometry: {
        width: 1,
        height: 1
      },
      authorization: {
        apiKey: apikey,
      },
      applet: {
        user: { 
        forum:forum,
        username:username,
        api_username:api_username,
        upColor: "#00FF00",
        downColor:"#FF0000",
        upEffect:"SET_COLOR",
        downColor:"SET_COLOR"
        },
      }
    });

    return app;
  }

  //test global run function
  describe('#run()', () => {
    it('runs', async function () {
      return makeApp(auth.api_key,auth.forum_url,auth.username,auth.api_username).then(async app => {
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

  //generate signal without errors with 0 then 2 notification unread
  describe('#generateSignal()', ()=> {
    it('generate a signal', async function () {
      return makeApp(auth.api_key,auth.forum_url,auth.username,auth.api_username).then(async app => {
        const actions0 = require('./response-mook0.json');
        const signal0 =await app.generateSignal(actions0,app.config.upColor,app.config.downColor,app.config.upEffect,app.config.downEffect);
        assert.ok(signal0.message.includes("You have no unread notification"))
        const actions1 = require('./response-mook1.json');
        const signal1 =await app.generateSignal(actions1,app.config.upColor,app.config.downColor,app.config.upEffect,app.config.downEffect);
        assert.ok(signal1.message.includes("You have 2 unread notifications with id's :"));
        assert.ok(signal1.message.includes("3465115, 3464119"))
      })
    })
  })

  //fetch the notifications of the testing user
  describe('#getNotifications()', ()=> {
    it('fetch the notifications', async function () {
      return makeApp(auth.api_key,auth.forum_url,auth.username,auth.api_username).then(async app => {
        const response =await app.getNotifications(app.config.forum,app.config.username);
        assert.ok(response.notifications);
        logger.info(JSON.stringify(response.notifications));
      })
    })
  })

  //trigger API Key error
  describe('#API-Key-error()',()=>{
    it('trigger API Key error', async function () {
      return makeApp('56875645645',auth.forum_url,auth.username,auth.api_username).then(async app => {
        return app.run().then((signal) => {
          logger.info(JSON.stringify(signal))
          assert(signal.errors.includes('The account you are trying to fetch is not reachable, please check if your API Key is valid and has global right scope action.'))
        })
      });
    })
  })
  
  //trigger url forum error
  describe('#URL error()',()=>{
    it('trigger non existing url forum error', async function () {
      return makeApp(auth.api_key,'fjdkhfkjdsfh',auth.username,auth.api_username).then(async app => {
        return app.run().then((signal) => {
          logger.info(JSON.stringify(signal.errors))
          assert(signal.errors.includes("The Forum root URL is not reachable, please put a valid one."))
        })
      })
    })
  })

})
