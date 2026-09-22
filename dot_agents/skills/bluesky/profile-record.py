#!/usr/bin/env python3
"""Edit Niklas's Bluesky profile record (app.bsky.actor.profile/self) safely.

Usage:
  profile-record.py show
  profile-record.py set <displayName|description> <value>
  profile-record.py set-blob <avatar|banner> <image-file>

Refreshes the bsky CLI session, merges into the existing record and writes with
swapRecord so a concurrent edit is rejected instead of overwritten. Prints the
resulting record with blob CIDs, never credentials.
"""
import json
import mimetypes
import os
import subprocess
import sys
import urllib.parse
import urllib.request

AUTH = os.path.expanduser("~/.config/bsky/nheer.bsky.social.auth")
BSKY = os.path.expanduser("~/go/bin/bsky")
PDS = "https://bsky.social/xrpc/"
COLLECTION = "app.bsky.actor.profile"


def session():
    subprocess.run([BSKY, "show-session"], check=True, capture_output=True)  # refreshes JWTs
    with open(AUTH, encoding="utf-8") as f:
        auth = json.load(f)
    return auth["accessJwt"], auth["did"]


def call(method, token, params=None, data=None, content_type="application/json"):
    url = PDS + method + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, data=data, headers={"Authorization": "Bearer " + token, "Content-Type": content_type})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"), strict=False)  # PDS may return raw newlines


def summary(rec):
    out = dict(rec)
    for key in ("avatar", "banner"):
        if key in out:
            out[key] = out[key]["ref"]["$link"]
    return out


def main(argv):
    if len(argv) < 2 or argv[1] not in {"show", "set", "set-blob"}:
        print(__doc__, file=sys.stderr)
        return 2
    token, did = session()
    cur = call("com.atproto.repo.getRecord", token, {"repo": did, "collection": COLLECTION, "rkey": "self"})
    rec = cur["value"]
    if argv[1] == "show":
        print(json.dumps(summary(rec), ensure_ascii=False, indent=2))
        return 0
    if argv[1] == "set":
        field, value = argv[2], argv[3]
        if field not in {"displayName", "description"}:
            print("set supports displayName or description", file=sys.stderr)
            return 2
        rec[field] = value
    else:
        field, path = argv[2], argv[3]
        if field not in {"avatar", "banner"}:
            print("set-blob supports avatar or banner", file=sys.stderr)
            return 2
        mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f:
            data = f.read()
        if len(data) > 1_000_000:
            print(f"{path} is {len(data)} bytes; Bluesky rejects image blobs over 1 MB", file=sys.stderr)
            return 1
        rec[field] = call("com.atproto.repo.uploadBlob", token, data=data, content_type=mime)["blob"]
    body = json.dumps({"repo": did, "collection": COLLECTION, "rkey": "self", "record": rec, "swapRecord": cur["cid"]}).encode("utf-8")
    res = call("com.atproto.repo.putRecord", token, data=body)
    print("updated", res["uri"])
    print(json.dumps(summary(rec), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
