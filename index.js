const q = require('daskeyboard-applet');
const request = require('request-promise');
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
            'Content-Type': 'application/json',
            'Api-Key': this.authorization.apiKey,
            'Api-Username': this.config.username,
        };
    }

    //function that fetch asynchronously the notifications of an user on 
    //the forum discourse informed
    async getNotifications(forum_url, username) {
        return request
            .get({
                url: forum_url + 'notifications.json?username=' + username,
                headers: this.serviceHeaders,
                json: true,
            })
            .catch((error) => {
                logger.error(
                    `Got error sending http request to service : ${JSON.stringify(
                        error
                    )}`
                );
                //does not handdle internet issue
                if (`${error.message}`.includes('getaddrinfo')) {
                }
                //if the username does not exit
                else if (`${error.message}`.includes('Invalid URI')) {
                    logger.info(`Wrong URL`);
                    return q.Signal.error([
                        'The Forum root URL is not reachable, please put a valid one.',
                        `Detail: ${error.message}`,
                    ]);
                }
                //API key issue
                else {
                    logger.info(
                        `The account you are trying to fetch is not reachable, \
                        please check if your API Key is valid, has global right \
                        scope action and if the username is  valid.`
                    );
                    return q.Signal.error([
                        'The account you are trying to fetch is not reachable, \
                        please check if your API Key is valid and has global right\
                         scope action.',
                        `Detail: ${error.message}`,
                    ]);
                }
            });
    }

    //Send a q signal according to the response from API request
    async generateSignal(response, upColor, downColor, upEffect, downEffect) {
        //if the answer is json response with notification array
        if (response.notifications) {
            let color = upColor;
            let effect = upEffect;
            //Variable that stores the number of unread notification
            let number = 0;
            //Varaible that stores the ids of unread notification
            let alerts = [];
            for (let notification of response.notifications) {
                let isRead = notification.read;
                let notifID = notification.id;

                logger.info(
                    `Notification ${notifID} is ${isRead ? 'read' : ' unread'}`
                );
                //Check if the notification is read or not
                if (!isRead) {
                    effect = downEffect;
                    number++;
                    color = downColor;
                    alerts.push(notifID);
                }
            }

            logger.info('you have ' + number + ' notifications' + ' unread');

            //look if we got at least one notification unread
            if (number != 0) {
                let signal = new q.Signal({
                    points: [[new q.Point(color, effect)]],
                    name: `${this.config.forum.substring(8)}`,
                    message:
                        'You have ' +
                        number +
                        ' unread notifications with ids :' +
                        alerts.join(', '),
                    link: {
                        url: this.config.forum,
                        label: 'Open discourse web site',
                    },
                });
                return signal;
            } else {
                let signal = new q.Signal({
                    points: [[new q.Point(color, effect)]],
                    name: `${this.config.forum.substring(8)}`,
                    message: 'You have no unread notification',
                    link: {
                        url: this.config.forum,
                        label: 'Open discourse web site',
                    },
                });
                return signal;
            }
        }
        //if the answer is an error, send back the q error signal
        else {
            return response;
        }
    }

    //main function running
    async run() {
        //fecthing notifications
        const forum_url = this.config.forum;
        const username = this.config.username;
        let notifications = await this.getNotifications(forum_url, username);
        //generate the q signal
        const upEffect = this.config.upEffect || 'SET_COLOR';
        const downEffect = this.config.upEffect || 'BLINK';
        const upColor = this.config.upColor || '#00FF00';
        const downColor = this.config.downColor || '#FF0000';
        let signal = this.generateSignal(
            notifications,
            upColor,
            downColor,
            upEffect,
            downEffect
        );
        return signal;
    }
}

module.exports = {
    QDiscourse: QDiscourse,
};

const applet = new QDiscourse();
