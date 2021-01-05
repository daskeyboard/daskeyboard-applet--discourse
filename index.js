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
     * Configure the headers of http request
     */
    async applyConfig() {
        this.serviceHeaders = {
            'Content-Type': 'application/json',
            'Api-Key': this.authorization.apiKey,
            'Api-Username': this.config.api_username,
        };
    }

    /**
     * 
     * @param {*} host 
     * @param {*} username 
     */
    parsingHost(forum){
        // check if the last char of host is '/'. if so crop it.
        if (forum.charAt(forum.length - 1) == '/') {
            host = host.substring(0, host.length - 1);
        }
        if (forum.substring(0,7)!="http://" || forum.substring(0,8)!="https://"){
            return "https://"+forum;
        }
    }

    /**
     * Function that fetch asynchronously the notifications of an user on
     * the forum discourse informed
     * @param {*} hostUrl : forum url
     * @param {*} username : forum username
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
     * @param {*} response : json response from API
     * @param {*} warnerColor : key color
     * @param {*} warnerEffect :
     */
    async generateSignal(response, warnerColor, warnerEffect, host) {
        // if notifications exist in response
        if (response.notifications) {
            let signal = null;
            let notificationNumber = 0;
            for (let notification of response.notifications) {
                let isRead = notification.read;

                // check if the notification is read or not
                if (!isRead) {
                    notificationNumber++;
                }
            }

            // check if there are notifications
            if (notificationNumber != 0) {
                let message =
                    notificationNumber == 1
                        ? '1 unread notification on ' + host
                        : notificationNumber +
                          ' notifications unread on ' +
                          host;

                signal = new q.Signal({
                    points: [[new q.Point(warnerColor, warnerEffect)]],
                    name: 'Discourse',
                    message: message,
                    link: {
                        url:`${host}/u/${this.config.username}/notifications?filter=unread`,
                        label: 'Show in Discourse',
                    },
                });
            }
            return signal;
        }
        // if notifications doesn't exist in response
        else {
            return response;
        }
    }

    // main function running
    async run() {
        const warnerEffect = this.config.warnerEffect || 'BLINK';
        const warnerColor = this.config.warnerColor || '#FF0000';
        const username = this.config.username;
        let host = this.config.forum;

        let host = this.parsing(this.config.forum)

        // fecthing notifications
        let notifications = await this.getNotifications(host, username);

        // remove the https:// || https:// at the head of host url
        host = host.substring(8);
        
        // send the generated signal
        return this.generateSignal(
            notifications,
            warnerColor,
            warnerEffect,
            host
        );
    }
}

module.exports = {
    QDiscourse: QDiscourse,
};

const applet = new QDiscourse();
