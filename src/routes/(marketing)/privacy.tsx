import { createFileRoute } from "@tanstack/react-router";

import { LegalLayout } from "./-components/legal-layout";

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="January 10, 2026">
      <h2>Introduction</h2>
      <p>
        songcal ("we," "our," or "us") respects your privacy and is committed to protecting your
        personal data. This privacy policy explains how we collect, use, and safeguard your
        information when you use our service.
      </p>

      <h2>Information We Collect</h2>

      <h3>Google Account Information</h3>
      <p>When you sign in with Google, we collect:</p>
      <ul>
        <li>Your email address</li>
        <li>Your name and profile picture</li>
        <li>OAuth tokens to access Google Calendar on your behalf</li>
      </ul>

      <h3>Apple Music Data</h3>
      <p>When you connect Apple Music, we collect:</p>
      <ul>
        <li>Your recently played tracks (song name, artist, album, duration, play time)</li>
        <li>A Music User Token to access your listening history</li>
      </ul>

      <h3>Calendar Data</h3>
      <p>
        We create and manage calendar events in Google Calendar representing your music listening
        history. We may also read your calendar list to allow you to select which calendar to sync
        to.
      </p>

      <h2>How We Use Your Information</h2>
      <p>We use your information solely to:</p>
      <ul>
        <li>Authenticate you and maintain your session</li>
        <li>Fetch your Apple Music listening history</li>
        <li>Create calendar events in Google Calendar for each song you play</li>
        <li>Sync your music history automatically</li>
      </ul>

      <h2>Data Storage and Security</h2>
      <p>
        Your data is stored securely and we implement appropriate technical measures to protect it.
        We store:
      </p>
      <ul>
        <li>Your account information and OAuth tokens (encrypted)</li>
        <li>References to synced tracks to avoid duplicates</li>
        <li>Your calendar preferences</li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>songcal integrates with:</p>
      <ul>
        <li>
          <strong>Google:</strong> For authentication and Google Calendar access. See{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google's Privacy Policy
          </a>
          .
        </li>
        <li>
          <strong>Apple Music:</strong> For accessing your listening history. See{" "}
          <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">
            Apple's Privacy Policy
          </a>
          .
        </li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        We retain your data for as long as your account is active. You can request deletion of your
        account and associated data at any time by contacting us.
      </p>

      <h2>Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Disconnect Apple Music or revoke Google Calendar access at any time</li>
      </ul>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this privacy policy from time to time. We will notify you of any significant
        changes by updating the "Last updated" date at the top of this page.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this privacy policy or your data, please contact us at{" "}
        <a href="mailto:hello@851.sh">hello@851.sh</a>.
      </p>
    </LegalLayout>
  );
}

const Route = createFileRoute("/(marketing)/privacy")({
  component: PrivacyPage,
});

export { Route };
