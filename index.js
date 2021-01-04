const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

class QDiscourse extends q.DesktopApp {
    constructor() {
        super();
        // run every 1 min
        this.pollingInterval = 1 * 60 * 1000;
    }

    /**
     * configure the headers of http request
     */
    async applyConfig() {
        this.serviceHeaders = {
            'Content-Type': 'application/json',
            'Api-Key': this.authorization.apiKey,
            'Api-Username': this.config.username,
        };
    }

    /**
     * Function that fetch asynchronously the notifications of an user on 
     * the forum discourse informed
     * @param {*} host 
     * @param {*} username 
     */
    async getNotifications(host, username) {
        return request
            .get({
                url: host + '/notifications.json?username=' + username,
                headers: this.serviceHeaders,
                json: true,
            })
            .catch((error) => {
                logger.error(
                    `Discourse : Got error sending http request to service : ${JSON.stringify(
                        error
                    )}`
                );
                // does not handdle internet issue
                if (`${error.message}`.includes('getaddrinfo')) {
                }
                // if the username does not exit
                else if (`${error.message}`.includes('Invalid URI')) {
                    return q.Signal.error([
                        'The Forum root URL is not reachable, please put a valid one.',
                        `Detail: ${error.message}`,
                    ]);
                }
                // API key issue
                else {
                    return q.Signal.error([
                        'The account you are trying to fetch is not reachable, \
                        please check if your API Key is valid and has global right\
                         scope action.',
                        `Detail: ${error.message}`,
                    ]);
                }
            });
    }

    /**
     * Send a q signal according to the response from API request
     * 
     * @param {*} response 
     * @param {*} downColor 
     * @param {*} downEffect 
     */
    async generateSignal(response, downColor, downEffect) {
        // if the answer is json response with notification array
        if (response.notifications) {
            let signal=null;
            let color = upColor;
            let effect = upEffect;
            // variable that stores the number of unread notification
            let notificationNumber = 0;
            // variable that stores the ids of unread notification
            let alerts = [];
            for (let notification of response.notifications) {
                let isRead = notification.read;
                let notifID = notification.id;

                // check if the notification is read or not
                if (!isRead) {
                    effect = downEffect;
                    notificationNumber++;
                    color = downColor;
                    alerts.push(notifID);
                }
            }


            // look if we got at least one notification unread
            if (notificationNumber != 0) { 
                logger.info('you have ' + notificationNumber + ' notifications' + ' unread');
                signal = new q.Signal({
                    points: [[new q.Point(color, effect)]],
                    name: `${this.config.forum}`,
                    message:
                        'You have ' +
                        notificationNumber +
                        ' unread notifications with ids :' +
                        alerts.join(', '),
                    link: {
                        url: this.config.forum+"/u/"+this.config.username+"/notifications?filter=unread",
                        label: 'Show in Discourse',
                    },
                });   
            }
            return signal;
        }
        // if the answer is an error, send back the q error signal
        else {
            return response;
        }
    }

    // main function running
    async run() {
        // check if the last char of host is '/'. if so crop it.
        if(this.config.forum.charAt(this.config.forum.length-1) == '/'){
            var host = this.config.forum.substring(0,this.config.forum.length-1);
        }
        else
            var host = this.config.forum;
        const username = this.config.username;
        // fecthing notifications
        let notifications = await this.getNotifications(host, username);
        const downEffect = this.config.downEffect || 'BLINK';
        const downColor = this.config.downColor || '#FF0000';
        // generate the q signal
        let signal = this.generateSignal(
            notifications,
            downColor,
            downEffect
        );
        return signal;
    }
}

module.exports = {
    QDiscourse: QDiscourse,
};

const applet = new QDiscourse();
