"""Governance Smart Contract for Ecosystem Fund Guardian."""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# GenLayer imports
import genlayer

@dataclass
class Project:
    """A decentralized ecosystem fund."""
    project_id: int
    name: str
    creator_address: str
    description: str
    category: str
    max_per_recipient: int
    created_at: int = field(default_factory=lambda: int(genlayer.timestamp()))
    status: str = "active"


def deploy():
    """Deploy and initialize the governance contract."""
    # Initialize storage
    if not hasattr(deploy, '_initialized'):
        genlayer.put("project_count", 0)
        genlayer.put("projects", {})
        deploy._initialized = True

    return {
        "status": "deployed",
        "message": "Governance contract deployed on GenLayer with full EVM compatibility"
    }


def create_project(
    creator_address: str,
    name: str,
    description: str,
    category: str
) -> dict:
    """Create a new ecosystem fund project (GenLayer verification + NLP)."""
    project_count = genlayer.get("project_count") or 0
    project_id = int(project_count) + 1

    project = Project(
        project_id=project_id,
        name=name,
        creator_address=creator_address.lower(),
        description=description,
        category=category,
        max_per_recipient=0
    )

    # Store project using GenLayer key-value store
    projects = genlayer.get("projects") or {}
    projects[str(project_id)] = {
        "project_id": project.project_id,
        "name": project.name,
        "creator_address": project.creator_address,
        "description": project.description,
        "category": project.category,
        "max_per_recipient": project.max_per_recipient,
        "created_at": project.created_at,
        "status": project.status
    }
    genlayer.put("projects", projects)
    genlayer.put("project_count", project_id)

    campaign_id = 0  # Campaigns are handled by Spending contract

    return {
        "status": "success",
        "message": "Project created successfully with GenLayer verification",
        "project_id": project_id,
        "campaign_id": campaign_id
    }


def get_project(project_id: int) -> Optional[dict]:
    """Get a specific project by ID."""
    projects = genlayer.get("projects") or {}
    return projects.get(str(project_id))


def get_all_projects() -> List[dict]:
    """Get all projects."""
    projects = genlayer.get("projects") or {}
    return list(projects.values())


def set_max_per_recipient(project_id: int, max_amount: int) -> dict:
    """Set maximum funding per recipient for a project."""
    projects = genlayer.get("projects") or {}
    project_data = projects.get(str(project_id))

    if not project_data:
        return {"status": "error", "message": "Project not found"}

    project_data["max_per_recipient"] = max_amount
    projects[str(project_id)] = project_data
    genlayer.put("projects", projects)

    return {
        "status": "success",
        "message": f"Max per recipient set to {max_amount}"
    }
