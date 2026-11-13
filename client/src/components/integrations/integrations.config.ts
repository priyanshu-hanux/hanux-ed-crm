import type { ElementType } from "react";
import {
  Mail, CalendarDays, MessageSquare, FolderKanban, Cloud, FileText,
  Workflow, ChartNoAxesCombined,
} from "lucide-react";
import { integrations } from "@/assets/integrations";

export type Integration = {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  accent: string;
  logoScale?: number;
  popular?: boolean;
  permissions: string[];
};

export const categories = ["All", "Email", "Calendar", "Communication", "Project management", "Storage", "Productivity", "Automation"];

export const categoryIcons: Record<string, ElementType> = {
  All: ChartNoAxesCombined,
  Email: Mail,
  Calendar: CalendarDays,
  Communication: MessageSquare,
  "Project management": FolderKanban,
  Storage: Cloud,
  Productivity: FileText,
  Automation: Workflow,
};

export const appIntegrations: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Sync customer emails, view conversations, and send messages from your CRM.",
    category: "Email",
    logo: integrations.gmail,
    accent: "#EA4335",
    logoScale: 0.85,
    popular: true,
    permissions: ["View and manage email messages", "View your email address"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Sync customer messages, view conversations, and send messages from your CRM.",
    category: "Communication",
    logo: integrations.slack,
    accent: "#4A154B",
    logoScale: 0.85,
    popular: true,
    permissions: ["View and manage messages", "View your email address"],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Keep meetings, events, and customer appointments in sync.",
    category: "Calendar",
    logo: integrations.calendar,
    accent: "#4285F4",
    logoScale: 0.85,
    popular: true,
    permissions: ["View calendar events", "Create and update events"],
  },
  {
    id: "drive",
    name: "Google Drive",
    description: "Access customer files, share documents, and manage attachments.",
    category: "Storage",
    logo: integrations.drive,
    accent: "#4285F4",
    logoScale: 0.85,
    popular: true,
    permissions: ["View and manage files in your Google Drive", "View your email address"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Connect with customers through WhatsApp messaging and notifications.",
    category: "Communication",
    logo: integrations.whatsapp,
    accent: "#25D366",
    logoScale: 0.85,
    popular: true,
    permissions: ["Send and receive messages", "View your phone number"],
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Analyze customer data, create reports, and manage spreadsheets.",
    category: "Productivity",
    logo: integrations.sheets,
    accent: "#0F9D58",
    logoScale: 0.85,
    permissions: ["View and manage spreadsheets in your Google Drive", "View your email address"],
  },
  {
    id: "monday",
    name: "Monday.com",
    description: "Manage projects, tasks, and workflows with Monday.com integration.",
    category: "Project management",
    logo: integrations.monday,
    accent: "#FF6A00",
    logoScale: 0.85,
    permissions: ["View and manage boards", "View your email address"],
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Send SMS messages, make calls, and manage customer communications.",
    category: "Communication",
    logo: integrations.twilio,
    accent: "#F22F46",
    logoScale: 0.85,
    permissions: ["Send and receive messages", "Make and receive calls"],
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Schedule and manage video meetings, webinars, and customer calls.",
    category: "Communication",
    logo: integrations.zoom,
    accent: "#2D8CFF",
    logoScale: 0.85,
    permissions: ["View and manage meetings", "View your email address"],
  },
  {
    id: "adsense",
    name: "Google AdSense",
    description: "Manage ad campaigns, track performance, and optimize revenue.",
    category: "Productivity",
    logo: integrations.adsense,
    accent: "#4285F4",
    logoScale: 0.85,
    permissions: ["View and manage AdSense accounts", "View your email address"],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Process payments, manage transactions, and handle customer billing.",
    category: "Productivity",
    logo: integrations.paypal,
    accent: "#003087",
    logoScale: 0.85,
    permissions: ["View and manage PayPal accounts", "View your email address"],
  }
];