import { createFileRoute } from "@tanstack/react-router";

function TermsPage() {
  return (
    <>
      <h1
        className="text-4xl md:text-5xl mb-2"
        style={{
          fontFamily: "Crimson Pro, serif",
          fontWeight: 600,
          color: "var(--dark-text)",
        }}
      >
        Terms of Service
      </h1>
      <p
        className="text-sm mb-12"
        style={{ fontFamily: "Crimson Pro, serif", color: "var(--dark-muted)" }}
      >
        Last updated: January 10, 2026
      </p>

      <div className="legal-prose">
        <h2>Agreement to Terms</h2>
        <p>
          By accessing or using songcal ("the Service"), you agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use the Service.
        </p>

        <h2>Description of Service</h2>
        <p>
          songcal is a service that syncs your Apple Music listening history to Google Calendar.
          When you play a song on Apple Music, the Service creates a corresponding calendar event
          showing the song details and the time it was played.
        </p>

        <h2>Account Requirements</h2>
        <p>To use songcal, you must:</p>
        <ul>
          <li>Have a valid Google account</li>
          <li>Have an active Apple Music subscription</li>
          <li>Grant the Service access to your Google Calendar</li>
          <li>Authorize the Service to access your Apple Music listening history</li>
        </ul>

        <h2>Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to the Service or its systems</li>
          <li>Interfere with or disrupt the Service</li>
          <li>Use automated means to access the Service beyond normal use</li>
          <li>Reverse engineer or attempt to extract the source code of the Service</li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>
          The Service integrates with Google and Apple Music. Your use of these services is subject
          to their respective terms of service:
        </p>
        <ul>
          <li>
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
              Google Terms of Service
            </a>
          </li>
          <li>
            <a
              href="https://www.apple.com/legal/internet-services/itunes/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apple Media Services Terms and Conditions
            </a>
          </li>
        </ul>

        <h2>Service Availability</h2>
        <p>
          We strive to maintain high availability but do not guarantee uninterrupted access to the
          Service. We may modify, suspend, or discontinue the Service at any time without prior
          notice.
        </p>

        <h2>Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, either
          express or implied. We do not warrant that the Service will be error-free or that syncing
          will be complete or accurate.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, songcal and its operators shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages arising from your
          use of the Service.
        </p>

        <h2>Account Termination</h2>
        <p>
          You may stop using the Service at any time by disconnecting your accounts. We reserve the
          right to suspend or terminate your access to the Service for violations of these terms or
          for any other reason at our discretion.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We may update these Terms of Service from time to time. Continued use of the Service after
          changes constitutes acceptance of the new terms. We will update the "Last updated" date
          when changes are made.
        </p>

        <h2>Governing Law</h2>
        <p>
          These terms shall be governed by and construed in accordance with applicable laws, without
          regard to conflict of law principles.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about these Terms of Service, please contact us at{" "}
          <a href="mailto:hello@851.sh">hello@851.sh</a>.
        </p>
      </div>
    </>
  );
}

const Route = createFileRoute("/(marketing)/_legal/terms")({
  component: TermsPage,
});

export { Route };
