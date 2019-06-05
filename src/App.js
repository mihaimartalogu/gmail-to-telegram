import React, { useEffect, useState, Fragment } from "react";
import "./App.css";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import {
  Input,
  CircularProgress,
  Link as MuiLink,
  Grid,
  Box,
  TextField,
  AppBar,
  Toolbar,
  IconButton
} from "@material-ui/core";
import HomeIcon from "@material-ui/icons/Home";
import isEqual from "lodash/isEqual";

import querystring from "query-string";
// using ES6 modules
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import PrivacyPolicy from "./PrivacyPolicy";
import Success from "./Success";
import TitleContext from "./TitleContext";
import MainPage, { mainPageTitle } from "./MainPage";

function App() {
  const [title, setTitle] = useState(mainPageTitle);
  return (
    <TitleContext.Provider
      value={{
        title,
        setTitle: newTitle => isEqual(title, newTitle) || setTitle(newTitle)
      }}
    >
      <Box>
        <Router>
          <AppBar position="static">
            <Toolbar>
              <Grid container>
                <IconButton href="/">
                  <HomeIcon />
                </IconButton>
                <TitleContext.Consumer>
                  {({ title }) => (
                    <Typography
                      variant="h5"
                      noWrap
                      style={{ padding: "6px 16px" }}
                    >
                      {title}
                    </Typography>
                  )}
                </TitleContext.Consumer>

                <Grid item xs />
                <Button href="/privacy" color="inherit">
                  Privacy Policy
                </Button>
              </Grid>
            </Toolbar>
          </AppBar>
          <Box
            display="grid"
            style={{
              gridTemplateColumns: "minmax(0, 1fr) 600px minmax(0, 1fr)"
            }}
          >
            <Box style={{ gridColumnEnd: "span 1" }} />
            <Box style={{ gridColumnEnd: "span 1" }}>
              <Route path="/" exact component={MainPage} />
              <Route path="/success" exact component={Success} />
              <Route path="/privacy" exact component={PrivacyPolicy} />
            </Box>
            <Box style={{ gridColumnEnd: "span 1" }} />
          </Box>
        </Router>
      </Box>
    </TitleContext.Provider>
  );
}

export default App;
