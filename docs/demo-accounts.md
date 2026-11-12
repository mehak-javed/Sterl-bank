# Demo accounts

> Sterl is a portfolio demo. Not a real bank. All data is fake.

These are **public test logins** for fake customers. They're published on purpose so anyone can try
Sterl; they protect nothing real. Never reuse them anywhere else. Only Argon2id hashes of them are
stored in the database (`sterl-api/src/main/resources/db/seed/V5__seed_demo_users.sql`).

| Customer | Email | Password | What they have |
| --- | --- | --- | --- |
| **Nikita Crist** (the main demo customer) | `nikita.crist68@example.com` | `sterl demo passphrase` | Everyday Account, Rainy Day Saver, Round-up Pot; 90 days of history |
| Tomas Reyes | `tomas.reyes@example.com` | `sterl test passphrase 1` | Everyday Account, £1,779.10 |
| Amara Lindqvist | `amara.lindqvist@example.com` | `sterl test passphrase 2` | Everyday Account |
| Jonah Patel | `jonah.patel@example.com` | `sterl test passphrase 3` | Everyday Account |
| Elif Moreau | `elif.moreau@example.com` | `sterl test passphrase 4` | Everyday Account |

The extra four exist so tests (and visitors) can check that one customer never sees another's data.
Each customer also has the cards in `V7__seed_cards.sql`.

## Staff

| Staff member | Email | Password | Can open |
| --- | --- | --- | --- |
| Morgan Ellis, risk officer | `morgan.ellis@sterl.example` | `sterl risk passphrase` | The Credit Risk desk (and Markets) |

Staff are not customers: they have no accounts, and the API refuses them every customer endpoint
(accounts, cards, payments). Customers are refused the risk desk. Staff addresses use
`sterl.example`, also reserved. Seeded in `db/seed/V10__seed_risk_officer.sql`.
All emails use `example.com`, a domain reserved so it can never reach a real inbox.
