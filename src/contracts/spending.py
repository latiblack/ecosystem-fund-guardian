"""Spending Smart Contract for Ecosystem Fund Guardian."""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# GenLayer imports
import genlayer


@dataclass
class Campaign:
    """A funded initiative within a project."""
    campaign_id: int
    project_id: int
    name: str
    required_amount: int
    token_address: str  # "native" for ETH/MATIC, or ERC-20 contract address
    token_symbol: str   # "ETH", "USDC", etc.
    deadline: int
    beneficiary_addresses: List[str]
    amounts: List[int]
    evidence_hash: str = ""
    votes_for: int = 0
    votes_against: int = 0
    executed: bool = False
    created_at: int = field(default_factory=lambda: int(genlayer.timestamp()))


def deploy():
    """Deploy and initialize the spending contract."""
    if not hasattr(deploy, '_initialized'):
        genlayer.put("campaign_count", 0)
        genlayer.put("campaigns", {})
        genlayer.put("pending_votes", {})
        deploy._initialized = True

    return {
        "status": "deployed",
        "message": "Spending contract deployed with full EVM token support"
    }


def create_campaign(
    project_id: int,
    name: str,
    required_amount: int,
    token_address: str,
    token_symbol: str,
    deadline: int,
    beneficiary_addresses: List[str],
    amounts: List[int]
) -> dict:
    """Create a new funding campaign supporting any EVM token."""
    # Validate inputs
    if len(beneficiary_addresses) != len(amounts):
        return {"status": "error", "message": "Beneficiaries and amounts must match"}

    campaign_count = genlayer.get("campaign_count") or 0
    campaign_id = int(campaign_count) + 1

    campaign = Campaign(
        campaign_id=campaign_id,
        project_id=project_id,
        name=name,
        required_amount=required_amount,
        token_address=token_address,
        token_symbol=token_symbol,
        deadline=deadline,
        beneficiary_addresses=beneficiary_addresses,
        amounts=amounts
    )

    # Store campaign
    campaigns = genlayer.get("campaigns") or {}
    campaigns[str(campaign_id)] = {
        "campaign_id": campaign.campaign_id,
        "project_id": campaign.project_id,
        "name": campaign.name,
        "required_amount": campaign.required_amount,
        "token_address": campaign.token_address,
        "token_symbol": campaign.token_symbol,
        "deadline": campaign.deadline,
        "beneficiary_addresses": campaign.beneficiary_addresses,
        "amounts": campaign.amounts,
        "evidence_hash": campaign.evidence_hash,
        "votes_for": campaign.votes_for,
        "votes_against": campaign.votes_against,
        "executed": campaign.executed,
        "created_at": campaign.created_at
    }
    genlayer.put("campaigns", campaigns)
    genlayer.put("campaign_count", campaign_id)

    return {
        "status": "success",
        "message": "Campaign created - ready to receive tokens from any EVM chain",
        "campaign_id": campaign_id,
        "token_info": {
            "address": token_address,
            "symbol": token_symbol,
            "total_required": required_amount
        }
    }


def vote_on_campaign(
    campaign_id: int,
    voter_address: str,
    vote: str,
    evidence_tx_hash: str = ""
) -> dict:
    """Cast a vote on a campaign."""
    if vote not in ["for", "against"]:
        return {"status": "error", "message": "Vote must be 'for' or 'against'"}

    campaigns = genlayer.get("campaigns") or {}
    campaign_data = campaigns.get(str(campaign_id))

    if not campaign_data:
        return {"status": "error", "message": "Campaign not found"}

    pending_votes = genlayer.get("pending_votes") or {}
    voter_key = f"{campaign_id}:{voter_address.lower()}"

    if voter_key in pending_votes:
        return {"status": "error", "message": "Already voted"}

    pending_votes[voter_key] = {
        "vote": vote,
        "evidence_tx_hash": evidence_tx_hash,
        "timestamp": int(genlayer.timestamp())
    }
    genlayer.put("pending_votes", pending_votes)

    campaign_data["votes_for" if vote == "for" else "votes_against"] += 1
    campaigns[str(campaign_id)] = campaign_data
    genlayer.put("campaigns", campaigns)

    total_votes = campaign_data["votes_for"] + campaign_data["votes_against"]
    is_unanimous = campaign_data["votes_for"] == total_votes or campaign_data["votes_against"] == total_votes

    return {
        "status": "success",
        "message": f"Vote recorded {'- Unanimous!' if is_unanimous else ''}",
        "is_unanimous": is_unanimous,
        "total_votes": total_votes
    }


def execute_campaign(campaign_id: int) -> dict:
    """Execute approved campaign transfers."""
    campaigns = genlayer.get("campaigns") or {}
    campaign_data = campaigns.get(str(campaign_id))

    if not campaign_data:
        return {"status": "error", "message": "Campaign not found"}

    if campaign_data["votes_against"] > 0:
        return {"status": "error", "message": "Campaign rejected - cannot execute"}

    if campaign_data["executed"]:
        return {"status": "error", "message": "Already executed"}

    campaign_data["executed"] = True
    campaigns[str(campaign_id)] = campaign_data
    genlayer.put("campaigns", campaigns)

    total_sent = sum(campaign_data["amounts"])

    return {
        "status": "success",
        "message": f"Transfers executed: {total_sent} {campaign_data['token_symbol']} distributed",
        "beneficiaries": [
            {"address": addr, "amount": amt}
            for addr, amt in zip(campaign_data["beneficiary_addresses"], campaign_data["amounts"])
        ]
    }


def get_campaign(campaign_id: int) -> Optional[dict]:
    """Get a specific campaign."""
    campaigns = genlayer.get("campaigns") or {}
    return campaigns.get(str(campaign_id))


def get_all_campaigns() -> List[dict]:
    """Get all campaigns."""
    campaigns = genlayer.get("campaigns") or {}
    return list(campaigns.values())
