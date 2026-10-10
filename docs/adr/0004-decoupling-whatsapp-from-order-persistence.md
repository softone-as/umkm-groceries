# ADR 0004: Decoupling WhatsApp from Order Persistence

## Status
Accepted

## Date
2026-10-09

## Context
Small retail operations in Indonesia often rely heavily on WhatsApp for communication and order negotiation. However, treating WhatsApp as the source of truth or making order placement dependent on WhatsApp delivery creates critical operational risks:
1. Message delivery failures or network interruptions could lead to lost customer orders.
2. WhatsApp Business API adds significant per-message costs and integration complexity.
3. Customers might close their browser after placing an order without clicking the WhatsApp link.

## Decision
1. **Application Database is Authoritative**: Every order is validated, created, and committed in the PostgreSQL database before any WhatsApp handoff is offered. The staff dashboard in the web application is the sole source of truth for all order processing, preparation, and collection.
2. **Client-Side Click-to-Chat**: WhatsApp interaction is implemented strictly as a prefilled client-side `https://wa.me/` link rendered on the order confirmation screen.
3. **No External API Dependencies**: The application server has zero outbound integration with the WhatsApp Business API or webhook dependencies.
4. **Resilience to Dropoff**: If a customer never clicks the WhatsApp button or closes WhatsApp without sending a message, the order remains fully visible, valid, and actionable in the staff dashboard.

## Consequences
* **Positive**:
  * Zero third-party messaging costs, zero webhook downtime risks.
  * 100% order capture reliability regardless of customer messaging actions.
  * Simple, friction-free customer experience familiar to Indonesian consumers.
* **Trade-off**:
  * Staff must coordinate bank transfer verification and customer questions by checking their phone manually rather than through automated in-app chatbots.
