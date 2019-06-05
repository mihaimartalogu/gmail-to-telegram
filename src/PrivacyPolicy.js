import React, { Fragment, useEffect } from "react";
import { withSetTitle } from "./TitleContext";

function PrivacyPolicy({ setTitle }) {
  useEffect(() => {
    setTitle("Privacy Policy");
  });
  return (
    <Fragment>
      <p>
        It is Gmail to Telegram forwarder's policy to respect your privacy
        regarding any information we may collect while operating our website.
        This Privacy Policy applies to{" "}
        <a href="https://mihaimartalogu.github.io/gmail-to-telegram">
          https://mihaimartalogu.github.io/gmail-to-telegram
        </a>{" "}
        (hereinafter, "us", "we", "website", or "Gmail to Telegram forwarder").
        We respect your privacy and are committed to protecting personally
        identifiable information you may provide us through the website.
      </p>
      <h2>Gathering of Personally-Identifying Information</h2>
      We collect and store:
      <ul>
        <li>The email address of your Gmail account</li>
        <li>
          The Telegram information you provide or we are able to retrieve from
          the Telegram API:
          <ul>
            <li>The Telegram bot's API key</li>
            <li>Group ID</li>
          </ul>
        </li>
        <li>Authorized sender email address (optional)</li>
      </ul>
      <p>
        All of the elements not explicitly marked optional are necessary for
        providing the functionality of the website.
      </p>
      <p>
        The storage of the data is currently in Google datacenters in the US.
      </p>
      <h2>Security</h2>
      <p>
        The security of your Personal Information is important to us, but
        remember that no method of transmission over the Internet, or method of
        electronic storage is 100% secure. While we strive to use commercially
        acceptable means to protect your Personal Information, we cannot
        guarantee its absolute security.
      </p>
      <h2>Privacy Policy Changes</h2>
      <p>
        Although most changes are likely to be minor, Gmail to Telegram
        forwarder may change its Privacy Policy from time to time, and at Gmail
        to Telegram forwarder's sole discretion. We encourage visitors to
        frequently check this page for any changes to the Privacy Policy. Your
        continued use of the website after any change in this Privacy Policy
        will constitute your acceptance of such change.
      </p>
      <h2>Contact Information</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        via{" "}
        <a href="mailto:gmail-to-telegram-forwarder@googlegroups.com">email</a>.
      </p>
    </Fragment>
  );
}

export default withSetTitle(PrivacyPolicy);
