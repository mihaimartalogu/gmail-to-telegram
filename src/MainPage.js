import React, { useState, Fragment, useEffect } from "react";

import { makeStyles } from "@material-ui/core/styles";
import TitleContext, { withSetTitle } from "./TitleContext";
import {
  Typography,
  Grid,
  TextField,
  CircularProgress,
  Button,
  Link
} from "@material-ui/core";
import querystring from "query-string";

const useStyles = makeStyles(theme => ({
  root: {
    width: "90%"
  },
  button: {
    marginRight: theme.spacing(1)
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  }
}));

export const mainPageTitle = "Gmail to Telegram forwarder";

function MainPage({ setTitle }) {
  const classes = useStyles();
  const [botApiToken, setBotApiToken] = useState({});
  const [shouldRetry, setShouldRetry] = useState(0);
  const [group, setGroup] = useState({});
  const [fetching, setFetching] = useState(false);
  const [authorizedSender, setAuthorizedSender] = useState("");

  useEffect(() => {
    setTitle(mainPageTitle);
  }, [setTitle]);

  useEffect(() => {
    if (botApiToken.id) {
      const tgAPI = `https://api.telegram.org/bot${botApiToken.id}:${
        botApiToken.token
      }`;
      async function getUpdates() {
        setFetching(true);
        const updates = await fetch(`${tgAPI}/getUpdates`).then(d => d.json());
        updates.result
          ? updates.result
              .filter(
                upd =>
                  !!(
                    upd.message["new_chat_member"] &&
                    upd.message["new_chat_member"].id.toString() ===
                      botApiToken.id
                  )
              )
              .forEach(upd => setGroup(upd.message.chat))
          : setGroup({});
        setFetching(false);
      }
      getUpdates();
    }
    // 674223707:AAEbv5ZFapRPcqbTNar_GQZz_pR95cBw7jw
    // fetch("https://api.telegram.org/bot674223707:AAEbv5ZFapRPcqbTNar_GQZz_pR95cBw7jw/getUpdates
    // )
  }, [botApiToken, shouldRetry]);

  return (
    <Fragment>
      <div className={classes.root}>
        <Grid container direction="column">
          <Typography
            className={classes.instructions}
            style={{ marginTop: "5em" }}
          >
            You will need a Telegram bot that you own. You can use{" "}
            <a href="https://telegram.me/BotFather">BotFather</a> to set one up,
            you just need to add @BotFather to your contacts, then tell him
            "/newbot". Once you have your bot, enter its HTTP API token below.
            BotFather displays the token when it creates your bot.
          </Typography>

          <TextField
            fullWidth
            onChange={event => {
              const m = event.target.value.match(/^(\d{9}):(.{35})$/);
              if (m) {
                setBotApiToken({ id: m[1], token: m[2] });
              }
            }}
            placeholder="Bot HTTP API token"
          />

          {botApiToken.id && (
            <Grid container justify="center">
              <Typography noWrap style={{ paddingRight: "1em" }}>
                Detected group:{" "}
              </Typography>
              {fetching ? (
                <CircularProgress />
              ) : group.title ? (
                <Typography noWrap color="primary">
                  {group.title}
                </Typography>
              ) : (
                <Typography color="error" noWrap>
                  Unknown
                </Typography>
              )}
              {!fetching && !group.title && (
                <>
                  <Typography color="error" className={classes.instructions}>
                    The tool needs to know the group where you want your
                    messages sent. In order to have this info, you will need to
                    add your bot to that group, or if it's already added, remove
                    and add it again. Click Retry to try again.
                  </Typography>
                  <Button onClick={() => setShouldRetry(v => v + 1)}>
                    Retry
                  </Button>
                </>
              )}
            </Grid>
          )}

          <Typography className={classes.instructions}>
            You can restrict the forwarding to a single sender by typing the
            email address below. If left empty, all mail will get forwarded.
          </Typography>
          <TextField
            fullWidth
            placeholder="Filter by sender"
            value={authorizedSender}
            onChange={ev => setAuthorizedSender(ev.target.value)}
          />
        </Grid>
        <Grid container justify="center">
          <Button
            size="large"
            variant="contained"
            disabled={!group.id}
            color="primary"
            href={`https://us-central1-gmail-to-telegram-forwarder.cloudfunctions.net/oauth2init?${querystring.stringify(
              {
                tgGroup: group.id,
                tgAPIKey: `${botApiToken.id}:${botApiToken.token}`,
                authorizedSender
              }
            )}`}
            style={{ marginTop: "5em" }}
          >
            Authorize Gmail account
          </Button>
        </Grid>
      </div>
    </Fragment>
  );
}
export default withSetTitle(MainPage);
