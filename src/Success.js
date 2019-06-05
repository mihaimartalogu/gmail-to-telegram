import React, { useEffect } from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  Box,
  Grid
} from "@material-ui/core";

import querystring from "query-string";

import { withSetTitle } from "./TitleContext";

function Success({ location, setTitle }) {
  useEffect(() => {
    setTitle("Great success!");
  }, [setTitle]);
  const {
    emailAddress,
    authorizedSender,
    tgGroup,
    tgAPIKey,
    messageEstablished
  } = querystring.parse(location.search);
  return (
    <Paper>
      <Typography>
        You have successfully set up the forwarding. Here's a summary of the
        configuration:
      </Typography>
      <List>
        <ListItem>Your Gmail address: {emailAddress}</ListItem>
        <ListItem>Sender authorized: {authorizedSender || "all"}</ListItem>
        <ListItem>Telegram group ID: {tgGroup}</ListItem>
        <ListItem>Telegram bot API key: {tgAPIKey}</ListItem>
      </List>
      <Typography>The following message has been sent to the group:</Typography>
      <Grid container justify="center">
        <Box width="80%">
          <Paper>
            <Typography>{messageEstablished}</Typography>
          </Paper>
        </Box>
      </Grid>
    </Paper>
  );
}
export default withSetTitle(Success);
