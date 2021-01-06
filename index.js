const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

class QDiscourse extends q.DesktopApp {
    constructor() {
        super();
        // Run every 1 min
        this.pollingInterval = 1 * 60 * 1000;
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
        // Check if the last char of host is '/'. if so crop it.
        if (forum_url.charAt(forum_url.length - 1) == '/') {
            forum_url = forum_url.substring(0, forum_url.length - 1);
        }
        if (
            forum_url.substring(0, 7) != 'http://' &&
            forum_url.substring(0, 8) != 'https://'
        ) {
            return 'https://' + forum_url;
        }
        return forum_url;
    }

    /**
     * Function that fetch asynchronously the notifications of an user on
     * the forum url discourse informed
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
                        error.message
                    )}`
                );
                // Host name error
                if (`${error.message}`.includes('getaddrinfo')) {
                    return q.Signal.error(['The forum root URL is not reachable, please put a valid one.']);
                }
                // API key error
                else if (`${error.message}`.includes('403')) {
                    return q.Signal.error(['The API Key or the username are not valid, please check your configuration']);
                }
                // Unknow error
                else {
                    return q.Signal.error([
                        'Something went wrong, please check your configuration',
                    ]);
                }
            });
    }

    /**
     * Check it the response has notifications object
     */
    checkNotifications(response) {
        try {
            if(response.notifications)
            return true;
        } catch (error) {
            return false;
        }
    }
    /**
     * Send a q signal according to the response from API request
     *
     * @param {*} response : json response from API
     * @param {*} warnerColor : key color
     * @param {*} warnerEffect :
     */
    async generateSignal(response, warnerColor, warnerEffect, host) {
        // If notifications exist in response
        if (this.checkNotifications(response)) {
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
        let notifications = await this.getNotifications(host, username);

        // Remove the https:// || https:// at the head of host url
        host = host.substring(8);

        // Send the generated signal
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
