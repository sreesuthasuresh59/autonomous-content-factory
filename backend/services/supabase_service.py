# backend/services/supabase_service.py
from supabase import create_client, Client
from config import Config

# Initialize Supabase client
supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# ─── Campaign Operations ───────────────────────────────────────────

def create_campaign(user_id: str, title: str, input_type: str,
                    source_content: str, source_name: str = "") -> dict:
    """Create a new campaign record in the database"""
    response = supabase.table("campaigns").insert({
        "user_id": user_id,
        "title": title,
        "input_type": input_type,
        "source_content": source_content,
        "source_name": source_name,
        "status": "pending"
    }).execute()
    return response.data[0] if response.data else None


def get_campaign(campaign_id: str) -> dict:
    """Fetch a single campaign by ID"""
    response = supabase.table("campaigns")\
        .select("*")\
        .eq("id", campaign_id)\
        .single()\
        .execute()
    return response.data


def update_campaign_status(campaign_id: str, status: str) -> dict:
    """Update campaign processing status"""
    response = supabase.table("campaigns")\
        .update({"status": status})\
        .eq("id", campaign_id)\
        .execute()
    return response.data


def get_user_campaigns(user_id: str) -> list:
    """Get all campaigns for a user"""
    response = supabase.table("campaigns")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()
    return response.data

# ─── Fact Sheet Operations ─────────────────────────────────────────

def save_fact_sheet(campaign_id: str, content: dict) -> dict:
    """Save Agent 1 fact-sheet output"""
    response = supabase.table("fact_sheets").insert({
        "campaign_id": campaign_id,
        "content": content
    }).execute()
    return response.data[0] if response.data else None


def get_fact_sheet(campaign_id: str) -> dict:
    """Retrieve fact-sheet for a campaign"""
    response = supabase.table("fact_sheets")\
        .select("*")\
        .eq("campaign_id", campaign_id)\
        .single()\
        .execute()
    return response.data

# ─── Generated Content Operations ─────────────────────────────────

def save_generated_content(campaign_id: str, blog: str,
                            social: str, email: str, version: int = 1) -> dict:
    """Save Agent 2 copywriter output"""
    response = supabase.table("generated_content").insert({
        "campaign_id": campaign_id,
        "blog_post": blog,
        "social_thread": social,
        "email_teaser": email,
        "version": version
    }).execute()
    return response.data[0] if response.data else None


def get_generated_content(campaign_id: str) -> dict:
    """Get latest generated content for a campaign"""
    response = supabase.table("generated_content")\
        .select("*")\
        .eq("campaign_id", campaign_id)\
        .order("version", desc=True)\
        .limit(1)\
        .execute()
    return response.data[0] if response.data else None

# ─── Editor Feedback Operations ───────────────────────────────────

def save_editor_feedback(campaign_id: str, feedback: dict) -> dict:
    """Save Agent 3 editor feedback"""
    response = supabase.table("editor_feedback").insert({
        "campaign_id": campaign_id,
        **feedback
    }).execute()
    return response.data[0] if response.data else None


def get_editor_feedback(campaign_id: str) -> dict:
    """Get editor feedback for a campaign"""
    response = supabase.table("editor_feedback")\
        .select("*")\
        .eq("campaign_id", campaign_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
    return response.data[0] if response.data else None