# { "Depends": "py-genlayer:1jb45aa8" }

from genlayer import *
from dataclasses import dataclass


@allow_storage
@dataclass
class Submission:
    recipient: str
    url: str
    status: str  # "pending", "verified", "rejected"
    reason: str
    submitted_at: str


@allow_storage
@dataclass
class Campaign:
    id: str
    creator: str
    rules: str
    max_per_recipient: str
    duration_days: int
    required_deliverables: str
    recipients: str  # comma-separated addresses
    status: str  # "active", "paused", "completed"
    created_at: str


class EcosystemFundGovernance(gl.Contract):
    campaigns: TreeMap[str, Campaign]
    submissions: TreeMap[str, Submission]  # key: "{campaignId}:{recipient}"

    # ──────────────────────────────────────────────
    # Campaign management
    # ──────────────────────────────────────────────

    @gl.public.write
    def create_campaign(
        self,
        campaign_id: str,
        rules: str,
        max_per_recipient: str,
        duration_days: int,
        required_deliverables: str,
        recipients: str,
    ) -> str:
        if campaign_id in self.campaigns:
            raise gl.vm.UserError("Campaign already exists")

        self.campaigns[campaign_id] = Campaign(
            id=campaign_id,
            creator=str(gl.message.sender_address),
            rules=rules,
            max_per_recipient=max_per_recipient,
            duration_days=duration_days,
            required_deliverables=required_deliverables,
            recipients=recipients,
            status="active",
            submitted_at=str(gl.message_raw["datetime"]),
        )
        return "Campaign created"

    @gl.public.write
    def pause_campaign(self, campaign_id: str) -> str:
        campaign = self.campaigns.get(campaign_id)
        if not campaign:
            raise gl.vm.UserError("Campaign not found")
        if str(gl.message.sender_address) != campaign.creator:
            raise gl.vm.UserError("Only creator can pause")
        campaign.status = "paused"
        return "Campaign paused"

    # ──────────────────────────────────────────────
    # Evidence submission
    # ──────────────────────────────────────────────

    @gl.public.write
    def submit_evidence(self, campaign_id: str, recipient: str, url: str) -> str:
        campaign = self.campaigns.get(campaign_id)
        if not campaign:
            raise gl.vm.UserError("Campaign not found")
        if campaign.status != "active":
            raise gl.vm.UserError("Campaign is not active")

        key = campaign_id + ":" + recipient.lower()

        if key in self.submissions:
            raise gl.vm.UserError("Evidence already submitted for this recipient")

        self.submissions[key] = Submission(
            recipient=recipient,
            url=url,
            status="pending",
            reason="",
            submitted_at=str(gl.message_raw["datetime"]),
        )
        return "Evidence submitted"

    # ──────────────────────────────────────────────
    # Verification (AI consensus)
    # ──────────────────────────────────────────────

    @gl.public.write
    def verify(self, campaign_id: str, recipient: str) -> str:
        campaign = self.campaigns.get(campaign_id)
        if not campaign:
            raise gl.vm.UserError("Campaign not found")

        key = campaign_id + ":" + recipient.lower()
        submission = self.submissions.get(key)
        if not submission:
            raise gl.vm.UserError("Submission not found")
        if submission.status != "pending":
            raise gl.vm.UserError("Already verified")

        url = submission.url
        rules = campaign.rules
        deliverables = campaign.required_deliverables

        def nd():
            # Fetch the URL content
            try:
                response = gl.nondet.web.get(url)
                status = response.status
                body = response.body
                # Truncate to avoid huge prompts
                if len(body) > 8000:
                    body = body[:8000]
            except Exception:
                return {
                    "verified": False,
                    "reason": "Could not fetch the submitted URL",
                }

            if status != 200:
                return {
                    "verified": False,
                    "reason": "URL returned status " + str(status),
                }

            result = gl.nondet.exec_prompt(
                "You are a deliverable verification agent.\n"
                + "A creator submitted evidence for a campaign.\n\n"
                + "CAMPAIGN RULES:\n"
                + rules
                + "\n\nREQUIRED DELIVERABLES:\n"
                + deliverables
                + "\n\nSUBMITTED URL:\n"
                + url
                + "\n\nPAGE CONTENT (truncated):\n"
                + body
                + "\n\nEvaluate whether the submitted content satisfies the campaign requirements.\n"
                + 'Return JSON: {"verified": true/false, "reason": "brief explanation"}\n'
                + "Be strict — only verify if the content clearly meets the requirements.",
            )

            # Parse result
            text = str(result).strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                text = text.replace("```json", "").replace("```", "").strip()

            import json

            try:
                parsed = json.loads(text)
                verified = bool(parsed.get("verified", False))
                reason = str(parsed.get("reason", "No reason provided"))
            except Exception:
                verified = False
                reason = "Could not parse verification result"

            return {"verified": verified, "reason": reason}

        verdict = gl.eq_principle.prompt_comparative(
            nd, principle="The verification verdict (verified true/false) must match"
        )

        verified = bool(verdict.get("verified", False))
        reason = str(verdict.get("reason", ""))

        submission.status = "verified" if verified else "rejected"
        submission.reason = reason

        return "Verified: " + submission.status

    # ──────────────────────────────────────────────
    # Payment authorization (called by Spending Contract)
    # ──────────────────────────────────────────────

    @gl.public.view
    def is_payment_allowed(
        self, campaign_id: str, recipient: str
    ) -> dict:
        campaign = self.campaigns.get(campaign_id)
        if not campaign:
            return {"allowed": False, "reason": "Campaign not found"}
        if campaign.status != "active":
            return {"allowed": False, "reason": "Campaign is not active"}

        key = campaign_id + ":" + recipient.lower()
        submission = self.submissions.get(key)
        if not submission:
            return {"allowed": False, "reason": "No submission found"}
        if submission.status == "pending":
            return {"allowed": False, "reason": "Not yet verified"}
        if submission.status == "rejected":
            return {"allowed": False, "reason": "Verification rejected: " + submission.reason}

        return {"allowed": True, "reason": "Verified: " + submission.reason}

    # ──────────────────────────────────────────────
    # Views
    # ──────────────────────────────────────────────

    @gl.public.view
    def get_campaign(self, campaign_id: str) -> dict:
        c = self.campaigns.get(campaign_id)
        if not c:
            return {}
        return {
            "id": c.id,
            "creator": c.creator,
            "rules": c.rules,
            "max_per_recipient": c.max_per_recipient,
            "duration_days": c.duration_days,
            "required_deliverables": c.required_deliverables,
            "recipients": c.recipients,
            "status": c.status,
            "created_at": c.created_at,
        }

    @gl.public.view
    def get_submission(self, campaign_id: str, recipient: str) -> dict:
        key = campaign_id + ":" + recipient.lower()
        s = self.submissions.get(key)
        if not s:
            return {}
        return {
            "recipient": s.recipient,
            "url": s.url,
            "status": s.status,
            "reason": s.reason,
            "submitted_at": s.submitted_at,
        }

    @gl.public.view
    def get_campaign_submissions(self, campaign_id: str) -> list:
        results = []
        prefix = campaign_id + ":"
        # Scan all submissions for this campaign
        all_keys = self.submissions.keys()
        for key in all_keys:
            if key.startswith(prefix):
                s = self.submissions[key]
                results.append(
                    {
                        "key": key,
                        "recipient": s.recipient,
                        "url": s.url,
                        "status": s.status,
                        "reason": s.reason,
                    }
                )
        return results

    @gl.public.view
    def get_all_campaigns(self) -> list:
        results = []
        for key in self.campaigns.keys():
            c = self.campaigns[key]
            results.append({
                "id": c.id,
                "creator": c.creator,
                "rules": c.rules,
                "max_per_recipient": c.max_per_recipient,
                "duration_days": c.duration_days,
                "required_deliverables": c.required_deliverables,
                "recipients": c.recipients,
                "status": c.status,
                "created_at": c.created_at,
            })
        return results

    @gl.public.view
    def get_count(self) -> dict:
        return {
            "campaigns": len(list(self.campaigns.keys())),
            "submissions": len(list(self.submissions.keys())),
        }
