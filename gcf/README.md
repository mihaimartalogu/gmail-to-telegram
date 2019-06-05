# Steps

## Set up new Google Cloud project

### Create the project

### Enable Billing

### Create a `Native Datastore` for the project
[https://console.cloud.google.com/datastore](https://console.cloud.google.com/datastore)

### Set up credentials

Go to [APIs & Services/Credentials](https://console.cloud.google.com/apis/credentials) and Create credentials, selecting `Create OAuth client ID`.

It will ask you to create the consent screen first:

#### Choose `Application type`: `Public`
#### Fill in the `Application Name`, `Logo`, `Privacy Policy` link etc.

 
Then create the credentials:
#### Choose `Application type`: `Web application`
#### `Authorized Javascript origins` and `Authorized redirect URIs`
The base URL is: https://`<REGION>`-`<PROJECT_ID>`.cloudfunctions.net



Once you created the credentials, download them into `client_secret.json` here in the `gcf/` folder.

## Set up API access
Go to the [API library](https://console.cloud.google.com/apis/library) and add `Gmail API`, `Cloud Functions API`, and `Cloud Pub/Sub API`.

## Set up PubSub topic
Go to [Pub/Sub](https://console.cloud.google.com/cloudpubsub) and create a new topic. The rest of the doc assumes you named it `tgfw`.
Then add a member `gmail-api-push@system.gserviceaccount.com` with the `Pub/Sub Editor` role in order to allow Gmail to push notifications.

## Fill in `.env.yaml` inside the `gcf/` folder
You will need at least the following setting:
```yaml
# secrets passed to the Google Cloud Functions

# comma-separated list of accounts authorized to use the forwarder
AUTHORIZED_ACCOUNTS: "example@gmail.com,example2@gmail.com"
```

## Init `gcloud` CLI
Run `gcloud init`, selecting the Google Cloud Project you just created.


## Provision init function
```
# in gcf/
gcloud functions deploy oauth2init --runtime nodejs8 --trigger-http
```

## Provision callback function
```
# in gcf/
gcloud functions deploy oauth2callback --runtime nodejs8 --trigger-http --env-vars-file .env.yaml
```

## Provision push notification handler
```
# in gcf/
gcloud functions deploy onNewMessage --runtime nodejs8 --trigger-topic tgfw
```

