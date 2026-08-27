/**
 * Controlled Demo Email Samples for SIH Investigation (Step 99)
 *
 * Safe, fictional email templates designed for demonstrating:
 * 1. Legitimate business communication (Low Risk)
 * 2. Suspicious sender anomalies & routing mismatches (Medium Risk)
 * 3. Urgent credential harvesting & phishing (High/Critical Risk)
 * 4. Malicious infrastructure & deceptive IP artifacts (Critical Risk)
 */

export const DEMO_EMAILS = [
  {
    id: "legitimate",
    title: "Demo 1: Legitimate Email",
    category: "Legitimate",
    badge: "Low Risk",
    description: "Authentic project sprint sync meeting notification with aligned headers",
    emailText: `From: "Alex Carter" <alex.carter@team-internal.example.com>
To: "Development Team" <dev-team@company.example.com>
Date: Thu, 27 Aug 2026 09:30:00 +0000
Subject: Sprint 42 Planning & Architecture Review - Thursday 2 PM
Message-ID: <msg-20260827-sprint42@team-internal.example.com>

Hi Team,

Hope you're having a productive week.

Please find below the agenda for our upcoming Sprint 42 Planning session scheduled for today at 2:00 PM UTC in Conference Room B:

1. Review completed backlog items from Sprint 41
2. Architecture discussion on the upcoming API caching layer
3. Capacity planning and task assignment for the next two weeks

The sprint document is available on our internal wiki at https://wiki.internal.example.com/sprint-42. Please review your user stories prior to the call.

Best regards,
Alex Carter
Engineering Lead | Acme Solutions
alex.carter@team-internal.example.com`,
  },
  {
    id: "suspicious",
    title: "Demo 2: Suspicious Email",
    category: "Suspicious",
    badge: "Medium Risk",
    description: "Urgent vendor inquiry with Reply-To routing mismatch",
    emailText: `From: "Finance Support" <support@vendor-portal.example.com>
Reply-To: "External Accounting" <accounting-team@different-domain.net>
To: "Accounts Payable" <ap-dept@client-company.example.com>
Date: Thu, 27 Aug 2026 10:15:30 +0000
Subject: Inquiry Regarding Pending Purchase Order PO-98412 - Action Requested

Dear Accounting Team,

We noticed a minor discrepancy in the reconciliation for purchase order PO-98412 scheduled for disbursement this billing cycle.

Please review the attached statement details and confirm if payment can be expedited before our quarterly ledger closing this Friday.

To ensure your reply is logged directly in our ticket queue, please respond directly to this email or reply to our secondary billing mailbox at accounting-team@different-domain.net.

Thank you for your prompt assistance.

Kind regards,
Vendor Accounting Operations Team
Reference Code: #PO-98412-INQ`,
  },
  {
    id: "phishing",
    title: "Demo 3: Phishing Alert",
    category: "Phishing",
    badge: "High Risk",
    description: "Urgent account suspension alert spoofing cloud security SSO",
    emailText: `From: "Cloud Security Systems" <security-alert@cloud-sso-verify.example.org>
To: "Target Employee" <user@corporate-network.example.com>
Date: Thu, 27 Aug 2026 14:15:22 +0000
Subject: CRITICAL: Unauthorized login attempt detected - Corporate account locked in 24 hours
Message-ID: <sec-alert-88912@cloud-sso-verify.example.org>

SECURITY NOTICE: IMMEDIATE ACTION REQUIRED

Dear Corporate User,

We detected multiple unauthorized login attempts to your corporate account from an unrecognized IP address in Moscow, Russia (IP: 198.51.100.45).

To prevent permanent account suspension and protect enterprise assets, you must immediately confirm your identity and verify your security credentials within 24 hours:

>> VERIFY YOUR ACCOUNT CREDENTIALS: http://login-secure-sso.cloud-sso-verify.example.org/verify?token=9f82d1c

Failure to verify within 24 hours will result in immediate termination of corporate workstation access and cloud instances.

Corporate Security & Compliance Department
Global Identity Threat Prevention Systems`,
  },
  {
    id: "malicious-infra",
    title: "Demo 4: Malicious Infrastructure",
    category: "Malicious Infrastructure",
    badge: "Critical Risk",
    description: "Wire fraud notification targeting IP-based portal and unencrypted port",
    emailText: `From: "Executive Finance" <cfo-office@global-trade-escrow.example.com>
Return-Path: <bounce-daemon@unauthorized-server.example.net>
To: "Treasury Operations" <treasury@victim-enterprise.example.com>
Date: Thu, 27 Aug 2026 11:05:10 +0000
Subject: URGENT: Mandatory Wire Route Alteration for Invoice #INV-88491 ($84,500.00)

Dear Treasury Team,

Due to an emergency banking audit at our primary merchant bank, all pending international wire transfers for Invoice #INV-88491 ($84,500.00) must be rerouted immediately.

Please download the encrypted transaction instructions and complete verification immediately via our direct server portal:

>> ACCESS PAYMENT PORTAL: http://198.51.100.22:8080/invoice/verify?id=INV-88491

Beneficiary: Global Trade Settlement Escrow Ltd
Account: 8849-2910-4491-002
SWIFT: OCBKUS33

Do not attempt to contact our office by phone as telephone lines are currently undergoing maintenance. Complete this transaction before 5:00 PM today.

David Henderson
Chief Financial Officer | Global Trade Escrow`,
  },
];

export default DEMO_EMAILS;
