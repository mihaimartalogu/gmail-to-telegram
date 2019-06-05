# Gmail to Telegram forwarder
A tool that uses Google Cloud Functions hooked up with the Gmail API in order to forward emails received on a Gmail account
to a Telegram group chat.

I personally use it to forward the messages from my inReach satellite tracker (which can send messages to an email address) to the Telegram group I set up for my emergency contacts.

## Google cloud setup
Follow the instructions under `gcf/README.md`.


## Deploy to GitHub Pages
To deploy, commit to GitHub, then run:
```
yarn run deploy
```