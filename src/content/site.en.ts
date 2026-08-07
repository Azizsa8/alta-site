/**
 * English mirror of `site.ts` — the site chrome.
 *
 * IMPORTANT, and the reason every export below is annotated with
 * `Widen<typeof …>`: the Arabic in `site.ts` is transcribed from the client's
 * approved document and is the source of truth. These types force this file to
 * carry the same keys and the same shapes. Add a nav item in Arabic and this
 * file stops compiling until it is translated here too — which is the only
 * reliable way to stop a second locale rotting.
 *
 * TRANSLATION STATUS: drafted, NOT client-approved. The Arabic was signed off
 * by the client; this English is not, and should be reviewed before the
 * language switch is announced. Wording follows the Arabic closely rather than
 * being re-marketed, so a reviewer can compare line by line.
 */

import type { Widen } from "@/i18n/config";
import type { company, mainNav, footerNav, cta, microcopy, notFoundCopy, slogans } from "./site";

export const companyEn: Widen<typeof company> = {
  nameAr: "ALTA Investment Company",
  nameEn: "ALTA Investment Company",
  shortAr: "ALTA",
  mark: "ALTA",
  tagline: "From idea to delivery",
  promise: "Integrated solutions… lasting value",
  cityAr: "Riyadh — Kingdom of Saudi Arabia",
  website: "www.alta.sa",
  origin: "https://www.alta.sa",
  phone: null,
  email: null,
  workingHours: null,
  year: 2026,
  descriptionAr:
    "ALTA Investment Company is a Saudi company delivering integrated solutions across AI engineering, facilities operation, maintenance and cleaning, hospitality and catering, management consulting and institutional development, procurement, media and communications, events, and research and polling.",
  descriptionShortAr:
    "Integrated solutions for organisations: AI, operations and maintenance, hospitality and catering, consulting, procurement, media, events, and research.",
};

export const mainNavEn: Widen<typeof mainNav> = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "AI & Information Technology", href: "/services/ai-engineering" },
      { label: "— Our platforms", href: "/services/ai-engineering/platforms" },
      { label: "— ALTA Hospitality AI", href: "/services/ai-engineering/platforms/alta-hospitality" },
      { label: "Operations, Maintenance & Cleaning", href: "/services/facilities-management" },
      { label: "Hospitality & Catering", href: "/services/hospitality-catering" },
      { label: "Consulting & Institutional Development", href: "/services/management-consulting" },
      { label: "Procurement", href: "/services/procurement-supplies" },
      { label: "Media & Platform Management", href: "/services/media-social" },
      { label: "Events, Exhibitions & Conferences", href: "/services/events-exhibitions" },
      { label: "Research & Polling", href: "/services/research-surveys" },
    ],
  },
  { label: "Sectors", href: "/sectors" },
  { label: "Projects", href: "/projects" },
  { label: "Media Centre", href: "/media-center" },
  { label: "Contact", href: "/contact" },
];

export const footerNavEn: Widen<typeof footerNav> = [
  {
    title: "The company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Vision & mission", href: "/about#vision" },
      { label: "Our values", href: "/about#values" },
      { label: "How we work", href: "/about#methodology" },
      { label: "Quality & governance", href: "/about#governance" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "AI & Information Technology", href: "/services/ai-engineering" },
      { label: "Our platforms", href: "/services/ai-engineering/platforms" },
      { label: "Operations, Maintenance & Cleaning", href: "/services/facilities-management" },
      { label: "Hospitality & Catering", href: "/services/hospitality-catering" },
      { label: "Consulting & Institutional Development", href: "/services/management-consulting" },
      { label: "Procurement", href: "/services/procurement-supplies" },
      { label: "Media & Communications", href: "/services/media-social" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "Sectors we serve", href: "/sectors" },
      { label: "Projects & track record", href: "/projects" },
      { label: "Media Centre", href: "/media-center" },
      { label: "Careers", href: "/careers" },
      { label: "FAQ", href: "/faq" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms & conditions", href: "/terms" },
    ],
  },
];

export const ctaEn: Widen<typeof cta> = {
  exploreServices: "Explore our services",
  requestQuote: "Request a quote",
  talkToTeam: "Talk to our team",
  discoverMore: "Discover more",
  allProjects: "View all projects",
  readArticle: "Read the article",
  downloadProfile: "Download company profile",
  registerSupplier: "Register as a supplier",
  joinTeam: "Join our team",
  submit: "Submit request",
  initialConsultation: "Request an initial consultation",
  discussNeed: "Discuss your requirement",
  moreAbout: "More about the company",
  more: "More",
};

export const microcopyEn: Widen<typeof microcopy> = {
  requiredField: "Please complete this field.",
  invalidEmail: "Please enter a valid email address.",
  fileTooLarge: "This file exceeds the size limit. Please attach a smaller file.",
  sent: "Your request has been received.",
  sendFailed: "We could not complete the submission. Please try again.",
  noResults: "No results match your search.",
  updating: "We are updating this section; content will be published shortly.",
  contactSuccess:
    "Thank you for contacting ALTA Investment Company. Your request has been received, and the relevant team will review it and be in touch to complete the requirements.",
  contactError:
    "We could not send your request at this time. Please check the required fields and try again, or use the contact details shown on this page.",
  supplierSuccess:
    "Thank you for your interest in working with ALTA Investment Company. Your details have been received and will be reviewed against project needs and qualification requirements. Registration does not constitute a commitment to contract.",
  careersSuccess:
    "Thank you for your interest in joining ALTA Investment Company. Your application has been received, and we will be in touch when an opportunity matching your experience and our needs becomes available.",
  privacyConsent: "I agree to the privacy policy",
};

export const notFoundCopyEn: Widen<typeof notFoundCopy> = {
  title: "This page doesn't seem to exist",
  body: "The link may have changed or the page may have been removed. You can return to the homepage or explore our services.",
  primary: "Back to homepage",
  secondary: "Explore services",
};

export const slogansEn: Widen<typeof slogans> = [
  "Integrated solutions… lasting value.",
  "We design the solution, run the delivery, and measure the impact.",
  "Impact begins with quality.",
  "ALTA Investment… making the difference.",
  "Your partner in efficiency and development.",
  "Many disciplines, one goal: your success.",
  "Technology, operations and consulting under one roof.",
  "A presence worthy of your business.",
];
