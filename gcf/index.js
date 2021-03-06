"use strict";

const google = require("googleapis");
const gmail = google.gmail("v1");
const querystring = require(`querystring`);
const pify = require("pify");
const fetch = require("node-fetch");
const Datastore = require("@google-cloud/datastore");
const path = require("path");
const fs = require("fs");
const flatten = require("lodash/flatten");

const nconf = require(`nconf`);

nconf.env().file({ file: "config.json" });

// Configuration constants
const GCF_REGION = nconf.get("GCF_REGION");
const GCLOUD_PROJECT = nconf.get("GCLOUD_PROJECT");
const TOPIC_ID = nconf.get("TOPIC_ID");

const config = {
  FRONTEND_URL: nconf.get("FRONTEND_URL"),
  AUTHORIZED_ACCOUNTS: nconf.get("AUTHORIZED_ACCOUNTS") || "",

  // Computed values
  GCF_BASE_URL: `https://${GCF_REGION}-${GCLOUD_PROJECT}.cloudfunctions.net`,
  TOPIC_NAME: `projects/${GCLOUD_PROJECT}/topics/${TOPIC_ID}`,
  GCF_REGION: GCF_REGION
};

const datastore = new Datastore();

// Retrieve OAuth2 config
const clientSecretPath = "client_secret.json";
const clientSecretJson = JSON.parse(fs.readFileSync(clientSecretPath));
const auth = new google.auth.OAuth2(
  clientSecretJson.web.client_id,
  clientSecretJson.web.client_secret,
  `${config.GCF_BASE_URL}/oauth2callback`
);

function saveToken(emailAddress, token) {
  return datastore.save({
    key: datastore.key(["oauth2Token", emailAddress]),
    data: token
  });
}

async function fetchToken(emailAddress) {
  const token = await datastore
    .get(datastore.key(["oauth2Token", emailAddress]))
    .then(tokens => tokens[0]);
  if (!token) {
    throw new Error("Missing authorization token");
  }

  // Validate token
  if (!token.expiry_date || token.expiry_date < Date.now() + 60000) {
    auth.credentials.refresh_token = token.refresh_token;
    return new Promise((resolve, reject) => {
      // Pify and auth don't mix
      auth.refreshAccessToken((err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    }).then(() => saveToken(emailAddress, auth.credentials));
  } else {
    auth.credentials = token;
    return Promise.resolve();
  }
}

exports.oauth2init = (req, res) => {
  const { authorizedSender, tgGroup, tgAPIKey } = req.query;

  // OAuth2 consent form URL. We force always displaying the consent form (by setting prompt: consent),
  // which together with access_type: offline ensures we get a refresh token every time.
  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    prompt: "consent",
    state: `${authorizedSender},${tgGroup},${tgAPIKey}`
  });
  return res.redirect(authUrl);
};

exports.oauth2callback = async (req, res) => {
  const code = req.query.code;
  try {
    // OAuth2: Exchange authorization code for access token
    // auth and pify don't play nice together
    const token = await new Promise((resolve, reject) => {
      auth.getToken(code, (err, token) => (err ? reject(err) : resolve(token)));
    });

    // Get user email (to use as a Datastore key)
    auth.credentials = token;
    const emailAddress = await pify(gmail.users.getProfile)({
      auth,
      userId: "me"
    }).then(x => x.emailAddress);

    const emailAddressOnly = emailAddress.replace(/.*<(.+)>/, "$1");
    if (!config.AUTHORIZED_ACCOUNTS.split(",").includes(emailAddressOnly)) {
      throw Error(
        `Account not authorized. ${emailAddressOnly} not in ${
          config.AUTHORIZED_ACCOUNTS
        }`
      );
    }

    // Store token in Datastore
    await datastore.save({
      key: datastore.key(["oauth2Token", emailAddress]),
      data: token
    });

    // the Telegram info is passed in through the state parameter
    const [authorizedSender, tgGroup, tgAPIKey] = req.query.state.split(","); // OK because no comma in any of these fields

    // store Telegram info in Datastore
    datastore.save({
      key: datastore.key(["telegramInfo", emailAddress]),
      data: { tgGroup, tgAPIKey, authorizedSender }
    });

    // Set up gmail watch
    await pify(gmail.users.watch)({
      auth,
      userId: "me",
      resource: {
        labelIds: ["INBOX"],
        topicName: config.TOPIC_NAME
      }
    });

    const messageEstablished = `➡ Successfully set up forwarding of mailbox ${emailAddress}\n\nAll mails ${
      authorizedSender ? `by ${authorizedSender} ` : ""
    }will be ➡ to this group`;
    const url = `https://api.telegram.org/bot${tgAPIKey}/sendMessage?chat_id=${tgGroup}&text=${querystring.escape(
      messageEstablished
    )}`;
    console.log("TG url:", url);
    const tgReply = await fetch(url).then(res => res.json());
    console.log("tgReply:", tgReply);
    console.log("alles gut:", tgReply.ok);
    const params = {
      emailAddress,
      authorizedSender,
      tgGroup,
      tgAPIKey,
      messageEstablished
    };
    return res.redirect(
      `${config.FRONTEND_URL}/success?${Object.keys(params)
        .map(k => `${k}=${querystring.escape(params[k])}`)
        .join("&")})}`
    );
  } catch (err) {
    console.error(err);
    res.redirect(`${config.FRONTEND_URL}/error?err=${querystring.escape(err)}`);
  }
};

/**
 * Reinitialize all watches that have a valid token
 */
exports.reinitWatches = async (req, res) => {
  const query = datastore.createQuery("oauth2Token");
  const [tokens] = await datastore.runQuery(query);
  tokens.forEach(async token => {
    const emailAddress = token[datastore.KEY].name;
    const goodToken = await fetchToken(emailAddress); // fetchToken handles token refresh if needed
    const { historyId } = await pify(gmail.users.watch)({
      auth,
      userId: "me",
      resource: {
        labelIds: ["INBOX"],
        topicName: config.TOPIC_NAME
      }
    });
    console.log("saving historyId: ", historyId);
    await datastore.save({
      key: datastore.key(["historyId", emailAddress]),
      data: historyId
    });
  });
  res.write(`Watches reinitialized: ${tokens.length}`);
  res.status(200).end();
};

/**
 * Process new messages as they are received
 */
exports.onNewMessage = async event => {
  // Parse the Pub/Sub message
  const dataStr = Buffer.from(event.data, "base64").toString("ascii");
  const dataObj = JSON.parse(dataStr);
  const { emailAddress } = dataObj;

  const token = await fetchToken(emailAddress);

  // thanks datastore for the extra hoops needed for retrieving a number...
  const startHistoryId = await datastore
    .get(datastore.key(["historyId", emailAddress]))
    .then(hIds => hIds[0])
    .then(hIdObject =>
      Object.keys(hIdObject)
        .map(k => hIdObject[k])
        .join("")
    )
    .then(hIdString => parseInt(hIdString));

  console.log("startHistoryId: ", startHistoryId);
  const { history, historyId } = await pify(gmail.users.history.list)({
    auth,
    userId: "me",
    startHistoryId
  });
  console.log("historyResults:", history[0].messages, historyId);
  const msgs = await Promise.all(
    flatten(
      history.map(h =>
        h.messages.map(({ id }) =>
          pify(gmail.users.messages.get)({
            auth,
            id,
            userId: "me"
          })
        )
      )
    )
  );
  console.log(`Processing ${msgs.length} messages`);

  await Promise.all(
    msgs.map(async msg => {
      const from = msg.payload.headers.find(h => h.name === "From").value;

      let bodyStr;
      if (msg.payload.parts) {
        bodyStr = msg.payload.parts
          .filter(p => p.mimeType === "text/plain")
          .map(p => Buffer.from(p.body.data, "base64").toString("ascii"))
          .join("\n");
      } else {
        bodyStr = Buffer.from(msg.payload.body.data, "base64").toString(
          "ascii"
        );
      }

      const [{ authorizedSender, tgGroup, tgAPIKey }] = await datastore.get(
        datastore.key(["telegramInfo", dataObj.emailAddress])
      );
      if (authorizedSender && from.includes(authorizedSender)) {
        const url = `https://api.telegram.org/bot${tgAPIKey}/sendMessage?chat_id=${tgGroup}&parse_mode=Markdown&text=${querystring.escape(
          `➡ from ${from}:\n\n${bodyStr}`
        )}`;
        return fetch(url)
          .then(res => res.json())
          .then(({ ok }) => {
            if (!ok) {
              throw Error(`Failed processing message id ${msg.id}`);
            }
          });
      }
    })
  );
  // successfully forwarded messages from history, store this historyId
  await datastore.save({
    key: datastore.key(["historyId", emailAddress]),
    data: historyId
  });
  console.log("moved forward historyId to", historyId);
};
