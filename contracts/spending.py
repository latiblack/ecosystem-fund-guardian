# { "Depends": "py-genlayer:1jb45aa8" }

from genlayer import *
from dataclasses import dataclass


@allow_storage
@dataclass
class CampaignFunds:
    token: str  # token address (empty = native)
    deposited: int
    spent: int
    max_per_recipient: int


class EcosystemFundSpending(gl.Contract):
    governance_address: str
    campaign_funds: TreeMap[str, CampaignFunds]
    payments: TreeMap[str, str]  # "{campaignId}:{recipient}" -> "paid"

    # ──────────────────────────────────────────────
    # Setup
    # ──────────────────────────────────────────────

    @gl.public.write
    def set_governance(self, governance_address: str) -> str:
        """Set the governance contract address (call once after deploy)"""
        self.governance_address = governance_address
        return "Governance address set"

    # ──────────────────────────────────────────────
    # Funding
    # ──────────────────────────────────────────────

    @gl.public.write
    def fund(self, campaign_id: str, token: str, amount: int) -> str:
        """Record a campaign deposit. Backend handles actual token transfer."""
        if campaign_id in self.campaign_funds:
            cf = self.campaign_funds[campaign_id]
            cf.deposited += amount
        else:
            self.campaign_funds[campaign_id] = CampaignFunds(
                token=token,
                deposited=amount,
                spent=0,
                max_per_recipient=0,
            )
        return "Funded: " + str(amount)

    @gl.public.write
    def set_max_per_recipient(self, campaign_id: str, max_amount: int) -> str:
        cf = self.campaign_funds.get(campaign_id)
        if not cf:
            raise gl.vm.UserError("Campaign not found")
        cf.max_per_recipient = max_amount
        return "Max per recipient set"

    # ──────────────────────────────────────────────
    # Payment (governed by Governance Contract)
    # ──────────────────────────────────────────────

    @gl.public.write
    def pay(self, campaign_id: str, recipient: str, amount: int) -> str:
        """
        Release payment to recipient.
        This contract CANNOT pay without Governance Contract approval.
        Backend must verify via Governance.isPaymentAllowed() before calling.
        The contract checks that the payment hasn't already been made.
        """
        cf = self.campaign_funds.get(campaign_id)
        if not cf:
            raise gl.vm.UserError("Campaign not found")

        key = campaign_id + ":" + recipient.lower()

        if key in self.payments:
            raise gl.vm.UserError("Already paid")

        if amount > cf.max_per_recipient:
            raise gl.vm.UserError("Amount exceeds max per recipient")

        remaining = cf.deposited - cf.spent
        if amount > remaining:
            raise gl.vm.UserError("Insufficient campaign balance")

        # Record payment
        self.payments[key] = "paid"
        cf.spent += amount

        # NOTE: Actual token transfer happens via backend signer
        # This contract tracks the payment record
        return "Paid: " + str(amount) + " to " + recipient

    # ──────────────────────────────────────────────
    # Views
    # ──────────────────────────────────────────────

    @gl.public.view
    def get_campaign_funds(self, campaign_id: str) -> dict:
        cf = self.campaign_funds.get(campaign_id)
        if not cf:
            return {}
        return {
            "token": cf.token,
            "deposited": cf.deposited,
            "spent": cf.spent,
            "remaining": cf.deposited - cf.spent,
            "max_per_recipient": cf.max_per_recipient,
        }

    @gl.public.view
    def is_paid(self, campaign_id: str, recipient: str) -> bool:
        key = campaign_id + ":" + recipient.lower()
        return key in self.payments

    @gl.public.view
    def get_payment(self, campaign_id: str, recipient: str) -> dict:
        key = campaign_id + ":" + recipient.lower()
        status = self.payments.get(key)
        if not status:
            return {"paid": False}
        return {"paid": True, "status": status}

    @gl.public.view
    def get_governance_address(self) -> str:
        return self.governance_address

    @gl.public.view
    def get_count(self) -> dict:
        return {
            "campaigns": len(list(self.campaign_funds.keys())),
            "payments": len(list(self.payments.keys())),
        }
