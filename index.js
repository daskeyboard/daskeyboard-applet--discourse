const q = require("daskeyboard-applet");
const request = require("request-promise");
const logger = q.logger;

class QAWS extends q.DesktopApp {
  constructor() {
    super();
    // run every 1 min
    this.pollingInterval = 1 * 60 * 1000;
  }

  async applyConfig() {
    this.serviceHeaders = {
      "Content-Type": "application/json",
      "Api-Key": this.authorization.apikey,
      "Api_Username": this.config.api_username,
    };
    console.log(this.serviceHeaders);
  }

  async run() {
    const serviceUrl = this.config.discourseforum + 'notifications.json?username=' + this.config.username;
    const downEffect = 'BLINK';
    const upColor = this.config.upColor || '#00FF00';
    const downColor = this.config.downColor || '#FF0000';
    let effect = 'SET_COLOR';
    return request
    .get({
      url: serviceUrl,
      headers: this.serviceHeaders,
      json: true,
    })
    .then((response) => {

      let color = upColor;
      let alerts = [`ALARM `];
      let number = 0;

      for (let notification of response.notifications) {
        let isRead = notification.read;
        let notifID = notification.id;

        logger.info(`Notification ${notifID} is ${isRead ? 'read' : 'unread'} `);

        if (!isRead) {
          effect = downEffect;
          number++;
          color = downColor;
          alerts.push(notifID);
          logger.info("Notification with ID : "+notifID+" is unread");
        }
      }

      if (number!=0) {
        let signal = new q.Signal({
          points: [[new q.Point(color,effect)]],
          name: "AWS",
          message: "you have "+number+" unread notifications with id's :"+alerts.join(", "),
          link: {
            url: this.config.rootURL,
            label: "Open discourse web site",
          },
        });
        return signal;
      } else {
        let signal = new q.Signal({
          points: [[new q.Point(color, effect)]],
          name: "AWS",
          message: 'You have no unread notifications',
          link: {
            url: this.config.rootURL,
            label: "Open discourse web site",
          },
        });
        return signal;
      }

    })
    .catch((error) => {
      console.log(error);
      logger.error(
        `Got error sending ssh request to service: ${JSON.stringify(error)}`
      );
      if (`${error.message}`.includes("'You need to be logged in to do that.")) {
        return q.Signal.error([
          "You need to be connected to this discourse forum to allow parsing your notifications. Please log in : "+this.config.rootURL,
          `Detail: ${error.message}`,
        ]);
      } else {
        return q.Signal.error([
          "The servive is not reachable, please verify your internet connection",
          `Detail: ${error.message}`,
        ]);
      }
    });
  }
}

module.exports = {
  QAWS: QAWS,
};

const applet = new QAWS()