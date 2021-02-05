# Q Applet for Discourse Admins

This Das Keyboard Q applet for Discourse admins blinks keyboard LEDs when new Discourse notifications for admins are available.

Discourse is a popular open source forum software. For more information about Discourse, visit <https://github.com/discourse/discourse>.

![Discourse applet on a Das Keyboard Q](assets/image.png "Das Keyboard Discourse applet")

This applet uses Discourse API.

## Changelog

[CHANGELOG.MD](CHANGELOG.md)

## Requirements and setup

Discourse admins need to create a Discourse API key with global read access. To create such a key, follow this link and, of course, adjust it for your Discourse installation domain name.

    https://your-forum.com/admin/key/new

## Installation

This applet requires a Das Keyboard Q Series: www.daskeyboard.com/q and an admin access to the /admin panel of a discourse forum.

Installation, configuration is done within the Das Keyboard Q Desktop application 
[https://www.daskeyboard.com/q](https://www.daskeyboard.com/q).

## Running tests

- Create an auth.json file looking like the template one and add your values.
- `yarn test`

## Resources

- Das Keyboard Q applet development documentation: <https://www.daskeyboard.io/applet-development/>
- [This applet GitHub repository](https://github.com/daskeyboard/daskeyboard-applet--discourse)

## Contributions

Pull requests are welcome.

## Copyright / License

[LICENSE.MD](CHANGELOG)
