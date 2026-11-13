/** Privacy Policy content (Figma 184:277 Legal Content Column + 184:255 Policy Sidebar Index). */

export type PrivacyListItem = string | { title: string; text: string };

export type PrivacyContactRow = { label: string; value: string; href?: string };

export type PrivacyBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: PrivacyListItem[] }
  | { type: "h3"; text: string }
  | { type: "contact"; rows: PrivacyContactRow[] };

export type PrivacySection = {
  id: string;
  /** Heading shown in the legal column (rendered as "N. title"). */
  title: string;
  /** Shorter label used in the sidebar index (as in Figma). */
  navLabel: string;
  blocks: PrivacyBlock[];
};

export const PRIVACY_LAST_UPDATED = "Last updated: October 24, 2026";

export const PRIVACY_INTRO =
  "This Privacy Policy describes how Pizzaway UK Ltd ('we', 'our', or 'us') collects, uses, and shares your personal information when you use our website, mobile application, custom pizza builder, or order delivery services. Please read this document carefully to understand our commitment to your personal data rights.";

export const PRIVACY_EMAIL = "privacy@pizzawayuk.com";

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    navLabel: "Information We Collect",
    blocks: [
      {
        type: "p",
        text: "To provide Neapolitan sourdough pizzas engineered and delivered with optimal efficiency, we must process certain technical and personal data variables:",
      },
      {
        type: "ul",
        items: [
          {
            title: "Personal Identifiers",
            text: "Full name, email address, physical delivery address, coordinates, telephone number, and account login parameters.",
          },
          {
            title: "Transactional & Order Details",
            text: "Your culinary configurations, build-your-own formulas, order history, special delivery instructions, and basket selections.",
          },
          {
            title: "Payment Processing Information",
            text: "Highly secured credit card parameters, Apple Pay, Google Pay, or other transaction details processed safely through our payment gateway partners.",
          },
          {
            title: "Device & Usage Telemetry",
            text: "IP addresses, device telemetry, browser type, cookies, transaction metrics, and operational performance values tracked during website interaction.",
          },
        ],
      },
    ],
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    navLabel: "How We Use Data",
    blocks: [
      {
        type: "p",
        text: "Your data serves primarily to ensure exact kitchen prep and precision courier operations:",
      },
      {
        type: "ul",
        items: [
          {
            title: "Order Dispatch & Fulfillment",
            text: "To prepare, slow-bake, and track delivery routes straight from our high-temp stone ovens directly to your coordinates.",
          },
          {
            title: "Account & Formula Customisation",
            text: "To save your favorite build formulas, configure meal preferences, and maintain reward tokens.",
          },
          {
            title: "Real-Time Telemetry & Tracking",
            text: "To calculate live delivery routes and send real-time GPS telemetry updates directly to your mobile device.",
          },
          {
            title: "Communication & Opt-out Marketing",
            text: "To send transaction confirmations, delivery updates, or curated exclusive deals (which you can easily opt-out of at any time).",
          },
        ],
      },
    ],
  },
  {
    id: "cookies-and-tracking",
    title: "Cookies & Tracking",
    navLabel: "Cookies & Tracking",
    blocks: [
      {
        type: "p",
        text: "We use cookies to maintain your current basket configurations, authorize your user account, and evaluate technical optimization of our digital customisation systems.",
      },
      {
        type: "ul",
        items: [
          {
            title: "Essential Cookies",
            text: "Required for checkout operations, active basket memory, and secure transaction sign-in.",
          },
          {
            title: "Preference Cookies",
            text: "Save size preferences (like Medium 12') and previously selected local pizzerias to speed up subsequent orders.",
          },
          {
            title: "Management",
            text: "You can customize or block cookies through your individual browser preferences, though blocking may affect pizza customizer performance.",
          },
        ],
      },
    ],
  },
  {
    id: "data-sharing-and-third-parties",
    title: "Data Sharing & Third Parties",
    navLabel: "Third Party Sharing",
    blocks: [
      {
        type: "p",
        text: "We prioritize absolute transaction clarity. We do not sell your personal data. We only share critical variables with essential partners:",
      },
      {
        type: "ul",
        items: [
          {
            title: "Courier & Logistics Partners",
            text: "Delivery drivers and navigation suppliers receive strictly necessary coordinates to fulfill 25-minute guarantees.",
          },
          {
            title: "Payment Gateway Processors",
            text: "Encrypted transaction data is managed purely by PCI-DSS compliant providers (Visa, Mastercard, Apple Pay, Google Pay).",
          },
          {
            title: "No Marketing Transfers",
            text: "We do not transfer your contact details to third-party consumer brands for external advertising campaigns.",
          },
        ],
      },
    ],
  },
  {
    id: "your-legal-rights",
    title: "Your Legal Rights",
    navLabel: "Your Legal Rights",
    blocks: [
      {
        type: "p",
        text: "Under UK GDPR, you maintain comprehensive sovereignty over your digital records. You may execute any of the following parameters at your discretion:",
      },
      {
        type: "ul",
        items: [
          {
            title: "Right to Access & Portability",
            text: "Request a digital file containing your saved culinary configurations and order histories.",
          },
          {
            title: "Right to Rectification",
            text: "Instruct us to correct address errors, phone numbers, or account details.",
          },
          {
            title: "Right to Erasure ('To Be Forgotten')",
            text: "Request complete removal of your profile, email coordinates, and past transaction records from our system.",
          },
        ],
      },
    ],
  },
  {
    id: "data-security-measures",
    title: "Data Security Measures",
    navLabel: "Data Security Measures",
    blocks: [
      {
        type: "p",
        text: "Our servers utilize robust security layers designed to safeguard your credentials. All coordinates, payment triggers, and operational communications are encrypted using secure protocols. Sourdough logistics are maintained within highly defended digital borders.",
      },
    ],
  },
  {
    id: "contact-our-privacy-team",
    title: "Contact Our Privacy Team",
    navLabel: "Contact Our Privacy Team",
    blocks: [
      {
        type: "p",
        text: "For inquiries regarding data collection parameters or to execute your legal rights, please contact our dedicated security team:",
      },
      {
        type: "contact",
        rows: [
          { label: "Email:", value: PRIVACY_EMAIL, href: `mailto:${PRIVACY_EMAIL}` },
          { label: "Hotline:", value: "0800 PIZZA WAY" },
          {
            label: "HQ Address:",
            value: "Pizzaway HQ, London EC1A, United Kingdom. Sourdough Logistics Center.",
          },
        ],
      },
    ],
  },
];
