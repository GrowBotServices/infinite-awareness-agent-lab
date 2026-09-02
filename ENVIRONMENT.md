# Environment Configuration

This static judge sandbox requires **no environment variables and no secrets**. The repository includes a comment-only `.env.example` for reviewers and automation; it contains no live value.

Do not add production Infinite Awareness credentials, production API hosts, database URLs, payment keys, authentication values or customer-system identifiers. The application is intentionally self-contained and uses only fixed fictional constants in browser memory.

Some hosting platforms inject their own analytics or build metadata into the generated page. Those platform values are outside the participant domain and are not read by the sandbox's application logic.
