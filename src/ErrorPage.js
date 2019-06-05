import React, { useEffect } from "react";
import { Paper, Typography, Box, Grid } from "@material-ui/core";

import querystring from "query-string";

import { withSetTitle } from "./TitleContext";

function ErrorPage({ location, setTitle }) {
  useEffect(() => {
    setTitle("Epic failure!");
  }, [setTitle]);
  const { err } = querystring.parse(location.search);
  return (
    <Paper>
      <Typography color="error">
        Unfortunately the tool encountered an error. You might have more details
        in the message below:
      </Typography>
      <Grid container justify="center">
        <Box width="80%">
          <Paper>
            <Typography>{err}</Typography>
          </Paper>
        </Box>
      </Grid>
    </Paper>
  );
}
export default withSetTitle(ErrorPage);
