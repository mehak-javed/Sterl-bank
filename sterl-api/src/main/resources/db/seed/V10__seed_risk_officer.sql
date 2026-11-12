-- V10: the first STAFF login: a risk officer for the Credit Risk desk.
-- Staff are not customers: no customers row, no accounts (the app_users_customer_link CHECK from V4
-- enforces that a non-customer role has no customer_id). Staff addresses use the reserved
-- @sterl.example domain. The password is public, for portfolio reviewers: docs/demo-accounts.md.
-- Hash: Argon2id with Spring Security's v5.8 defaults, the same as every other login.
INSERT INTO app_users (id, customer_id, email, password_hash, role) VALUES
    ('3f6b2c1e-7a54-4d0e-9c21-5b8e0f4a7d10', NULL, 'morgan.ellis@sterl.example',
     '{argon2@SpringSecurity_v5_8}$argon2id$v=19$m=16384,t=2,p=1$iCm2P2aaxR4/EJVwe1Kd9Q$vxWztr0vxCapyFK/Ej5l2A8FXtBtJNyWxrODigd2R5Y',
     'risk_officer');
