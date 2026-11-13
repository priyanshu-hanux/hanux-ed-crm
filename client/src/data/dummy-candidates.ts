/**
 * Demo candidates in the API's profile shape (see src/types/candidate.ts).
 * The first 20 are realistic; the rest are edge cases for testing (see the comments on each).
 */
import type { Candidate } from "@/types/candidate";

// The types used to live here; re-exported so existing imports keep working
export type * from "@/types/candidate";

// ============================================================
// Edge cases for testing the table and the details drawer.
// Each record tests one awkward situation (see its comment); everything else is ordinary data.
// They're added to the end of dummyCandidates, after the realistic records.
// ============================================================

const NORMAL_CONFIDENCE: Candidate["confidence"] = {
  name: 0.95, emails: 0.93, phones: 0.9, socials: 0.88, totalExperienceMonths: 0.88, experience: 0.9,
  education: 0.9, skills: 0.91, certifications: 0.9, location: 0.89, timezone: 0.85,
};

/** An ordinary candidate with `overrides` applied, so each case only lists what it tests */
function edgeCase(n: number, overrides: Partial<Candidate>): Candidate {
  return {
    id: `edge-${n}`,
    name: `Test Candidate ${n}`,
    emails: [{ value: `test.candidate${n}@example.com`, type: "personal", isPrimary: true }],
    phones: [{ value: `+91 90000 ${10000 + n}`, type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: `https://www.linkedin.com/in/test-candidate-${n}` }],
    totalExperienceMonths: 48,
    experience: [{ company: "Test Corp", title: "Software Engineer", startDate: "2022-11", endDate: null }],
    education: [{ institution: "University of Pune", degree: "B.Tech", fieldOfStudy: "Information Technology", startYear: 2018, endYear: 2022 }],
    skills: ["React", "TypeScript", "Node.js"],
    certifications: [],
    location: { city: "Pune", countryCode: "IN", display: "Pune, India" },
    timezone: "Asia/Kolkata",
    source: { type: "resume", resumeFileId: `file_edge_${n}`, extractedAt: "2026-10-20T10:00:00.000Z", updatedAt: "2026-10-20T10:00:00.000Z" },
    confidence: NORMAL_CONFIDENCE,
    ...overrides,
  };
}

const edgeCaseCandidates: Candidate[] = [
  // ---------- Whole record ----------

  // Nothing but an id and a manual source: every column should show its empty state, nothing should crash
  {
    id: "edge-1",
    name: "",
    emails: [],
    phones: [],
    socials: [],
    totalExperienceMonths: null,
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    location: null,
    timezone: null,
    source: { type: "manual", updatedAt: "2026-10-20T10:00:00.000Z" },
  },

  // Everything at its maximum: long text, many contacts, jobs, degrees, skills and certifications
  edgeCase(2, {
    name: "Venkata Subramanian Lakshminarayanan Ramakrishnan Iyer",
    emails: [
      { value: "venkata.subramanian.lakshminarayanan.ramakrishnan@extremely-long-company-domain-name.co.in", type: "work", isPrimary: true },
      { value: "v.iyer@example.com", type: "personal" },
      { value: "venkata.iyer@gmail.com", type: "personal" },
      { value: "iyer.v@outlook.com", type: "other" },
      { value: "venkata@personal-portfolio.dev", type: "personal" },
    ],
    phones: [
      { value: "+91 98450 11111", type: "mobile", isPrimary: true },
      { value: "+91 98450 22222", type: "mobile" },
      { value: "+91 80 4110 3333", type: "work" },
      { value: "+1 (408) 555-0144", type: "work" },
      { value: "+44 20 7946 0958", type: "other" },
    ],
    socials: [
      { platform: "linkedin", url: "https://www.linkedin.com/in/venkata-subramanian-lakshminarayanan-ramakrishnan-iyer-0a1b2c3d" },
      { platform: "github", url: "https://github.com/venkata-iyer" },
      { platform: "x", url: "https://x.com/venkata_iyer" },
      { platform: "portfolio", url: "https://venkata-iyer.dev/about" },
    ],
    totalExperienceMonths: 300,
    experience: [
      { company: "Tata Consultancy Services — Global Banking & Financial Services Strategic Unit", title: "Distinguished Engineer & Chief Architect, Data Platforms and Real-time Analytics", startDate: "2019-04", endDate: null, location: "Bengaluru, India" },
      { company: "Infosys", title: "Principal Architect", startDate: "2014-01", endDate: "2019-03" },
      { company: "Oracle", title: "Senior Engineer", startDate: "2009-06", endDate: "2013-12" },
      { company: "Wipro", title: "Software Engineer", startDate: "2004-07", endDate: "2009-05" },
      { company: "HCLTech", title: "Trainee Engineer", startDate: "2002-01", endDate: "2004-06" },
      { company: "Freelance", title: "Consultant", startDate: "2001-06", endDate: "2001-12" },
    ],
    education: [
      { institution: "Indian Institute of Science, Bengaluru", degree: "Ph.D.", fieldOfStudy: "Distributed Systems and Large-Scale Data Engineering", startYear: 2010, endYear: 2015 },
      { institution: "IIT Madras", degree: "M.Tech", fieldOfStudy: "Computer Science", startYear: 1999, endYear: 2001 },
      { institution: "Anna University", degree: "B.E.", fieldOfStudy: "Electronics and Communication", startYear: 1995, endYear: 1999 },
    ],
    skills: ["Java", "Scala", "Kotlin", "Go", "Rust", "Python", "Kafka", "Spark", "Flink", "Hadoop", "Kubernetes", "Terraform", "AWS", "GCP", "Azure"],
    location: { city: "Bengaluru", region: "Karnataka", countryCode: "IN", display: "Bengaluru Urban District, Karnataka, India" },
    certifications: [
      { name: "AWS Certified Solutions Architect – Professional", provider: "Amazon Web Services", issueDate: "2024-03", expiryDate: "2027-03", credentialId: "AWS-SAP-0002", url: "https://aws.amazon.com/verification" },
      { name: "Google Professional Cloud Architect", provider: "Google Cloud", issueDate: "2023-05", credentialId: "GCP-PCA-0002" },
      { name: "Microsoft Certified: Azure Solutions Architect Expert", provider: "Microsoft", issueDate: "2022-08", credentialId: "AZ-305-0002" },
      { name: "Certified Kubernetes Administrator (CKA)", provider: "The Linux Foundation", issueDate: "2021-02", expiryDate: "2024-02", credentialId: "CKA-0002" },
      { name: "HashiCorp Certified: Terraform Associate", provider: "HashiCorp", issueDate: "2020-09", credentialId: "HC-TA-0002" },
      { name: "Confluent Certified Developer for Apache Kafka", provider: "Confluent", issueDate: "2019", credentialId: "CCDAK-0002" },
    ],
    confidence: {
      name: 1, emails: 1, phones: 1, socials: 1, totalExperienceMonths: 1, experience: 1,
      education: 1, skills: 1, certifications: 1, location: 1, timezone: 1,
    },
  }),

  // ---------- Name ----------

  // Only spaces: should be treated as no name ("---")
  edgeCase(3, { name: "   " }),
  // Single letter: avatar, initials and sorting with a one-character value
  edgeCase(4, { name: "X" }),
  // Accents, apostrophe and hyphen: sorting and the text filter
  edgeCase(5, { name: "José Ñúñez-O'Connor", location: { city: "Madrid", countryCode: "ES", display: "Madrid, Spain" }, timezone: "Europe/Madrid" }),
  // Non-Latin script
  edgeCase(6, {
    name: "张伟",
    location: { city: "Shanghai", countryCode: "CN", display: "Shanghai, China" },
    timezone: "Asia/Shanghai",
    experience: [{ company: "Alibaba", title: "Software Engineer", startDate: "2022-11", endDate: null }],
  }),
  // Right-to-left script
  edgeCase(7, { name: "محمد علي", location: { city: "Dubai", countryCode: "AE", display: "Dubai, UAE" }, timezone: "Asia/Dubai" }),
  // Lower-case name: does sorting put it next to "Rahul" or at the end?
  edgeCase(8, { name: "rahul verma" }),
  // Current job without a title: the name cell should hide its second line, Role shows "---"
  edgeCase(9, { name: "Neha Joshi", experience: [{ company: "Test Corp", startDate: "2022-11", endDate: null }] }),

  // ---------- Email ----------

  // No email at all
  edgeCase(10, { name: "Arjun Mehta", emails: [] }),
  // Duplicates that differ only by case/spaces: should show once
  edgeCase(11, {
    name: "Pooja Reddy",
    emails: [
      { value: "pooja.reddy@example.com", isPrimary: true },
      { value: "  Pooja.Reddy@Example.com " },
      { value: "pooja.reddy@example.com" },
    ],
  }),
  // Placeholder values from a bad import: should all be ignored → "no email"
  edgeCase(12, { name: "Suresh Pillai", emails: [{ value: "N/A" }, { value: "-" }, { value: "" }, { value: "none" }] }),
  // One real email hidden among placeholders
  edgeCase(13, { name: "Divya Menon", emails: [{ value: "" }, { value: "null" }, { value: "divya.menon@example.com", type: "personal" }] }),
  // Primary marked on the second entry: the work email must be shown first and tagged Primary
  edgeCase(51, {
    name: "Primary Second",
    emails: [
      { value: "primary.second@gmail.com", type: "personal" },
      { value: "p.second@testcorp.com", type: "work", isPrimary: true },
    ],
  }),
  // Two entries marked primary: only the first marked one counts
  edgeCase(52, {
    name: "Two Primaries",
    emails: [
      { value: "first.primary@example.com", isPrimary: true },
      { value: "second.primary@example.com", isPrimary: true },
    ],
  }),

  // ---------- Phone ----------

  // No phone at all
  edgeCase(14, { name: "Kiran Rao", phones: [] }),
  // 5 phones in mixed international formats and types
  edgeCase(15, {
    name: "Ananya Gupta",
    phones: [
      { value: "+91 98765 12345", type: "mobile", isPrimary: true },
      { value: "+1 (415) 555-0101", type: "work" },
      { value: "0044 20 7946 0958", type: "other" },
      { value: "022-2659 1234", type: "work" },
      { value: "+65 6123 4567 ext. 89", type: "work" },
    ],
  }),
  // The same number written two ways: should show once
  edgeCase(16, { name: "Manoj Tiwari", phones: [{ value: "+91 98765 43210", isPrimary: true }, { value: "+91 9876543210" }] }),
  // Placeholder only
  edgeCase(17, { name: "Sneha Kulkarni", phones: [{ value: "N/A" }] }),

  // ---------- Social profiles ----------

  // Without https:// — should still become a working link
  edgeCase(18, { name: "Rohit Saxena", socials: [{ platform: "linkedin", url: "linkedin.com/in/rohit-saxena" }] }),
  // Plain http: shown as https
  edgeCase(19, { name: "Tanvi Shah", socials: [{ platform: "linkedin", url: "http://www.linkedin.com/in/tanvi-shah" }] }),
  // Trailing slash and tracking query string
  edgeCase(20, { name: "Aditya Bose", socials: [{ platform: "linkedin", url: "https://in.linkedin.com/in/aditya-bose/?originalSubdomain=in" }] }),
  // Unsafe link: must NOT become a clickable link
  edgeCase(21, { name: "Security Test", socials: [{ platform: "linkedin", url: "javascript:alert('xss')" }] }),
  // Not a URL at all: must not become a link
  edgeCase(22, { name: "Garbage Link", socials: [{ platform: "other", url: "not a url" }] }),
  // Only GitHub, no LinkedIn: GitHub is shown first
  edgeCase(23, { name: "Github Only", socials: [{ platform: "github", url: "https://github.com/github-only" }] }),
  // Labelled LinkedIn but points at GitHub: must be treated as GitHub, not as LinkedIn
  edgeCase(53, { name: "Wrong Platform", socials: [{ platform: "linkedin", url: "https://github.com/wrong-platform" }] }),
  // Empty entries and a duplicate among real ones: only two profiles remain, LinkedIn first
  edgeCase(54, {
    name: "Messy Profiles",
    socials: [
      { platform: "x", url: "https://twitter.com/messy_profiles" },
      { platform: "other", url: "" },
      { platform: "linkedin", url: "https://www.linkedin.com/in/messy-profiles" },
      { platform: "linkedin", url: "https://www.linkedin.com/in/messy-profiles" },
    ],
  }),

  // ---------- Experience (sorted and filtered as a number of years) ----------

  // Fresher: no work history, 0 months
  edgeCase(24, { name: "Fresher Candidate", totalExperienceMonths: 0, experience: [] }),
  // Total unknown even though a job is listed: experience shows "---" and sorts last
  edgeCase(25, { name: "Unknown Total", totalExperienceMonths: null }),
  edgeCase(26, { name: "One Year", totalExperienceMonths: 12 }),
  // Months only: shows "6 mos" and counts as 0.5 years in the filter
  edgeCase(27, { name: "Six Months", totalExperienceMonths: 6 }),
  edgeCase(28, { name: "Two And A Half", totalExperienceMonths: 30 }),
  edgeCase(29, { name: "Ten Years", totalExperienceMonths: 120 }),
  edgeCase(30, { name: "Very Senior", totalExperienceMonths: 420 }),
  // Between jobs: no current job, so Company/Role show the most recent one, marked as past
  edgeCase(55, {
    name: "Between Jobs",
    experience: [
      { company: "Flipkart", title: "Product Manager", startDate: "2021-03", endDate: "2026-06" },
      { company: "Myntra", title: "Associate PM", startDate: "2018-07", endDate: "2021-02" },
    ],
  }),
  // Two current jobs (e.g. a side role): the first one counts as current
  edgeCase(56, {
    name: "Two Current Jobs",
    experience: [
      { company: "Razorpay", title: "Staff Engineer", startDate: "2023-01", endDate: null },
      { company: "Open Source Foundation", title: "Maintainer", startDate: "2020-05", endDate: null },
    ],
  }),
  // Job with no dates at all: the work history shows no date line, nothing crashes
  edgeCase(57, { name: "Undated Job", experience: [{ company: "Test Corp", title: "Consultant" }] }),

  // ---------- Skills ----------

  // Single skill: no "+N" badge
  edgeCase(31, { name: "One Skill", skills: ["Excel"] }),
  // Blank and padded entries: should show React and Vue only
  edgeCase(32, { name: "Messy Skills", skills: ["", " React", "  ", "Vue ", ""] }),
  // Repeated skill, in any capitalisation: should show once
  edgeCase(33, { name: "Duplicate Skills", skills: ["React", "React", "TypeScript", "react"] }),
  // One very long skill name: should truncate in the table, wrap in the card
  edgeCase(34, {
    name: "Long Skill",
    skills: ["Enterprise Resource Planning System Integration and Data Migration Consulting", "SQL"],
  }),

  // ---------- Company / location (select filters) ----------

  // Same company, different capitalisation: one "Infosys" filter option
  edgeCase(35, { name: "Lowercase Company", experience: [{ company: "infosys", title: "Software Engineer", startDate: "2022-11", endDate: null }] }),
  edgeCase(36, {
    name: "Remote Worker",
    location: { display: "Remote" },
    experience: [{ company: "Infosys", title: "Software Engineer", startDate: "2022-11", endDate: null }],
  }),
  // No work history and no location: filters offer nothing for them, nothing breaks
  edgeCase(37, { name: "No Company", experience: [], location: null }),
  // Country the flag set doesn't know: location shows without a flag
  edgeCase(58, { name: "Unknown Country", location: { city: "Reykjavík", countryCode: "IS", display: "Reykjavík, Iceland" }, timezone: "Atlantic/Reykjavik" }),

  // ---------- Timezone ----------

  // No timezone
  edgeCase(38, { name: "No Timezone", timezone: null }),
  // Invalid zone name: should show "---", not crash
  edgeCase(39, { name: "Invalid Timezone", timezone: "Mars/Olympus_Mons" }),
  // UTC: valid but no country → globe instead of a flag
  edgeCase(40, { name: "UTC Person", timezone: "UTC", location: null }),
  // Old zone name (now Asia/Kolkata)
  edgeCase(41, { name: "Legacy Zone", timezone: "Asia/Calcutta" }),
  // Quarter-hour offset (+5:45)
  edgeCase(42, { name: "Bikash Thapa", timezone: "Asia/Kathmandu", location: { city: "Kathmandu", countryCode: "NP", display: "Kathmandu, Nepal" } }),
  // Half-hour behind UTC (−3:30)
  edgeCase(43, { name: "Liam O'Brien", timezone: "America/St_Johns", location: { city: "St. John's", countryCode: "CA", display: "St. John's, Canada" } }),
  // Furthest ahead (+14) and furthest behind (−11): ends of the timezone sort
  edgeCase(44, { name: "Earliest Clock", timezone: "Pacific/Kiritimati", location: { city: "Kiritimati", countryCode: "KI", display: "Kiritimati, Kiribati" } }),
  edgeCase(45, { name: "Latest Clock", timezone: "Pacific/Pago_Pago", location: { city: "Pago Pago", countryCode: "AS", display: "Pago Pago, American Samoa" } }),

  // ---------- Education ----------

  // Institution only, no degree: the institution becomes the title
  edgeCase(59, { name: "Institution Only", education: [{ institution: "Delhi Public School" }] }),
  // An empty entry among real ones: ignored
  edgeCase(60, {
    name: "Empty Education",
    education: [{}, { degree: "MBA", fieldOfStudy: "Marketing", endYear: 2019 }, { degree: "B.Com", startYear: 2012, endYear: 2015 }],
  }),

  // ---------- Certifications ----------

  // Only a name: no provider, date or id
  edgeCase(46, { name: "Partial Certification", certifications: [{ name: "Scrum Master" }] }),
  // Same certificate twice (renewed), no ids: list keys must still be unique, newest first
  edgeCase(47, {
    name: "Renewed Certification",
    certifications: [
      { name: "PMP", provider: "PMI", issueDate: "2018-04" },
      { name: "PMP", provider: "PMI", issueDate: "2024-04" },
    ],
  }),
  // Expired certificate: marked "Expired"
  edgeCase(61, {
    name: "Expired Certification",
    certifications: [{ name: "CompTIA Security+", provider: "CompTIA", issueDate: "2020-01", expiryDate: "2023-01", credentialId: "COMP-SEC-61" }],
  }),

  // ---------- Confidence ----------

  // Out-of-range scores from the extractor: the bar must stay between 0% and 100%
  edgeCase(48, {
    name: "Bad Scores",
    confidence: { name: 1.4, emails: -0.2, phones: 1.1, totalExperienceMonths: 0.5, education: 2, skills: 0.3, experience: -1, location: 0.9, certifications: 0 },
  }),
  // Very low confidence on every field
  edgeCase(49, {
    name: "Low Confidence",
    confidence: { name: 0.12, emails: 0.08, phones: 0.15, totalExperienceMonths: 0.1, experience: 0.1, education: 0.05, skills: 0.2, location: 0.07, certifications: 0.03 },
  }),
  // Entered by hand: no scores, shown as "Manual entry" instead of 0%
  edgeCase(62, { name: "Manual Entry", source: { type: "manual", updatedAt: "2026-10-25T08:00:00.000Z" }, confidence: undefined }),

  // ---------- Text that could be mistaken for markup ----------

  // Angle brackets and quotes must show as plain text
  edgeCase(50, {
    name: `<b>Bold</b> "Quoted" & Co`,
    experience: [{ company: "<script>alert(1)</script>", title: "Engineer <Senior>", startDate: "2022-11", endDate: null }],
  }),
];

export const dummyCandidates: Candidate[] = [
  {
    id: "candidate-1",
    name: "Aarav Sharma",
    emails: [
      { value: "aarav.sharma@example.com", type: "personal", isPrimary: true },
      { value: "aarav@infosys.com", type: "work" },
    ],
    phones: [
      { value: "+91 98765 43210", type: "mobile", isPrimary: true },
      { value: "+91 97765 43210", type: "mobile" },
    ],
    socials: [
      { platform: "linkedin", url: "https://www.linkedin.com/in/aarav-sharma" },
      { platform: "x", url: "https://x.com/aarav_sharma" },
    ],
    totalExperienceMonths: 60,
    experience: [
      {
        company: "Infosys",
        title: "Senior Frontend Developer",
        startDate: "2024-02",
        endDate: null,
        location: "Jaipur, India",
      },
      { company: "Zoho", title: "Frontend Developer", startDate: "2021-11", endDate: "2024-01" },
    ],
    education: [
      {
        institution: "Christ University",
        degree: "B.Tech",
        fieldOfStudy: "Computer Science",
        startYear: 2016,
        endYear: 2020,
      },
    ],
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
    certifications: [
      {
        name: "AWS Certified Developer",
        provider: "Amazon Web Services",
        issueDate: "2024",
        credentialId: "AWS-DEV-1001",
      },
      { name: "Meta Front-End Developer", provider: "Meta", issueDate: "2023", credentialId: "META-FE-1002" },
    ],
    location: { city: "Jaipur", countryCode: "IN", display: "Jaipur, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16aa",
      extractedAt: "2026-10-03T09:27:00.000Z",
      updatedAt: "2026-10-03T09:27:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.98,
      phones: 0.96,
      socials: 0.9,
      totalExperienceMonths: 0.95,
      experience: 0.96,
      education: 0.97,
      skills: 0.98,
      certifications: 0.92,
      location: 0.94,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-13",
    name: "Emily Carter",
    emails: [{ value: "emily.carter@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+1 415 555 0132", type: "mobile", isPrimary: true }],
    socials: [
      { platform: "linkedin", url: "https://www.linkedin.com/in/emily-carter" },
      { platform: "github", url: "https://github.com/emily68" },
    ],
    totalExperienceMonths: 72,
    experience: [
      {
        company: "Salesforce",
        title: "Senior Software Engineer",
        startDate: "2023-07",
        endDate: null,
        location: "San Francisco, USA",
      },
      { company: "Oracle", title: "Software Engineer", startDate: "2020-11", endDate: "2023-06" },
    ],
    education: [
      {
        institution: "University of California, Berkeley",
        degree: "B.S.",
        fieldOfStudy: "Computer Science",
        startYear: 2016,
        endYear: 2020,
      },
    ],
    skills: ["React", "TypeScript", "GraphQL", "AWS", "Jest"],
    certifications: [
      {
        name: "AWS Certified Solutions Architect – Associate",
        provider: "Amazon Web Services",
        issueDate: "2025",
        credentialId: "AWS-SA-13001",
      },
    ],
    location: { city: "San Francisco", countryCode: "US", display: "San Francisco, USA" },
    timezone: "America/Los_Angeles",
    source: {
      type: "resume",
      resumeFileId: "file_beb2",
      extractedAt: "2026-10-14T09:08:00.000Z",
      updatedAt: "2026-10-14T09:08:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.98,
      phones: 0.95,
      socials: 0.9,
      totalExperienceMonths: 0.96,
      experience: 0.96,
      education: 0.97,
      skills: 0.98,
      certifications: 0.94,
      location: 0.95,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-2",
    name: "Priya Verma",
    emails: [{ value: "priya.verma@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 98123 45678", type: "mobile", isPrimary: true }],
    socials: [
      { platform: "linkedin", url: "https://www.linkedin.com/in/priya-verma" },
      { platform: "github", url: "https://github.com/priya28" },
    ],
    totalExperienceMonths: 36,
    experience: [
      {
        company: "TCS",
        title: "Backend Developer",
        startDate: "2025-03",
        endDate: null,
        location: "Pune, India",
      },
      { company: "Capgemini", title: "Backend Developer", startDate: "2023-11", endDate: "2025-02" },
    ],
    education: [{ institution: "IIT Bombay", degree: "MCA", startYear: 2020, endYear: 2023 }],
    skills: ["Python", "Django", "REST APIs", "MySQL", "Docker"],
    certifications: [
      {
        name: "PCAP – Certified Associate Python Programmer",
        provider: "Python Institute",
        issueDate: "2023",
        credentialId: "PCAP-2001",
      },
    ],
    location: { city: "Pune", countryCode: "IN", display: "Pune, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16ab",
      extractedAt: "2026-10-04T09:28:00.000Z",
      updatedAt: "2026-10-04T09:28:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.97,
      phones: 0.93,
      socials: 0.9,
      totalExperienceMonths: 0.91,
      experience: 0.95,
      education: 0.98,
      skills: 0.96,
      certifications: 0.9,
      location: 0.94,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-14",
    name: "James Wilson",
    emails: [{ value: "james.wilson@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+44 7700 900123", type: "mobile", isPrimary: true }],
    socials: [],
    totalExperienceMonths: 108,
    experience: [
      {
        company: "Deloitte",
        title: "Lead Data Scientist",
        startDate: "2021-12",
        endDate: null,
        location: "London, UK",
      },
      { company: "Barclays", title: "Data Scientist", startDate: "2017-11", endDate: "2021-11" },
    ],
    education: [
      {
        institution: "Imperial College London",
        degree: "M.Sc.",
        fieldOfStudy: "Data Science",
        startYear: 2014,
        endYear: 2016,
      },
      {
        institution: "University of Manchester",
        degree: "B.Sc.",
        fieldOfStudy: "Mathematics",
        startYear: 2011,
        endYear: 2014,
      },
    ],
    skills: ["Python", "SQL", "Spark", "Databricks", "Machine Learning"],
    certifications: [
      {
        name: "Microsoft Certified: Azure Data Scientist Associate",
        provider: "Microsoft",
        issueDate: "2025",
        credentialId: "AZ-DS-14001",
      },
    ],
    location: { city: "London", countryCode: "GB", display: "London, UK" },
    timezone: "Europe/London",
    source: {
      type: "resume",
      resumeFileId: "file_beb3",
      extractedAt: "2026-10-15T09:09:00.000Z",
      updatedAt: "2026-10-15T09:09:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.97,
      phones: 0.94,
      totalExperienceMonths: 0.97,
      experience: 0.95,
      education: 0.98,
      skills: 0.98,
      certifications: 0.93,
      location: 0.94,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-3",
    name: "Rohan Mehta",
    emails: [{ value: "rohan.mehta@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 98987 65432", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/rohan-mehta" }],
    totalExperienceMonths: 84,
    experience: [
      {
        company: "Accenture",
        title: "Technical Lead",
        startDate: "2023-01",
        endDate: null,
        location: "Bengaluru, India",
      },
      { company: "L&T Infotech", title: "Associate", startDate: "2019-11", endDate: "2022-12" },
    ],
    education: [
      {
        institution: "NIT Trichy",
        degree: "B.E.",
        fieldOfStudy: "Information Technology",
        startYear: 2014,
        endYear: 2018,
      },
    ],
    skills: ["Java", "Spring Boot", "Microservices", "Kafka", "Kubernetes"],
    certifications: [
      {
        name: "Oracle Java SE Professional",
        provider: "Oracle",
        issueDate: "2022",
        credentialId: "ORA-JAVA-3001",
        expiryDate: "2025-06",
      },
      {
        name: "Certified Kubernetes Administrator",
        provider: "CNCF",
        issueDate: "2024",
        credentialId: "CKA-3002",
      },
    ],
    location: { city: "Bengaluru", countryCode: "IN", display: "Bengaluru, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16ac",
      extractedAt: "2026-10-05T09:29:00.000Z",
      updatedAt: "2026-10-05T09:29:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.96,
      phones: 0.94,
      socials: 0.9,
      totalExperienceMonths: 0.97,
      experience: 0.96,
      education: 0.96,
      skills: 0.98,
      certifications: 0.94,
      location: 0.95,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-15",
    name: "Olivia Chen",
    emails: [{ value: "olivia.chen@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+1 212 555 0145", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/olivia-chen" }],
    totalExperienceMonths: 48,
    experience: [
      {
        company: "HubSpot",
        title: "CRM Business Analyst",
        startDate: "2024-09",
        endDate: null,
        location: "New York, USA",
      },
      { company: "Oracle", title: "CRM Business Analyst", startDate: "2022-11", endDate: "2024-08" },
    ],
    education: [
      {
        institution: "University of California, Berkeley",
        degree: "B.A.",
        fieldOfStudy: "Business Administration",
        startYear: 2018,
        endYear: 2022,
      },
    ],
    skills: ["Salesforce", "CRM Analytics", "SQL", "Tableau", "Reporting"],
    certifications: [
      {
        name: "Salesforce Certified Administrator",
        provider: "Salesforce",
        issueDate: "2024",
        credentialId: "SF-ADM-15001",
      },
    ],
    location: { city: "New York", countryCode: "US", display: "New York, USA" },
    timezone: "America/New_York",
    source: {
      type: "resume",
      resumeFileId: "file_beb4",
      extractedAt: "2026-10-16T09:10:00.000Z",
      updatedAt: "2026-10-16T09:10:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.97,
      phones: 0.94,
      socials: 0.9,
      totalExperienceMonths: 0.95,
      experience: 0.95,
      education: 0.96,
      skills: 0.98,
      certifications: 0.94,
      location: 0.96,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-4",
    name: "Sneha Patel",
    emails: [{ value: "sneha.patel@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 97654 32109", type: "mobile", isPrimary: true }],
    socials: [],
    totalExperienceMonths: 48,
    experience: [
      {
        company: "Wipro",
        title: "Data Analyst",
        startDate: "2024-09",
        endDate: null,
        location: "Ahmedabad, India",
      },
      { company: "Cognizant", title: "Data Analyst", startDate: "2022-11", endDate: "2024-08" },
    ],
    education: [
      {
        institution: "University of Pune",
        degree: "B.Sc.",
        fieldOfStudy: "Data Science",
        startYear: 2019,
        endYear: 2022,
      },
    ],
    skills: ["Python", "SQL", "Pandas", "Power BI", "Machine Learning"],
    certifications: [
      {
        name: "Microsoft Power BI Data Analyst",
        provider: "Microsoft",
        issueDate: "2024",
        credentialId: "MS-DA-4001",
      },
    ],
    location: { city: "Ahmedabad", countryCode: "IN", display: "Ahmedabad, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16ad",
      extractedAt: "2026-10-06T09:30:00.000Z",
      updatedAt: "2026-10-06T09:30:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.98,
      phones: 0.95,
      totalExperienceMonths: 0.93,
      experience: 0.94,
      education: 0.97,
      skills: 0.96,
      certifications: 0.91,
      location: 0.95,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-16",
    name: "Daniel Kim",
    emails: [{ value: "daniel.kim@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+65 8123 4567", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/daniel-kim" }],
    totalExperienceMonths: 84,
    experience: [
      {
        company: "Grab",
        title: "Cloud Infrastructure Engineer",
        startDate: "2023-01",
        endDate: null,
        location: "Singapore",
      },
      { company: "Shopee", title: "Cloud Infrastructure Engineer", startDate: "2019-11", endDate: "2022-12" },
    ],
    education: [
      {
        institution: "National University of Singapore",
        degree: "B.Eng.",
        fieldOfStudy: "Information Systems",
        startYear: 2014,
        endYear: 2018,
      },
    ],
    skills: ["Kubernetes", "Terraform", "AWS", "Docker", "CI/CD"],
    certifications: [
      {
        name: "Certified Kubernetes Administrator",
        provider: "CNCF",
        issueDate: "2025",
        credentialId: "CKA-16001",
      },
    ],
    location: { city: "Singapore", countryCode: "SG", display: "Singapore" },
    timezone: "Asia/Singapore",
    source: {
      type: "resume",
      resumeFileId: "file_beb5",
      extractedAt: "2026-10-17T09:11:00.000Z",
      updatedAt: "2026-10-17T09:11:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.96,
      phones: 0.94,
      socials: 0.9,
      totalExperienceMonths: 0.96,
      experience: 0.95,
      education: 0.97,
      skills: 0.99,
      certifications: 0.95,
      location: 0.96,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-5",
    name: "Karan Singh",
    emails: [{ value: "karan.singh@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 91234 56789", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/karan-singh" }],
    totalExperienceMonths: 24,
    experience: [
      {
        company: "Tech Mahindra",
        title: "Frontend Developer",
        startDate: "2024-11",
        endDate: null,
        location: "Delhi, India",
      },
    ],
    education: [
      {
        institution: "Anna University",
        degree: "B.Tech",
        fieldOfStudy: "Information Technology",
        startYear: 2019,
        endYear: 2023,
      },
    ],
    skills: ["JavaScript", "React", "Tailwind CSS", "Git"],
    certifications: [],
    location: { city: "Delhi", countryCode: "IN", display: "Delhi, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16ae",
      extractedAt: "2026-10-07T09:31:00.000Z",
      updatedAt: "2026-10-07T09:31:00.000Z",
    },
    confidence: {
      name: 0.97,
      emails: 0.96,
      phones: 0.92,
      socials: 0.9,
      totalExperienceMonths: 0.89,
      experience: 0.93,
      education: 0.96,
      skills: 0.95,
      certifications: 0.99,
      location: 0.91,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-17",
    name: "Sofia Martinez",
    emails: [{ value: "sofia.martinez@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+34 612 345 678", type: "mobile", isPrimary: true }],
    socials: [],
    totalExperienceMonths: 60,
    experience: [
      {
        company: "Accenture",
        title: "Cybersecurity Analyst",
        startDate: "2024-02",
        endDate: null,
        location: "Madrid, Spain",
      },
      { company: "Telefónica", title: "Cybersecurity Analyst", startDate: "2021-11", endDate: "2024-01" },
    ],
    education: [
      {
        institution: "Universidad Politécnica de Madrid",
        degree: "M.Sc.",
        fieldOfStudy: "Cybersecurity",
        startYear: 2019,
        endYear: 2021,
      },
    ],
    skills: ["SIEM", "Incident Response", "Python", "Network Security", "Splunk"],
    certifications: [{ name: "CompTIA Security+", provider: "CompTIA", issueDate: "2024", credentialId: "SEC-17001" }],
    location: { city: "Madrid", countryCode: "ES", display: "Madrid, Spain" },
    timezone: "Europe/Madrid",
    source: {
      type: "resume",
      resumeFileId: "file_beb6",
      extractedAt: "2026-10-18T09:12:00.000Z",
      updatedAt: "2026-10-18T09:12:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.96,
      phones: 0.93,
      totalExperienceMonths: 0.95,
      experience: 0.95,
      education: 0.97,
      skills: 0.98,
      certifications: 0.93,
      location: 0.94,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-6",
    name: "Ananya Gupta",
    emails: [{ value: "ananya.gupta@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 99887 76655", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/ananya-gupta" }],
    totalExperienceMonths: 72,
    experience: [
      {
        company: "Deloitte",
        title: "Talent Acquisition Manager",
        startDate: "2023-07",
        endDate: null,
        location: "Gurugram, India",
      },
      { company: "Mindtree", title: "Talent Acquisition", startDate: "2020-11", endDate: "2023-06" },
    ],
    education: [
      {
        institution: "BITS Pilani",
        degree: "MBA",
        fieldOfStudy: "Human Resources",
        startYear: 2018,
        endYear: 2020,
      },
    ],
    skills: ["Recruitment", "Talent Acquisition", "HR Analytics", "Workday"],
    certifications: [{ name: "SHRM Certified Professional", provider: "SHRM", issueDate: "2023", credentialId: "SHRM-6001" }],
    location: { city: "Gurugram", countryCode: "IN", display: "Gurugram, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16af",
      extractedAt: "2026-10-08T09:32:00.000Z",
      updatedAt: "2026-10-08T09:32:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.98,
      phones: 0.97,
      socials: 0.9,
      totalExperienceMonths: 0.95,
      experience: 0.96,
      education: 0.98,
      skills: 0.94,
      certifications: 0.93,
      location: 0.94,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-18",
    name: "Noah Thompson",
    emails: [{ value: "noah.thompson@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+61 412 345 678", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/noah-thompson" }],
    totalExperienceMonths: 36,
    experience: [
      {
        company: "Atlassian",
        title: "Full Stack Developer",
        startDate: "2025-03",
        endDate: null,
        location: "Sydney, Australia",
      },
      { company: "Canva", title: "Full Stack Developer", startDate: "2023-11", endDate: "2025-02" },
    ],
    education: [
      {
        institution: "University of Sydney",
        degree: "B.IT",
        fieldOfStudy: "Information Technology",
        startYear: 2019,
        endYear: 2022,
      },
    ],
    skills: ["React", "Node.js", "MongoDB", "Azure", "REST APIs"],
    certifications: [
      {
        name: "Microsoft Certified: Azure Fundamentals",
        provider: "Microsoft",
        issueDate: "2025",
        credentialId: "AZ-900-18001",
      },
    ],
    location: { city: "Sydney", countryCode: "AU", display: "Sydney, Australia" },
    timezone: "Australia/Sydney",
    source: {
      type: "resume",
      resumeFileId: "file_beb7",
      extractedAt: "2026-10-19T09:13:00.000Z",
      updatedAt: "2026-10-19T09:13:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.97,
      phones: 0.94,
      socials: 0.9,
      totalExperienceMonths: 0.93,
      experience: 0.95,
      education: 0.96,
      skills: 0.97,
      certifications: 0.94,
      location: 0.95,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-7",
    name: "Vikram Joshi",
    emails: [{ value: "vikram.joshi@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 98712 34567", type: "mobile", isPrimary: true }],
    socials: [],
    totalExperienceMonths: 96,
    experience: [
      {
        company: "Amazon",
        title: "DevOps Engineer",
        startDate: "2022-06",
        endDate: null,
        location: "Hyderabad, India",
      },
      { company: "Zoho", title: "DevOps Engineer", startDate: "2018-11", endDate: "2022-05" },
    ],
    education: [
      {
        institution: "Delhi University",
        degree: "M.Tech",
        fieldOfStudy: "Computer Science",
        startYear: 2015,
        endYear: 2017,
      },
    ],
    skills: ["AWS", "Terraform", "Docker", "Kubernetes", "CI/CD"],
    certifications: [
      {
        name: "AWS Solutions Architect – Associate",
        provider: "Amazon Web Services",
        issueDate: "2024",
        credentialId: "AWS-SA-7001",
      },
    ],
    location: { city: "Hyderabad", countryCode: "IN", display: "Hyderabad, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16b0",
      extractedAt: "2026-10-09T09:33:00.000Z",
      updatedAt: "2026-10-09T09:33:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.97,
      phones: 0.95,
      totalExperienceMonths: 0.96,
      experience: 0.97,
      education: 0.97,
      skills: 0.99,
      certifications: 0.95,
      location: 0.94,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-19",
    name: "Fatima Al-Hassan",
    emails: [{ value: "fatima.hassan@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+971 50 123 4567", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/fatima-al-hassan" }],
    totalExperienceMonths: 96,
    experience: [
      {
        company: "Emirates Group",
        title: "HR Business Partner",
        startDate: "2022-06",
        endDate: null,
        location: "Dubai, UAE",
      },
      { company: "Etisalat", title: "HR Business", startDate: "2018-11", endDate: "2022-05" },
    ],
    education: [
      {
        institution: "American University of Sharjah",
        degree: "MBA",
        fieldOfStudy: "Human Resources",
        startYear: 2016,
        endYear: 2018,
      },
    ],
    skills: ["HR Analytics", "Workday", "Recruitment", "People Operations"],
    certifications: [{ name: "SHRM Certified Professional", provider: "SHRM", issueDate: "2024", credentialId: "SHRM-19001" }],
    location: { city: "Dubai", countryCode: "AE", display: "Dubai, UAE" },
    timezone: "Asia/Dubai",
    source: {
      type: "resume",
      resumeFileId: "file_beb8",
      extractedAt: "2026-10-20T09:14:00.000Z",
      updatedAt: "2026-10-20T09:14:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.97,
      phones: 0.93,
      socials: 0.9,
      totalExperienceMonths: 0.96,
      experience: 0.94,
      education: 0.98,
      skills: 0.95,
      certifications: 0.93,
      location: 0.95,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-8",
    name: "Neha Kapoor",
    emails: [{ value: "neha.kapoor@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 90123 45678", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/neha-kapoor" }],
    totalExperienceMonths: 12,
    experience: [
      {
        company: "EY",
        title: "Junior Business Analyst",
        startDate: "2025-11",
        endDate: null,
        location: "Mumbai, India",
      },
    ],
    education: [{ institution: "IIM Ahmedabad", degree: "BBA", startYear: 2022, endYear: 2025 }],
    skills: ["Excel", "SQL", "Tableau", "Data Visualization"],
    certifications: [{ name: "Tableau Desktop Specialist", provider: "Tableau", issueDate: "2025", credentialId: "TAB-8001" }],
    location: { city: "Mumbai", countryCode: "IN", display: "Mumbai, India" },
    timezone: "Asia/Kolkata",
    source: { type: "manual", updatedAt: "2026-10-10T09:34:00.000Z" },
  },
  {
    id: "candidate-20",
    name: "Lucas Schneider",
    emails: [{ value: "lucas.schneider@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+49 151 23456789", type: "mobile", isPrimary: true }],
    socials: [],
    totalExperienceMonths: 72,
    experience: [
      {
        company: "SAP",
        title: "SAP Functional Consultant",
        startDate: "2023-07",
        endDate: null,
        location: "Berlin, Germany",
      },
      { company: "Siemens", title: "SAP Functional Consultant", startDate: "2020-11", endDate: "2023-06" },
    ],
    education: [
      {
        institution: "Technische Universität Berlin",
        degree: "B.Sc.",
        fieldOfStudy: "Business Informatics",
        startYear: 2017,
        endYear: 2020,
      },
    ],
    skills: ["SAP S/4HANA", "SQL", "ERP", "Business Process Optimization"],
    certifications: [{ name: "SAP Certified Associate", provider: "SAP", issueDate: "2025", credentialId: "SAP-20001" }],
    location: { city: "Berlin", countryCode: "DE", display: "Berlin, Germany" },
    timezone: "Europe/Berlin",
    source: { type: "manual", updatedAt: "2026-10-17T09:36:00.000Z" },
  },
  {
    id: "candidate-9",
    name: "Aditya Rao",
    emails: [{ value: "aditya.rao@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 93456 78901", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/aditya-rao" }],
    totalExperienceMonths: 48,
    experience: [
      {
        company: "Bosch",
        title: "Software Engineer",
        startDate: "2024-09",
        endDate: null,
        location: "Chennai, India",
      },
      { company: "L&T Infotech", title: "Software Engineer", startDate: "2022-11", endDate: "2024-08" },
    ],
    education: [
      {
        institution: "Christ University",
        degree: "B.Tech",
        fieldOfStudy: "Electronics",
        startYear: 2017,
        endYear: 2021,
      },
    ],
    skills: ["C++", "Python", "Linux", "Embedded Systems", "Git"],
    certifications: [],
    location: { city: "Chennai", countryCode: "IN", display: "Chennai, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_16b2",
      extractedAt: "2026-10-11T09:35:00.000Z",
      updatedAt: "2026-10-11T09:35:00.000Z",
    },
    confidence: {
      name: 0.97,
      emails: 0.96,
      phones: 0.94,
      socials: 0.9,
      totalExperienceMonths: 0.93,
      experience: 0.92,
      education: 0.95,
      skills: 0.96,
      certifications: 0.98,
      location: 0.94,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-10",
    name: "Meera Iyer",
    emails: [{ value: "meera.iyer@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 92345 67890", type: "mobile", isPrimary: true }],
    socials: [{ platform: "linkedin", url: "https://www.linkedin.com/in/meera-iyer" }],
    totalExperienceMonths: 60,
    experience: [
      {
        company: "Fractal Analytics",
        title: "Data Scientist",
        startDate: "2024-02",
        endDate: null,
        location: "Bengaluru, India",
      },
      { company: "L&T Infotech", title: "Data Scientist", startDate: "2021-11", endDate: "2024-01" },
    ],
    education: [
      {
        institution: "NIT Trichy",
        degree: "M.Sc.",
        fieldOfStudy: "Statistics",
        startYear: 2018,
        endYear: 2020,
      },
    ],
    skills: ["R", "Python", "SQL", "Statistical Modeling", "Tableau"],
    certifications: [
      {
        name: "Google Advanced Data Analytics",
        provider: "Google",
        issueDate: "2024",
        credentialId: "GOOG-DA-10001",
      },
    ],
    location: { city: "Bengaluru", countryCode: "IN", display: "Bengaluru, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_beaf",
      extractedAt: "2026-10-11T09:05:00.000Z",
      updatedAt: "2026-10-11T09:05:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.98,
      phones: 0.95,
      socials: 0.9,
      totalExperienceMonths: 0.96,
      experience: 0.95,
      education: 0.98,
      skills: 0.97,
      certifications: 0.93,
      location: 0.96,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-11",
    name: "Rahul Nair",
    emails: [{ value: "rahul.nair@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 94567 89012", type: "mobile", isPrimary: true }],
    socials: [],
    totalExperienceMonths: 36,
    experience: [
      {
        company: "KPMG",
        title: "Financial Analyst",
        startDate: "2025-03",
        endDate: null,
        location: "Kochi, India",
      },
      { company: "Cognizant", title: "Financial Analyst", startDate: "2023-11", endDate: "2025-02" },
    ],
    education: [{ institution: "University of Pune", degree: "B.Com", startYear: 2020, endYear: 2023 }],
    skills: ["Financial Analysis", "Excel", "SQL", "Power BI"],
    certifications: [],
    location: { city: "Kochi", countryCode: "IN", display: "Kochi, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_beb0",
      extractedAt: "2026-10-12T09:06:00.000Z",
      updatedAt: "2026-10-12T09:06:00.000Z",
    },
    confidence: {
      name: 0.98,
      emails: 0.96,
      phones: 0.93,
      totalExperienceMonths: 0.92,
      experience: 0.94,
      education: 0.97,
      skills: 0.94,
      certifications: 0.98,
      location: 0.91,
      timezone: 0.85,
    },
  },
  {
    id: "candidate-12",
    name: "Ishita Desai",
    emails: [{ value: "ishita.desai@example.com", type: "personal", isPrimary: true }],
    phones: [{ value: "+91 95678 90123", type: "mobile", isPrimary: true }],
    socials: [
      { platform: "linkedin", url: "https://www.linkedin.com/in/ishita-desai" },
      { platform: "portfolio", url: "https://ishitadesai.design" },
    ],
    totalExperienceMonths: 72,
    experience: [
      {
        company: "Adobe",
        title: "Senior UI/UX Designer",
        startDate: "2023-07",
        endDate: null,
        location: "Noida, India",
      },
      { company: "HCLTech", title: "UI/UX Designer", startDate: "2020-11", endDate: "2023-06" },
    ],
    education: [
      {
        institution: "Anna University",
        degree: "B.Des",
        fieldOfStudy: "Communication Design",
        startYear: 2015,
        endYear: 2019,
      },
    ],
    skills: ["Figma", "UI/UX", "Prototyping", "Design Systems", "Adobe XD"],
    certifications: [
      {
        name: "Google UX Design Certificate",
        provider: "Google",
        issueDate: "2023",
        credentialId: "GOOG-UX-12001",
      },
    ],
    location: { city: "Noida", countryCode: "IN", display: "Noida, India" },
    timezone: "Asia/Kolkata",
    source: {
      type: "resume",
      resumeFileId: "file_beb1",
      extractedAt: "2026-10-13T09:07:00.000Z",
      updatedAt: "2026-10-13T09:07:00.000Z",
    },
    confidence: {
      name: 0.99,
      emails: 0.98,
      phones: 0.95,
      socials: 0.9,
      totalExperienceMonths: 0.96,
      experience: 0.96,
      education: 0.97,
      skills: 0.98,
      certifications: 0.94,
      location: 0.93,
      timezone: 0.85,
    },
  },
  // Edge cases for testing (defined above)
  ...edgeCaseCandidates,
];

// export const dummyCandidates: Candidate[] = []
