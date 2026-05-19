# Technology Justification

This document justifies the main technology choices for the SendIO MVP by architectural layer.

## Delivery Provider Decision (MVP)

### Decision
- Use **Mailtrap** as the single email delivery provider for the MVP.

### Why this choice fits this project
- The project is scoped for an academic presentation/demo with controlled validation.
- Mailtrap provides a safe sandbox that avoids accidental real-customer sends.
- It simplifies operational setup for a 30-hour implementation window.

### Trade-offs
- **Pros:** low risk during demos, easier troubleshooting, faster setup.
- **Cons:** less production-realistic than a live provider; introduces provider migration work later.

### Future evolution
- Introduce a `MailProvider` abstraction and production-grade provider integration after MVP acceptance.
