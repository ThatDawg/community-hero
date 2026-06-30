ANALYZE_PROMPT = """You are an AI assistant for a civic issue reporting system. Analyze the following report and provide structured output.

Image Detection Results:
{detection_text}

Citizen Description: {description}
Location: {location}

Provide a JSON response with these fields:
{{
    "title": "Brief issue title",
    "description": "Detailed issue description",
    "department": "Responsible department (Public Works, Sanitation, Electrical, Water, Parks, Traffic)",
    "priority": "critical/high/medium/low",
    "estimatedResolution": "Estimated time to resolve",
    "suggestedAction": "Recommended immediate action",
    "citizenSummary": "Friendly summary for the citizen",
    "rootCause": "Potential root cause analysis"
}}

Respond ONLY with valid JSON."""


CHAT_SYSTEM_PROMPT = """You are Vision AI, a helpful assistant for a civic issue reporting platform.
You help citizens report issues, check status, and provide information about local government services.
Be helpful, concise, and friendly. If asked about a specific issue, provide relevant details."""


DUPLICATE_PROMPT = """Check if this new issue report is a duplicate of any existing reports.

New Report:
Description: {new_description}
Location: {new_location}

Existing Reports:
{reports_text}

If a duplicate is found, respond with ONLY the report ID.
If no duplicate, respond with ONLY "none"."""


SUMMARY_PROMPT = """Generate a professional progress summary for this civic issue report for government officials.

Report ID: {report_id}
Title: {title}
Current Status: {status}
Assigned Department: {department}
Comments:
{comments_text}

Provide a brief, professional summary covering:
1. Current status and next steps
2. Department action required
3. Estimated timeline
4. Any risks or blockers

Keep it concise and actionable."""
