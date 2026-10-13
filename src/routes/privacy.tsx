import { createFileRoute, Link } from '@tanstack/react-router'
import BrandMark from '#/components/BrandMark'
import { useBranding } from '#/context/brandingContext'
import { pageHead } from '#/lib/seo'
import { hintClassName } from '#/lib/ui-classes'

// TODO: fill these in before publishing.
const LAST_UPDATED = '1 October 2026'
const COMPANY_NAME = 'amfphub - awnsr'
const COMPANY_ADDRESS = ''
const PRIVACY_EMAIL = 'hello@awnsr.com'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () =>
    pageHead({
      title: 'Privacy Policy',
      description:
        'How answr collects, uses, and protects your data when you use our AI chatbot platform.',
      path: '/privacy',
    }),
})

function PrivacyPage() {
  const { appName } = useBranding()

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <Link to="/" className="mb-10 inline-flex no-underline">
        <BrandMark variant="dark" size="lg" />
      </Link>

      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className={`mt-3 ${hintClassName}`}>Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--ink)]">
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Who we are</h2>
          <p>
            {appName} is operated by {COMPANY_NAME}, {COMPANY_ADDRESS}. We
            provide an AI customer support widget and workspace for teams. This
            policy explains what we collect when you create an account and when
            someone uses a {appName} widget on a customer site.
          </p>
          <p>Our role depends on the data:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Account holders:</strong> for your account and workspace
              data, we are the controller.
            </li>
            <li>
              <strong>Widget visitors:</strong> the workspace owner (the
              business that embedded the widget) is the controller of visitor
              data. We act as their processor and handle it only to run the
              widget on their behalf.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Account data</h2>
          <p>If you register, we collect:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Email address</li>
            <li>
              Password (stored hashed) and one-time codes used to verify you
            </li>
            <li>
              Workspace content you create, such as articles, topics, guidance,
              snippets, widget settings, and related files
            </li>
            <li>
              Settings for connected tools and integrations, including any
              credentials you provide so the widget can use them
            </li>
            <li>Plan and usage information needed to run the product</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Widget visitors</h2>
          <p>
            When someone chats with a widget you embed, we process that
            conversation so the widget can reply and so you can review it. That
            can include:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Chat messages and session identifiers</li>
            <li>
              Visitor identity and attributes (such as a user ID, name, email,
              or plan) if you enable authenticated access and your site passes
              a signed visitor token. We verify the token when the session
              starts or the identity is linked, and keep the verified details
              with that session until it ends
            </li>
            <li>
              Contact details a visitor shares for lead capture, such as name,
              email, phone number, or company
            </li>
            <li>
              Meeting details if a visitor books through the widget, such as
              the chosen time and contact details
            </li>
            <li>Ratings and written feedback</li>
            <li>Live-agent tickets and messages</li>
            <li>
              Basic usage analytics and technical data, such as browser type,
              approximate request metadata, and the site the widget is
              embedded on
            </li>
          </ul>
          <p>
            Visitors may type personal information into a chat. Workspace
            owners should tell visitors not to share sensitive details unless
            necessary.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">
            If you embed the widget (workspace owners)
          </h2>
          <p>As the controller of visitor data, you are responsible for:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Telling visitors that the chat is handled by an AI assistant and
              how their data is used, for example in your own privacy policy
            </li>
            <li>
              Having a lawful basis and any needed consent for lead capture,
              meeting booking, and identity sharing
            </li>
            <li>
              Responding to visitor requests to access, correct, or delete
              their data
            </li>
            <li>
              Making sure the signed visitor tokens you issue contain only the
              information you are entitled to share
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Connected tools</h2>
          <p>
            Workspace owners can connect external tools to the widget, such as
            calendars, CRMs, or internal systems, using MCP or similar
            integrations. When the AI assistant uses a connected tool, relevant
            parts of the conversation and visitor details may be sent to that
            tool and its response is used in the reply. Those tools are
            operated by the workspace owner or their providers, and their own
            privacy terms apply to data they receive. Connection credentials
            are stored on our servers and are not exposed to visitors.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">AI processing</h2>
          <p>
            Replies are generated by third-party AI models. Conversation
            content and the workspace knowledge needed to answer are sent to
            those providers for that purpose. AI replies can be wrong, so
            workspace owners should review important conversations.
          </p>
          {/* TODO: confirm this matches your provider agreements before publishing. */}
          <p>
            We do not use workspace or visitor content to train our own models,
            and we use providers under terms that do not allow them to train on
            it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">How we use data</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Create and secure accounts</li>
            <li>Generate AI replies and keep conversation history</li>
            <li>
              Capture leads, book meetings, and run live-agent and connected
              tools for the workspace owner
            </li>
            <li>Show analytics to workspace members</li>
            <li>
              Prevent abuse, enforce rate limits and plan limits, and keep the
              service secure and working
            </li>
            <li>Send service emails such as verification codes and notices</li>
            <li>Meet legal obligations</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Legal bases</h2>
          <p>
            Where data protection law requires a legal basis, we rely on:
            performing our contract with you, our legitimate interests in
            securing and improving the service, compliance with legal
            obligations, and consent where it is required. For visitor data,
            the workspace owner determines the basis. We process Indonesian
            personal data in line with Law No. 27 of 2022 on Personal Data
            Protection, and we respect equivalent rights under laws such as the
            GDPR where they apply.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Sharing</h2>
          <p>
            We share data with service providers that help us run the product:
            hosting and database, search, email delivery, analytics, and the AI
            model providers that generate replies. They may only use the data
            to provide their service to us. Workspace members and live agents
            you invite can see conversations in that workspace. We may disclose
            data when the law requires it or to protect the safety and security
            of our users and service. We do not sell personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">International transfers</h2>
          <p>
            Our providers may process data in countries other than where you
            live, including outside Indonesia. When data is transferred, we
            take steps to make sure it stays protected as required by
            applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Cookies and storage</h2>
          <p>
            We store a sign-in token in the browser for logged-in users, and
            the widget stores a session identifier so a visitor can continue a
            chat. These are needed for the product to work. We do not use them
            for advertising.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Retention</h2>
          <p>
            Account and workspace data is kept while the account is active.
            Chat sessions expire according to the workspace settings, and
            authenticated visitor access ends when the visitor token expires.
            Conversations, leads, and meeting records stay in the workspace
            until the owner deletes them or the account is closed. After
            deletion, residual copies may remain in backups for a limited
            time. We may keep limited records where the law requires it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Security</h2>
          <p>
            We protect data with measures such as hashed passwords, encrypted
            connections, signed session identifiers, access controls, and rate
            limiting. No system is completely secure. If a breach affects your
            data, we will notify you and the relevant authorities as the law
            requires.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Your choices and rights</h2>
          <p>
            You can access and update account details after signing in. You may
            also have the right to access, correct, delete, restrict, or object
            to the use of your personal data, to withdraw consent, and to
            receive a copy of your data, as well as to complain to your data
            protection authority.
          </p>
          <p>
            Visitors should contact the site that embedded the widget about
            their chat data. If you contact us about visitor data, we will
            pass your request to the workspace owner. To exercise rights over
            your account, or to ask for it to be deleted, email {PRIVACY_EMAIL}.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Changes</h2>
          <p>
            We may update this policy. The date at the top will change when we
            do, and we will give notice of material changes, for example by
            email or in the product. Continued use of {appName} after an
            update means you accept the revised policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Contact</h2>
          <p>
            Questions about this policy or your data: {PRIVACY_EMAIL}.
          </p>
        </section>
      </div>
    </main>
  )
}
