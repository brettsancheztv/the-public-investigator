#!/usr/bin/env python3
"""
The Public Investigator - Lead Scraper
=======================================
Finds weird / peculiar / high-engagement stories across the Gulf South and
(when database credentials are present) saves them to your Supabase 'leads' table.

HOW TO RUN A PREVIEW (no credentials, nothing saved, totally safe):
    pip install feedparser requests
    python scraper.py

In preview mode it just PRINTS what it found so you can judge the quality.
Later, GitHub Actions runs this exact same file WITH credentials twice a day,
and then it writes the finds straight into your database.

You can freely edit the three lists in sections 1 and 2 below.
"""

import os
import re
import json
import html
import time
import calendar
import urllib.parse
from datetime import datetime, timedelta, timezone

import feedparser
import requests

# ----------------------------------------------------------------------
# 1) WHAT TO LOOK FOR   (edit freely)
# ----------------------------------------------------------------------

# "Weird" words. The news search looks for these paired with the places below.
WEIRD_TERMS = [
    "weird", "bizarre", "strange", "unusual", "odd", "mysterious",
    "caught on camera", "viral", "unexplained", "you won't believe",
]

# Gulf South places (LA, MS, AL, Gulf FL, TX coast).
GULF_PLACES = [
    "Louisiana", "Mississippi", "Alabama", "Gulf Coast",
    "New Orleans", "Baton Rouge", "Lafayette", "Shreveport",
    "Biloxi", "Gulfport", "Mobile Alabama",
    "Pensacola", "Panama City", "Galveston", "Houston", "Corpus Christi",
]

# LOCAL Gulf South subreddits - pulled in full (this is the "mostly local" part).
LOCAL_SUBS = [
    "NewOrleans", "Louisiana", "BatonRouge", "mississippi",
    "Alabama", "mobileal", "Pensacola", "houston",
]

# NATIONAL weird subreddits - only a few of each kept, just for flavor.
NATIONAL_WEIRD_SUBS = [
    "nottheonion", "FloridaMan", "offbeat",
]

# ----------------------------------------------------------------------
# 2) FILTERS   (edit these freely)
# ----------------------------------------------------------------------

# Drop anything containing these. Matches word-STARTS, so "shoot" also
# blocks "shooting"/"shootings", and "injur" blocks "injured"/"injury".
BLOCK_WORDS = [
    # violent / serious crime
    "murder", "homicide", "shoot", "shot", "gun", "kill", "stab", "rape",
    "assault", "kidnap", "abduct", "traffick", "molest", "child abuse",
    "overdose", "suicide", "terror", "fatal", "manslaughter",
    "injur", "critically", "wounded",
    # heavy / serious news
    "immigration", "crisis", "lawsuit", "attorney", "berating", "indicted",
    # mundane everyday-life chatter (mostly from Reddit)
    "surgery", "insurance", "fb group", "buy nothing", "roommate",
    "apartment", "tutor", "hiring", "for rent", "lease",
    # missing-person / police appeals
    "missing for", "contact police", "police dept", "please contact",
]

# A Reddit post is only KEPT if its title hints at something interesting.
# Also matches word-starts ("myster" covers "mystery"/"mysterious").
KEEP_SIGNALS = [
    "weird", "bizarre", "strange", "unusual", "myster", "puzzl",
    "eccentric", "hilarious", "funny", "viral", "caught on camera",
    "caught on video", "spotted", "wtf", "what is this", "what is that",
    "reward", "prank", "you won't believe", "video gold", "goes viral",
    "creepy", "haunted", "ghost", "ufo", "conspiracy", "found this",
    "anyone know", "why is there", "why are there", "wild video",
]

# ----------------------------------------------------------------------
# 3) SETTINGS
# ----------------------------------------------------------------------
USER_AGENT = "ThePublicInvestigator/1.0 (lead scraper; admin@thepublicinvestigator.com)"
MAX_PER_FEED = 25       # how many to take from each LOCAL subreddit
NATIONAL_CAP = 3        # how many to take from each NATIONAL weird subreddit
NEWS_PER_PLACE = 8      # how many news stories to take per Gulf South place
MAX_AGE_HOURS = 48      # ignore anything older than this many hours
KEEP_HOURS = 72         # auto-delete unkept leads older than this many hours

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# ----------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------
_block_re = re.compile(r"\b(" + "|".join(re.escape(w) for w in BLOCK_WORDS) + r")", re.I)
_signal_re = re.compile(r"\b(" + "|".join(re.escape(w) for w in KEEP_SIGNALS) + r")", re.I)


def is_blocked(text):
    return bool(_block_re.search(text or ""))


def has_signal(text):
    return bool(_signal_re.search(text or ""))


def clean(text):
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)   # strip HTML tags
    text = html.unescape(text)             # turn &amp; into &, etc.
    return re.sub(r"\s+", " ", text).strip()


def to_iso(entry):
    t = entry.get("published_parsed") or entry.get("updated_parsed")
    if not t:
        return None
    try:
        return time.strftime("%Y-%m-%dT%H:%M:%SZ", t)
    except Exception:
        return None


def too_old(entry):
    t = entry.get("published_parsed") or entry.get("updated_parsed")
    if not t:
        return False  # no date -> keep it
    age_hours = (time.time() - calendar.timegm(t)) / 3600
    return age_hours > MAX_AGE_HOURS


def google_news_url(query):
    q = urllib.parse.quote(query)
    return f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"


def fetch(url):
    return feedparser.parse(url, agent=USER_AGENT)


def add_lead(bucket, *, source, source_type, entry, require_signal=False):
    title = clean(entry.get("title"))
    url = entry.get("link")
    summary = clean(entry.get("summary"))
    if not title or not url:
        return
    if too_old(entry):
        return
    if is_blocked(title + " " + summary):
        return
    if require_signal and not has_signal(title + " " + summary):
        return
    bucket[url] = {
        "source": source,
        "source_type": source_type,
        "title": title[:500],
        "url": url,
        "summary": summary[:1000],
        "published_at": to_iso(entry),
        "score": None,
        "status": "new",
    }


# ----------------------------------------------------------------------
# gather leads from all sources
# ----------------------------------------------------------------------
def gather():
    leads = {}

    # --- LOCAL #1: Google News, a precise query PER place (place must appear) ---
    weird = " OR ".join(f'"{w}"' if " " in w else w for w in WEIRD_TERMS)
    for place in GULF_PLACES:
        query = f'"{place}" ({weird})'
        feed = fetch(google_news_url(query))
        for e in feed.entries[:NEWS_PER_PLACE]:
            src = "Google News"
            try:
                if e.get("source") and e.source.get("title"):
                    src = e.source.title
            except Exception:
                pass
            add_lead(leads, source=src, source_type="news", entry=e)

    # --- LOCAL #2: Reddit Gulf South subreddits, in full ---
    for sub in LOCAL_SUBS:
        feed = fetch(f"https://www.reddit.com/r/{sub}/top/.rss?t=day")
        for e in feed.entries[:MAX_PER_FEED]:
            add_lead(leads, source="r/" + sub, source_type="reddit", entry=e, require_signal=True)

    # --- NATIONAL weird: hard-capped at ~10% of the local haul ---
    local_count = len(leads)
    national_allowed = local_count // 9   # keeps national at/below 10% of the total
    national_added = 0
    for sub in NATIONAL_WEIRD_SUBS:
        if national_added >= national_allowed:
            break
        feed = fetch(f"https://www.reddit.com/r/{sub}/top/.rss?t=day")
        for e in feed.entries[:NATIONAL_CAP]:
            if national_added >= national_allowed:
                break
            before = len(leads)
            add_lead(leads, source="r/" + sub, source_type="national", entry=e)
            if len(leads) > before:
                national_added += 1

    return list(leads.values())


# ----------------------------------------------------------------------
# save (when credentials exist) or preview (when they don't)
# ----------------------------------------------------------------------
def save_to_supabase(rows):
    endpoint = f"{SUPABASE_URL}/rest/v1/leads?on_conflict=url"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
    }
    r = requests.post(endpoint, headers=headers, data=json.dumps(rows), timeout=60)
    if r.status_code in (200, 201, 204):
        print(f"Done. Sent {len(rows)} leads to Supabase (duplicates skipped automatically).")
    else:
        print("Supabase error:", r.status_code, r.text[:500])


def cleanup_old_leads():
    """Delete leads older than KEEP_HOURS that you never marked 'Keep'."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=KEEP_HOURS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    endpoint = f"{SUPABASE_URL}/rest/v1/leads?kept=eq.false&created_at=lt.{cutoff}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=minimal",
    }
    try:
        r = requests.delete(endpoint, headers=headers, timeout=60)
        if r.status_code in (200, 204):
            print(f"Cleaned out unkept leads older than {KEEP_HOURS} hours.")
        else:
            print("Cleanup note:", r.status_code, r.text[:200])
    except Exception as e:
        print("Cleanup skipped:", e)


def preview(rows):
    total = len(rows)
    national = sum(1 for r in rows if r["source_type"] == "national")
    local = total - national
    pct_local = round(100 * local / total) if total else 0
    print(f"\n=== PREVIEW: {total} leads found (nothing was saved) ===")
    print(f"    Local Gulf South: {local} ({pct_local}%)   |   National: {national} ({100 - pct_local if total else 0}%)\n")
    for i, row in enumerate(rows, 1):
        print(f"{i:>3}. [{row['source']}] {row['title']}")
        print(f"     {row['url']}\n")
    print("(Looks good? Next we connect GitHub Actions so this runs and saves twice a day.)")


def main():
    print("Searching the Gulf South for weird stories...")
    rows = gather()
    if not rows:
        print("No leads found this run (or the feeds couldn't be reached).")
        return
    if SUPABASE_URL and SUPABASE_KEY:
        save_to_supabase(rows)
        cleanup_old_leads()
    else:
        preview(rows)


if __name__ == "__main__":
    main()
