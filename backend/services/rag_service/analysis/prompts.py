import re
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

CORPORATE_CLAUSES_LIBRARY: list[dict] = [
    {"id": "sla_uptime",             "name": "Service Level Agreement (SLA) & Uptime",      "category": "performance",  "keywords": ["SLA", "service level", "uptime", "availability", "99.9%", "downtime", "latency", "service credit", "MTTR", "response time"]},
    {"id": "data_protection_dpdp",   "name": "Data Protection & Privacy (DPDP / GDPR)",     "category": "privacy",      "keywords": ["data protection", "personal data", "DPDP Act", "data fiduciary", "data processor", "GDPR", "privacy", "consent", "PII", "data principal"]},
    {"id": "cybersecurity_certin",   "name": "Cybersecurity & Incident Reporting (CERT-In)", "category": "security",     "keywords": ["cybersecurity", "CERT-In", "incident", "breach", "security incident", "vulnerability", "log retention", "6 hours", "compromise"]},
    {"id": "ip_ownership_code",      "name": "Software IP & Work-For-Hire Assignment",      "category": "ip",           "keywords": ["intellectual property", "IP", "source code", "copyright", "patent", "work for hire", "invention assignment", "proprietary code", "repository"]},
    {"id": "software_license_scope",  "name": "Software License Scope & SaaS Restrictions",  "category": "ip",           "keywords": ["license", "licence", "grant", "sublicense", "EULA", "subscription", "named users", "concurrent users", "reverse engineering", "decompilation"]},
    {"id": "source_code_escrow",     "name": "Source Code Escrow & Repository Rights",      "category": "ip",           "keywords": ["escrow", "source code", "repository", "code deposit", "release condition", "github", "gitlab", "escrow agent"]},
    {"id": "open_source_governance",  "name": "Open Source Software (OSS) Governance",       "category": "ip",           "keywords": ["open source", "OSS", "GPL", "AGPL", "copyleft", "Apache", "MIT license", "third party software", "viral license"]},
    {"id": "confidentiality_nda",     "name": "Confidentiality & Trade Secrets (Source Code & APIs)", "category": "ip", "keywords": ["confidential", "non-disclosure", "NDA", "trade secret", "source code", "API key", "proprietary algorithm", "credentials"]},
    {"id": "limitation_liability_it", "name": "Limitation of Liability & Data Loss Caps",    "category": "liability",   "keywords": ["liability", "limit", "cap", "indirect damages", "consequential damages", "loss of data", "loss of profit", "maximum liability"]},
    {"id": "ip_indemnification",      "name": "IP Infringement & Data Breach Indemnification","category": "liability",  "keywords": ["indemnify", "indemnification", "hold harmless", "IP infringement", "third-party claim", "data breach liability", "patent claim"]},
    {"id": "cloud_hosting_dr",       "name": "Cloud Hosting, BCP & Disaster Recovery",      "category": "performance",  "keywords": ["cloud", "hosting", "AWS", "Azure", "GCP", "disaster recovery", "BCP", "backup", "RTO", "RPO", "failover", "data center"]},
    {"id": "it_audit_pentest",       "name": "IT Audit, Penetration Testing & Compliance",  "category": "compliance",   "keywords": ["audit", "right to audit", "security audit", "penetration testing", "vulnerability assessment", "SOC 2", "ISO 27001", "VAPT"]},
    {"id": "vendor_transition_exit",  "name": "Vendor Lock-in, De-provisioning & Exit Aid",  "category": "exit",         "keywords": ["transition", "exit assistance", "data migration", "de-provisioning", "vendor lock-in", "data return", "deletion of data"]},
    {"id": "it_moonlighting",        "name": "IT Moonlighting & Dual Employment Clause",    "category": "employment",   "keywords": ["moonlighting", "dual employment", "side project", "conflict of interest", "outside programming", "freelancing"]},
    {"id": "tech_non_solicitation",   "name": "Tech Talent Non-Solicitation",                 "category": "restriction",  "keywords": ["non-solicitation", "non solicitation", "poaching", "developers", "engineers", "hire away", "recruit"]},
    {"id": "termination_it_service", "name": "Termination & Suspension of Cloud/IT Services","category": "exit",        "keywords": ["terminate", "termination", "suspension", "service cut-off", "notice period", "material breach", "immediate termination"]},
    {"id": "uat_acceptance",         "name": "UAT Acceptance Criteria & Milestones",        "category": "performance",  "keywords": ["UAT", "acceptance criteria", "user acceptance testing", "milestone", "defect severity", "sign-off", "deliverable"]},
    {"id": "software_maintenance",   "name": "Software Maintenance, Bug Fixes & Patches",  "category": "performance",  "keywords": ["maintenance", "bug fix", "patch", "hotfix", "support tier", "error correction", "software update"]},
    {"id": "force_majeure_cyber",    "name": "Force Majeure & Cyber Warfare / Telecom Outage","category": "performance","keywords": ["force majeure", "cyber attack", "DDoS", "internet outage", "telecom disruption", "cloud provider outage"]},
    {"id": "governing_law_tech",     "name": "Governing Law & IT Dispute Arbitration",      "category": "dispute",      "keywords": ["governing law", "jurisdiction", "arbitration", "seat of arbitration", "courts of", "IT dispute"]},
    {"id": "payment_milestones",      "name": "Tech Milestones & SaaS Subscription Fees",     "category": "financial",    "keywords": ["payment", "invoice", "subscription fee", "milestone payment", "license fee", "overdue", "withholding"]},
    {"id": "penalty_delay",          "name": "Liquidated Damages / Delay Penalties",         "category": "financial",    "keywords": ["liquidated damages", "penalty", "delay penalty", "late delivery", "service credit"]},
    {"id": "it_asset_capitalization", "name": "IT Asset & Equipment Security Clause",        "category": "corporate",    "keywords": ["laptop", "company asset", "remote device", "asset return", "MDM", "device security"]},
    {"id": "anti_bribery_tech",      "name": "Anti-Corruption & Tech Vendor Procurement",    "category": "compliance",   "keywords": ["anti-bribery", "anti-corruption", "procurement", "kickback", "Prevention of Corruption Act", "FCPA"]},
    {"id": "change_of_control",      "name": "Change of Control & Assignment of Software",  "category": "corporate",    "keywords": ["change of control", "acquisition", "merger", "assignment", "transfer of agreement"]},
]

_CLAUSE_NAMES_LIST = "\n".join(
    f"  {i+1:02d}. {c['name']} [{c['category']}]"
    for i, c in enumerate(CORPORATE_CLAUSES_LIBRARY)
)

INDIAN_LAW_CONTEXT = """
INDIAN INFORMATION TECHNOLOGY & CORPORATE LEGAL FRAMEWORK (Apply where relevant):

1. INFORMATION TECHNOLOGY ACT, 2000 (with 2008 Amendments):
  • Sec 10A   – Validity of contracts formed through electronic means / digital signatures
  • Sec 43    – Penalty and compensation for damage to computer system / data extraction
  • Sec 43A   – Compensation for failure to protect Sensitive Personal Data / Information (SPDI)
  • Sec 65    – Tampering with computer source code documents (imprisonment up to 3 years)
  • Sec 66/66C– Computer-related offences, hacking, identity theft, unauthorized access
  • Sec 67/67A– Obscene/unlawful electronic transmission liability
  • Sec 69/69B– Power to issue directions for interception/monitoring of computer resources
  • Sec 72/72A– Penalty for breach of confidentiality, privacy, and unauthorized disclosure of personal info
  • Sec 79    – Safe Harbor & Intermediary Guidelines (due diligence required for tech platforms/cloud hosting)
  • IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021/2023

2. DIGITAL PERSONAL DATA PROTECTION ACT, 2023 (DPDP Act):
  • Data Fiduciary vs Data Processor obligations in software systems and enterprise IT architectures
  • Mandatory legitimate purpose, clear notice, and verifiable consent prior to processing digital personal data
  • Obligations of Significant Data Fiduciaries (SDF): Data Protection Officer (DPO), Independent Data Auditor, DPIA
  • Cross-border transfer of personal data restrictions and government notification requirements
  • Mandatory notification of personal data breaches to the Data Protection Board of India and affected data principals
  • Severe financial penalties up to ₹250 Crores for failure to take reasonable security safeguards to prevent data breaches

3. CERT-In CYBER SECURITY DIRECTIONS (2022 / Current):
  • Mandatory 6-hour reporting window to CERT-In for all designated cyber incidents (ransomware, data leaks, server breaches)
  • Mandatory retention of system logs, firewall logs, and user access records within Indian jurisdiction for 180 days
  • Mandatory NTP time synchronization with National Physical Laboratory (NPL) or NIC clock servers
  • Cloud and VPN service providers mandatory maintenance of customer identity and activity logs

4. SOFTWARE INTELLECTUAL PROPERTY & TRADE SECRETS:
  • Copyright Act 1957: Computer software programs recognized as "literary works" under Sec 2(o)
  • Work-for-hire doctrine (Sec 17): Employer/client owns software code developed by employees/contractors only with explicit written assignment
  • Patents Act 1970 (Sec 3(k)): Non-patentability of computer programs per se, unless tied to novel technical hardware interactions
  • Open Source Software (OSS) Legal Risks: Copyleft contamination (GPL, AGPL) requiring proprietary source code disclosure
  • Trade Secret Protection: Breach of confidence enforceable under Indian common law and Contract Act 1872

5. INDIAN CONTRACT ACT 1872 IN IT AGREEMENTS:
  • Master Services Agreements (MSA), Statements of Work (SOW), SaaS contracts, and Service Level Agreements (SLA)
  • Sec 27: Agreements in restraint of trade void (Post-employment non-competes for software developers are void in India; non-disclosure and non-solicitation during employment remain enforceable)
  • Sec 73 & 74: Damages for breach of tech contract; liquidated damages vs penalty stipulations (uptime credits)
  • Enforceability of limitation of liability and exclusion of consequential damages/data loss

6. COMPANIES ACT 2013 — CORPORATE IT & CYBER GOVERNANCE:
  • Sec 134(5): Directors' Responsibility Statement regarding adequacy and operating effectiveness of internal financial and IT controls
  • Sec 177: Audit Committee statutory mandate to review cybersecurity, IT infrastructure risks, and enterprise vulnerability
  • Sec 188: Related Party Transactions (RPT) in IT procurement, software licensing, and group company technology outsourcing
"""

_LEGAL_DOC_SIGNALS = [
    "agreement", "contract", "deed", "service level", "sla", "software",
    "saas", "license", "nda", "confidentiality", "intellectual property",
    "source code", "escrow", "dpdp", "data protection", "cybersecurity",
    "cert-in", "master services", "statement of work", "sow", "msa",
    "uptime", "hosting", "cloud", "aws", "azure", "gcp", "liability",
    "indemnity", "termination", "non-compete", "moonlighting", "acceptance",
    "uat", "bug", "patch", "vendor", "client", "developer", "engineer",
]


def _classify_document(text: str) -> str:
    """Quick keyword-based document type classifier for IT corporate legal documents."""
    lower = text[:3000].lower()
    hits = sum(1 for kw in _LEGAL_DOC_SIGNALS if kw in lower)
    if hits >= 4:
        return "corporate_legal"
    if hits >= 2:
        return "general_legal"
    return "non_legal"


def build_prompt(doc_full: str, local_context: str, law_context: str, doc_type: str) -> str:
    clause_instruction = f"""
KNOWN IT & CORPORATE CLAUSE TYPES (check which ones are PRESENT in the document):
{_CLAUSE_NAMES_LIST}

For each clause you identify as PRESENT, include it in the "clauses" array formatted as:
"Clause Name — [exact meaning/impact as it appears in THIS document]"
"""

    if doc_type == "corporate_legal":
        task_block = f"""
TASK — FULL IT CORPORATE LEGAL ANALYSIS:

You MUST analyze every section of this document thoroughly with specific focus on IT Department, technology operations, cyber law, and corporate compliance:

1. SUMMARY (MANDATORY: minimum 120 words):
   - What type of IT document is this? (e.g., Master Services Agreement, SaaS Agreement, Software License, Service Level Agreement, Data Processing Agreement, IT Employee NDA & Invention Assignment, Cloud Hosting Contract)
   - Who are the parties? (e.g., Tech Vendor, Cloud Service Provider, Enterprise Client, IT Department, Developer)
   - What is the core technology scope, deliverables, or software architecture?
   - What is the commercial value, subscription fee, or financial consideration?
   - What is the contract duration, renewal terms, and SLA uptime commitment (e.g., 99.9%)?
   - What governing law and dispute jurisdiction apply?
   - Any critical risks, unusual carve-outs, or notable tech governance terms?

2. CLAUSES — identify ALL IT & corporate clauses present (aim for 5-10 clauses):
   Use the clause checklist above. For EACH clause found, write:
   "[Clause Name] — [exact meaning/impact as it appears in THIS document]"

3. OBLIGATIONS — list ALL concrete technical and legal duties of EACH party (aim for 5-8 items):
   Be specific: e.g., "Vendor must maintain 99.9% monthly availability and report P1 severity bugs within 1 hour", not generic statements.

4. RISKS — identify REAL technology, operational, and legal risks (aim for 4-6 items):
   Analyze: uncapped data breach liabilities, missing source code escrow, lack of CERT-In/DPDP compliance, ambiguous uptime calculation, one-sided termination, or loss of software IP rights.
   Cite specific clauses or their absence as the source of risk.

5. COMPLIANCE — detailed IT legal compliance analysis:
   - How does this document align with Indian IT Act 2000/2008 (Sec 43A, 72A, 79)?
   - DPDP Act 2023 compliance (Data Fiduciary / Data Processor terms, consent, breach reporting)?
   - CERT-In Cyber Security Directions (6-hour breach reporting, 180-day log retention)?
   - Intellectual Property & Copyright Act 1957 (software work-for-hire assignment)?
   - Companies Act 2013 IT governance & internal financial controls?
   - Are any clauses void or unenforceable (e.g., Sec 27 post-employment non-compete for tech engineers)?
"""
    else:
        task_block = """
TASK — DOCUMENT ANALYSIS (IT CONTEXT):

Analyze this document for Information Technology department relevance, commitments, and legal aspects:

1. SUMMARY (minimum 80 words):
   - What is this document?
   - How does it relate to the IT Department, software development, or corporate tech operations?
   - Parties, technical scope, and core takeaway.

2. CLAUSES — list any terms, conditions, or IT commitments. If none, write: []
3. OBLIGATIONS — duties or action items mentioned for tech personnel or vendors. If none, write: []
4. RISKS — practical, cyber, or legal concerns with this document. If none, write: []
5. COMPLIANCE — relevant Indian IT laws (IT Act, DPDP, CERT-In, Copyright) if applicable.
"""

    return f"""You are the Principal Corporate Legal Counsel and Head of IT Legal Affairs for enterprise technology corporations, with 20+ years of corporate experience advising IT Departments, Chief Information Officers (CIOs), Chief Information Security Officers (CISOs), General Counsels, and Software Enterprise Executives.

You possess authoritative legal expertise in Indian and International Corporate Laws governing Information Technology:
- Information Technology Act, 2000 (with 2008 Amendments): Electronic contracts (Sec 10A), sensitive data protection & compensation (Sec 43A), cyber offences & hacking (Sec 65, 66), breach of confidentiality (Sec 72A), and intermediary safe harbor liability (Sec 79).
- Digital Personal Data Protection Act, 2023 (DPDP Act) & GDPR alignment: Data Fiduciary and Data Processor duties, consent managers, employee tech monitoring, cross-border data transfer restrictions, and mandatory data breach notifications to the Data Protection Board.
- CERT-In Cyber Security Directions (2022/current): Mandatory 6-hour cyber incident reporting, 180-day system logs retention within Indian jurisdiction, and NTP server time synchronization for all tech infrastructure.
- Indian Contract Act, 1872 applied to IT: Master Services Agreements (MSA), Statements of Work (SOW), SaaS agreements, Service Level Agreements (SLA uptime, latency, service credits), IP indemnification, limitation of liability & data loss caps, and Section 27 non-compete enforceability for tech employees.
- Software Intellectual Property & Trade Secrets: Copyright Act 1957 (software code as literary work Sec 2(o), work-for-hire Sec 17), Patents Act 1970 (Sec 3(k) computer-related inventions), Open Source Software (OSS) licenses (GPL copyleft contamination vs Apache/MIT permissive), Source Code Escrow, and proprietary algorithms.
- Companies Act, 2013 for Tech Operations: Board of Directors oversight on cybersecurity and IT internal controls (Sec 134), Audit Committee supervision of cyber risk and tech audits (Sec 177), and Related Party Transactions in IT procurement and outsourcing (Sec 188).

You analyze IT agreements and technology documents with rigorous legal precision, zero hallucinations, and clear practical business recommendations for IT operations.

{INDIAN_LAW_CONTEXT}

{'=' * 60}
RETRIEVED STATUTORY CONTEXT:
{law_context or "(Knowledge base not available — rely on embedded IT law context above)"}

{'=' * 60}
DOCUMENT TO ANALYZE (full text excerpt):
{local_context or doc_full[:2500]}

{'=' * 60}
{clause_instruction}

{'=' * 60}
{task_block}

{'=' * 60}
OUTPUT RULES (NON-NEGOTIABLE):
1. Output ONLY a single valid JSON object — nothing before it, nothing after it
2. NO markdown code fences (no ```json)
3. NO <think> or reasoning tags
4. NO placeholder text like "..." or "[insert]"
5. Every field MUST be populated based on the actual document
6. If a field genuinely has no content, use [] for arrays or "" for strings
7. "summary" MUST be at least 100 words — short summaries are invalid
8. The JSON must start with {{ and end with }}

EXACT JSON SCHEMA TO FOLLOW:
{{
  "document_type": "<specific IT document type, e.g., 'Master Services Agreement (MSA)', 'SaaS & Cloud SLA Agreement', 'Software License & EULA', 'Data Processing Agreement (DPA)', 'IT Employee NDA & IP Assignment', 'Cloud Hosting Agreement', 'IT Procurement Contract'>",
  "summary": "<Detailed paragraph of minimum 100 words analyzing the IT contract, parties, technical deliverables, financial terms, SLA uptime, duration, and legal jurisdiction.>",
  "clauses": [
    "<Clause Name — specific description of how it appears in this exact document>",
    "<Clause Name — specific description>",
    "..."
  ],
  "obligations": [
    "<Party Name: specific IT/legal obligation with timeline/milestone>",
    "..."
  ],
  "risks": [
    "<Specific IT legal or operational risk description — cite the clause or its omission>",
    "..."
  ],
  "risk_score": <Integer from 0 to 100 representing the overall corporate legal and contractual risk severity of this document>,
  "critical_risks": "<Detailed paragraph explaining the highest corporate legal and contractual risks for IT stakeholders (e.g. employment bond lock-in & penalty enforceability under Indian Contract Act Sec 27, notice period restrictions, uncapped breach liability, missing source code escrow, SLA outage penalty gaps, DPDP non-compliance, software IP loss).>",
  "compliance": "<Detailed paragraph: compliance with Indian IT Act 2000, Indian Contract Act 1872, DPDP Act 2023, and Companies Act 2013 IT corporate governance requirements.>"
}}

OUTPUT ONLY THE JSON. START WITH {{ END WITH }}"""


def _parse_response(raw: str, doc_type: str) -> dict:
    if not raw:
        return _fallback("LLM returned empty response")

    try:
        return _validate(json.loads(raw), doc_type)
    except (json.JSONDecodeError, ValueError):
        pass

    match = re.search(r"\{[\s\S]+\}", raw)
    if match:
        try:
            return _validate(json.loads(match.group()), doc_type)
        except (json.JSONDecodeError, ValueError):
            pass

    cleaned = _repair_json(raw)
    if cleaned:
        try:
            return _validate(json.loads(cleaned), doc_type)
        except (json.JSONDecodeError, ValueError):
            pass

    logger.warning("[PARSE] All JSON parsing failed — using regex extraction")
    return _extract_from_text(raw, doc_type)


def _repair_json(raw: str) -> Optional[str]:
    try:
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        candidate = raw[start:end]
        candidate = re.sub(r",\s*([\}\]])", r"\1", candidate)
        candidate = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', candidate)
        candidate = candidate.replace("'", '"')
        return candidate
    except Exception:
        return None


def _validate(data: dict, doc_type: str) -> dict:
    def to_list(v, limit: int) -> list[str]:
        if isinstance(v, list):
            return [str(x).strip() for x in v[:limit] if str(x).strip()]
        if isinstance(v, str) and v.strip():
            return [v.strip()]
        return []

    summary = str(data.get("summary", "")).strip()
    if len(summary.split()) < 20:
        summary = (
            f"{summary} "
            f"This document has been evaluated for Information Technology corporate legal compliance, "
            f"service level commitments, data protection, and IT operational risk under Indian commercial laws."
        ).strip()

    return {
        "document_type": str(data.get("document_type", _infer_doc_type_label(doc_type))).strip()[:100],
        "summary":       summary[:2000],
        "clauses":       to_list(data.get("clauses"),     12),
        "obligations":   to_list(data.get("obligations"),  10),
        "risks":         to_list(data.get("risks"),        8),
        "risk_score":    int(''.join(filter(str.isdigit, str(data.get("risk_score", "0")))) or 0),
        "critical_risks": str(data.get("critical_risks", "")).strip()[:1000],
        "compliance":    str(data.get("compliance", "")).strip()[:1000],
    }


def _extract_from_text(text: str, doc_type: str) -> dict:
    def after(label: str, max_chars: int = 800) -> str:
        m = re.search(
            rf'{label}\s*[:\-]?\s*(.+?)(?=\n\s*(?:clauses|obligations|risks|compliance|document_type|summary)\s*[:\-]|\Z)',
            text, re.IGNORECASE | re.DOTALL
        )
        return m.group(1).strip()[:max_chars] if m else ""

    def bullet_list(label: str, limit: int = 10) -> list[str]:
        m = re.search(
            rf'{label}\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:clauses|obligations|risks|compliance|document_type|summary)\s*[:\-]|\Z)',
            text, re.IGNORECASE
        )
        if not m:
            return []
        block = m.group(1)
        items = re.findall(r'[-•*\d]+[.)]\s*(.+)', block)
        if not items:
            items = [line.strip() for line in block.split('\n') if line.strip() and len(line.strip()) > 10]
        return [i.strip() for i in items if i.strip()][:limit]

    return {
        "document_type": _infer_doc_type_label(doc_type),
        "summary":       after("summary", 1500) or text[:500],
        "clauses":       bullet_list("clauses", 10),
        "obligations":   bullet_list("obligations", 8),
        "risks":         bullet_list("risks", 6),
        "risk_score":    35,
        "critical_risks": after("critical_risks", 800),
        "compliance":    after("compliance", 800),
    }


def _infer_doc_type_label(doc_type: str) -> str:
    mapping = {
        "corporate_legal": "IT Master Services Agreement / Contract",
        "general_legal":   "IT Service & Compliance Document",
        "non_legal":       "General IT Document",
    }
    return mapping.get(doc_type, "IT Corporate Document")


def _fallback(reason: str) -> dict:
    return {
        "document_type": "IT Corporate Document",
        "summary":       f"IT Legal Analysis could not be completed: {reason}",
        "clauses":       [],
        "obligations":   [],
        "risks":         [],
        "risk_score":    0,
        "critical_risks": "",
        "compliance":    "",
        "error":         reason,
    }
