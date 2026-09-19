# Deterministic simulation testing

Niklas values simulation testing when it can quickly expose bugs that would otherwise require substantial real usage. His examples of 100 or 2,000+ simulated hours express the goal of accelerated exploration, not a mandatory duration or proof of equivalent production experience.

- Use it when a meaningful state or workload model exists: action sequences, persistence, failure/recovery, time-dependent behavior, concurrency, or distributed interactions. Do not build a simulation framework for a trivial tool without a useful failure model.
- Make randomness reproducible with recorded seeds. Control time and relevant scheduling or external effects so failures can be replayed without wall-clock sleeps.
- Generate representative sequences and inject relevant faults. Check invariants or compare against a simpler reference model after transitions; aim to exercise production logic rather than a disconnected reimplementation.
- Retain the seed and failing action trace, minimize failures where practical, and turn discovered bugs into regression cases.
- Keep a small deterministic set in the fast feedback loop and use larger runs when the expected confidence justifies the cost. Choose the budget for the project rather than always running thousands of simulated hours.
- Report seeds, operations, workloads, faults, simulated time when meaningful, and actual runtime. Simulation complements real end-to-end checks; it does not establish reliability outside the modeled behaviors.
