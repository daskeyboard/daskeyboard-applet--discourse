const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

class QDiscourse extends q.DesktopApp {
    constructor() {
        super();
        // Run every 15 min
        this.pollingInterval = 15 * 60 * 1000;
    }

    /**
     * Configure the headers of http request
     */
    async applyConfig() {
        this.serviceHeaders = {
            'Content-Type': 'application/json',
            'Api-Key': this.authorization.apiKey,
            'Api-Username': this.config.username,
        };
    }

    /**
     * Make sure url provided by user is well formated
     *
     * @param {*} forum_url
     */
    parsingHost(forum_url) {
        // If the last char of host is '/', crop it.
        if (forum_url.charAt(forum_url.length - 1) == '/') {
            forum_url = forum_url.substring(0, forum_url.length - 1);
        }
        // If user added protocol
        if (
            forum_url.substring(0, 7) == 'http://' ||
            forum_url.substring(0, 8) == 'https://'
        ) {
            return forum_url;
        }else{
            // Need to add protocol
            return  'https://' + forum_url;;
        }
    }

    /**
     * Function that fetch asynchronously the notifications of an user on
     * the forum url discourse informed
     * @param {*} hostUrl : forum url
     * @param {*} username : forum username
     */
    async getNotifications(host, username) {
        logger.info(`Requesting Discourse notification on host: ${host} and username: ${username}`)
        return request
            .get({
                url: host + '/notifications.json?username=' + username,
                headers: this.serviceHeaders,
                json: true,
            })
            .catch((error) => {
                logger.error(
                    `Discourse : Got error sending http request to service : ${JSON.stringify(
                        error.message
                    )}`
                );
                // API key error
                if (`${error.message}`.includes('403')) {
                    return q.Signal.error([
                        'The API Key or the username are not valid, please check your configuration.',
                    ]);
                }
                // Unknow error
                else {
                    return q.Signal.error([
                        'Something went wrong, please check your configuration or your internet connection.',
                    ]);
                }
            });
    }

    /**
     * Send a q signal according to the response from API request
     *
     * @param {*} response : json response from API
     * @param {*} warnerColor : key color
     * @param {*} warnerEffect : key effect
     */
    async generateSignal(response, warnerColor, warnerEffect, host) {
        // If notifications exist in response
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

            // Check if there are notifications
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
                        url: `https://${host}/u/${this.config.username}/notifications?filter=unread`,
                        label: 'Show in Discourse',
                    },
                });
            }
            return signal;
        } else {
            return response;
        }
    }

    // Main function running
    async run() {
        const warnerEffect = this.config.warnerEffect || 'BLINK';
        const warnerColor = this.config.warnerColor || '#FF0000';
        const username = this.config.username;
        let host = this.parsingHost(this.config.forum_url);
        // Fecthing notifications
        return this.getNotifications(host, username).then((notifications) => {
            // Remove protovol into the host to display beautiful popup
            const hostWithoutProtocol = host.split('//')[1];
            // Send the generated signal
            return this.generateSignal(
                notifications,
                warnerColor,
                warnerEffect,
                hostWithoutProtocol
            );
        });
    }
}

module.exports = {
    QDiscourse: QDiscourse,
};

const applet = new QDiscourse();
