+++
schema_version = 1
id = "01M2XHZ9D97TGS65QMMQZDW9FE"
title = "Use Jev for useful bounded judgments"
date = "2026-09-19"
status = "accepted"
tags = ["ai"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I will use the existing Jev session as a quick advisory oracle when a semantic evaluation can inform the next step.
* **Context**: Niklas requested broader use beyond fact and decision capture. Known-option choices, relevance/support judgments, and rubric-based assessments fit the typed interface.
* **Consequences**: The shared `jev-oracle` skill and routing template make this discoverable across providers. The hub adds a general ask command to the existing credential session. Uncertainty handling is task-specific; the capture threshold is not universal, and model output grants no authority. Direct checks remain preferable where they settle the question.
Date: 2026-09-19 (derived from the commit that introduced this entry; the source record carried no date).
