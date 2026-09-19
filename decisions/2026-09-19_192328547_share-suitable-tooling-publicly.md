+++
schema_version = 1
id = "01M2XHZ9D3639Z0XGRGH8BBY1Q"
title = "Share suitable tooling publicly"
date = "2026-09-19"
status = "accepted"
tags = ["tooling"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: New shareable projects, especially tooling, should default to public when repository publication is authorized; projects containing secrets or private personal information should remain private.
* **Context**: On 2026-09-19, Niklas rejected the previous private-by-default choice for Latchrun and asked to share useful tooling with everyone, with an appropriate license.
* **Consequences**: The shared Git preferences and hub repository-creation skill now require a content/history review before public publication. Existing repositories are not made public automatically. License selection follows each project's requirements and authorization; the choice for Latchrun is MIT.
Date: 2026-09-19 (derived from the commit that introduced this entry; the source record carried no date).
