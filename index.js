const q = require("daskeyboard-applet");
const request = require("request-promise");
const logger = q.logger;

class QDiscourse extends q.DesktopApp {
  constructor() {
    super();
    // run every 1 min
    this.pollingInterval = 1 * 60 * 1000;
  }

  //configure the headers of http request
  async applyConfig() {
    this.serviceHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Api-Key": this.authorization.apiKey
    };
  }

  //main function running
  async run() {
    const serviceUrl = this.config.forum + "notifications.json?username=" + this.config.username;
    let effect = "SET_COLOR";
    const downEffect = "BLINK";
    const upColor = this.config.upColor || "#00FF00";
    const downColor = this.config.downColor || "#FF0000";

    return request.get({
        url: serviceUrl,
        headers: Object.assign(this.serviceHeaders,{"Api-Username": this.config.api_username}),
        json: true,
      })
      .then((response) => {
        let color = upColor;
        let alerts = [];
        let number = 0;
        for (let notification of response.notifications) {
          let isRead = notification.read;
          let notifID = notification.id;

          logger.info(
            `Notification ${notifID} is ${isRead ? "read" : " unread"}`
          );
          

          if (!notification.read) {
            effect = downEffect;
            number++;
            color = downColor;
            alerts.push(notifID);
          }
        }

        logger.info("you have " + number + " notifications" + " unread");

        //look if we got at least one notification unread
        if (number != 0) {
          let signal = new q.Signal({
            points: [[new q.Point(color, effect)]],
            name: this.config.rootURL,
            message:"You have "+number+" unread notifications with id's :"+alerts.join(", "),
            link: {
              url: this.config.rootURL,
              label: "Open discourse web site",
            },
          });
          return signal;
        } 
        else {
          let signal = new q.Signal({
            points: [[new q.Point(color, effect)]],
            name: this.config.rootURL,
            message: "You have no unread notifications",
            link: {
              url: this.config.rootURL,
              label: "Open discourse web site",
            },
          });
          return signal;
        }
      })
      .catch((error) => {
        logger.error(`Got error sending ssh request to service : ${JSON.stringify(error)}`);
        //does not handdle internet issue
        if (`${error.message}`.includes("getaddrinfo")) {
        }
        //if the username does not exit
        else if (
          `${error.message}`.includes(
            "The requested URL or resource could not be found."
          )
        ) {
          logger.info(
            `The username does not exist, please give us another one.`
          );
          return q.Signal.error([
            "The username does not exist, please give us another one.",
            `Detail: ${error.message}`,
          ]);
        }
        //API key issue
        else {
          logger.info(
            `The  account you are trying to fetch is not reachable, please check if your API Key is valid and has global right scope action`
          );
          return q.Signal.error([
            "The  account you are trying to fetch is not reachable, please check if your API Key is valid and has global right scope action",
            `Detail: ${error.message}`,
          ]);
        }
      });
  }
}

module.exports = {
  QDiscourse: QDiscourse,
};

const applet = new QDiscourse();
