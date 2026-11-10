-- =====================================================================================
-- V5: logins for the demo bank (fake people only, ADR-002), and 4 more fake customers so tests
-- can prove one customer can never see another's data.
--
-- The passwords are PUBLIC TEST VALUES for a portfolio demo, listed in docs/demo-accounts.md.
-- Only their Argon2id hashes are stored. Never reuse them anywhere real.
-- =====================================================================================

INSERT INTO customers (id, first_name, last_name, email) VALUES
    ('e786a4ca-f86a-573e-ba92-f23daee6c141', 'Tomas', 'Reyes', 'tomas.reyes@example.com'),
    ('8de0ec80-7381-5bd2-af48-8fcf08e9ed6d', 'Amara', 'Lindqvist', 'amara.lindqvist@example.com'),
    ('993a5b98-e8a5-5a34-9046-8e20e845f90a', 'Jonah', 'Patel', 'jonah.patel@example.com'),
    ('6fc45a06-06c4-5cb6-a204-ff4c73801f12', 'Elif', 'Moreau', 'elif.moreau@example.com');

INSERT INTO accounts (id, customer_id, type, name, sort_code, account_number) VALUES
    ('ca507fc3-c825-5c97-a1c1-439ee0f9713d', 'e786a4ca-f86a-573e-ba92-f23daee6c141', 'current', 'Everyday Account', '11-22-01', '40000001'),
    ('25ae0c00-9fc0-55d4-87de-a59256d0e0c8', '8de0ec80-7381-5bd2-af48-8fcf08e9ed6d', 'current', 'Everyday Account', '11-22-02', '40000002'),
    ('1feba6c2-3772-5462-af43-0011826b7d7a', '993a5b98-e8a5-5a34-9046-8e20e845f90a', 'current', 'Everyday Account', '11-22-03', '40000003'),
    ('4061db6b-d01e-5b99-8ca1-77f015370101', '6fc45a06-06c4-5cb6-a204-ff4c73801f12', 'current', 'Everyday Account', '11-22-04', '40000004');

INSERT INTO ledger_transactions (id, kind, description, category, occurred_at) VALUES
    ('4c2d30b8-0a9f-5db8-be6c-10332495d39d', 'opening_balance', 'Opening balance', 'Opening balance', '2026-08-03T00:00:00Z'),
    ('d9cd7ee2-d3d9-5595-9fac-747ce81706c9', 'card', 'Corner Fresh', 'Groceries', '2026-10-12T10:15:00Z'),
    ('7b3dd778-b1a3-523b-b8b5-e9cbb93f32de', 'card', 'CityLine Travel', 'Transport', '2026-10-20T08:02:00Z'),
    ('73422389-3d0f-5417-af3f-ef00bb76507c', 'opening_balance', 'Opening balance', 'Opening balance', '2026-08-03T00:00:00Z'),
    ('0d040b60-f5dc-588b-a67c-cb1d4322de6f', 'card', 'Lantern Pizza', 'Eating out', '2026-10-14T19:40:00Z'),
    ('7df04f27-17d5-5d50-9576-f81c85fc7b6f', 'card', 'Metro Fuel', 'Transport', '2026-10-28T17:11:00Z'),
    ('4d30708e-1f17-5220-a9b9-fb112db55bfb', 'opening_balance', 'Opening balance', 'Opening balance', '2026-08-03T00:00:00Z'),
    ('711c49f9-4100-5cec-9b4b-fcb23ac4511e', 'card', 'Greenleaf Market', 'Groceries', '2026-10-09T12:30:00Z'),
    ('e58e306c-99a9-50c3-bd30-ba71358102b1', 'card', 'Ticket Booth', 'Entertainment', '2026-10-25T21:05:00Z'),
    ('ef0d50f4-052f-5456-b37e-8f2967f54441', 'opening_balance', 'Opening balance', 'Opening balance', '2026-08-03T00:00:00Z'),
    ('a90abdff-92d1-5254-8f1e-6bf5e772865f', 'card', 'Bean & Leaf Coffee', 'Eating out', '2026-10-30T07:50:00Z'),
    ('b53624f4-2fde-5640-8443-147e4fd3ebc5', 'card', 'RideNow', 'Transport', '2026-10-31T23:10:00Z');

INSERT INTO ledger_entries (id, ledger_transaction_id, account_id, amount_pence) VALUES
    ('7de223aa-d2e8-5e86-ae0b-e42c7991f8ed', '4c2d30b8-0a9f-5db8-be6c-10332495d39d', 'ca507fc3-c825-5c97-a1c1-439ee0f9713d', 182500),
    ('87588a70-e338-5bc4-9950-56fef0234491', '4c2d30b8-0a9f-5db8-be6c-10332495d39d', '00000000-0000-4000-8000-000000000001', -182500),
    ('e839e24c-d9ce-5166-aedd-d51b28f4afdc', 'd9cd7ee2-d3d9-5595-9fac-747ce81706c9', 'ca507fc3-c825-5c97-a1c1-439ee0f9713d', -4210),
    ('16b2dea9-64e3-5550-8192-15152fb1e201', 'd9cd7ee2-d3d9-5595-9fac-747ce81706c9', '00000000-0000-4000-8000-000000000002', 4210),
    ('508e70e1-ce94-51d7-a3df-aa75e3db0fb3', '7b3dd778-b1a3-523b-b8b5-e9cbb93f32de', 'ca507fc3-c825-5c97-a1c1-439ee0f9713d', -380),
    ('168aa846-2e7e-52c6-9c2a-135bd92022e7', '7b3dd778-b1a3-523b-b8b5-e9cbb93f32de', '00000000-0000-4000-8000-000000000002', 380),
    ('685c51d6-f30b-59c6-a432-1016708be321', '73422389-3d0f-5417-af3f-ef00bb76507c', '25ae0c00-9fc0-55d4-87de-a59256d0e0c8', 54000),
    ('82a053e3-3b98-5b1b-a769-515e635f9a25', '73422389-3d0f-5417-af3f-ef00bb76507c', '00000000-0000-4000-8000-000000000001', -54000),
    ('64b18767-b447-5c49-ad22-9ab32552814b', '0d040b60-f5dc-588b-a67c-cb1d4322de6f', '25ae0c00-9fc0-55d4-87de-a59256d0e0c8', -1895),
    ('91b0f5fa-6350-55f5-8d27-8a9e92a5dc23', '0d040b60-f5dc-588b-a67c-cb1d4322de6f', '00000000-0000-4000-8000-000000000002', 1895),
    ('fd3cc741-1c4c-518c-8501-62ad3f46d1bb', '7df04f27-17d5-5d50-9576-f81c85fc7b6f', '25ae0c00-9fc0-55d4-87de-a59256d0e0c8', -5000),
    ('67f48f0a-f253-5af2-9017-59b19a533527', '7df04f27-17d5-5d50-9576-f81c85fc7b6f', '00000000-0000-4000-8000-000000000002', 5000),
    ('772df715-d662-5e22-a0ca-89adb741a581', '4d30708e-1f17-5220-a9b9-fb112db55bfb', '1feba6c2-3772-5462-af43-0011826b7d7a', 310000),
    ('38cf5d3d-1295-58a0-abf9-f7fc0dc1033c', '4d30708e-1f17-5220-a9b9-fb112db55bfb', '00000000-0000-4000-8000-000000000001', -310000),
    ('cb5ecaf8-1f41-5494-a207-921361bd05f2', '711c49f9-4100-5cec-9b4b-fcb23ac4511e', '1feba6c2-3772-5462-af43-0011826b7d7a', -6733),
    ('d782a422-62a7-5426-9959-83d7f5c0672f', '711c49f9-4100-5cec-9b4b-fcb23ac4511e', '00000000-0000-4000-8000-000000000002', 6733),
    ('19c5a955-4713-5441-ae12-850da139dcd5', 'e58e306c-99a9-50c3-bd30-ba71358102b1', '1feba6c2-3772-5462-af43-0011826b7d7a', -2400),
    ('135d1ffb-16e1-57a8-979f-2dcb9821a9d4', 'e58e306c-99a9-50c3-bd30-ba71358102b1', '00000000-0000-4000-8000-000000000002', 2400),
    ('648d7680-1834-59a5-8f42-af331b790b5e', 'ef0d50f4-052f-5456-b37e-8f2967f54441', '4061db6b-d01e-5b99-8ca1-77f015370101', 9850),
    ('475517cf-46c9-5741-aa08-a3969bda1d18', 'ef0d50f4-052f-5456-b37e-8f2967f54441', '00000000-0000-4000-8000-000000000001', -9850),
    ('8777bf99-e1b1-583a-9f6f-e2dbb7549639', 'a90abdff-92d1-5254-8f1e-6bf5e772865f', '4061db6b-d01e-5b99-8ca1-77f015370101', -465),
    ('af1b2c0f-a67d-5c3b-9949-a699277c165c', 'a90abdff-92d1-5254-8f1e-6bf5e772865f', '00000000-0000-4000-8000-000000000002', 465),
    ('074bf7f9-a6c1-5f26-9dbc-cd5ba093b180', 'b53624f4-2fde-5640-8443-147e4fd3ebc5', '4061db6b-d01e-5b99-8ca1-77f015370101', -1220),
    ('0d098284-87b5-5a71-be01-c08cbae011fe', 'b53624f4-2fde-5640-8443-147e4fd3ebc5', '00000000-0000-4000-8000-000000000002', 1220);

-- One login per customer. The demo customer (Nikita Crist) is the one behind "Try the demo".
INSERT INTO app_users (id, customer_id, email, password_hash, role) VALUES
    ('8d7394e5-b6c6-592c-a8c3-9d4ee456fd89', '0d9b0fd3-2248-4649-9245-7c3890921ffc', 'nikita.crist68@example.com', '{argon2@SpringSecurity_v5_8}$argon2id$v=19$m=16384,t=2,p=1$XJreAWMp5HSa2QSrqF8AeA$Gopyv/VE7GtGHMnOG9iMTIXj2fbTCAOSkIMeuj2PLUY', 'customer'),
    ('205d720c-3ba2-5548-8cb1-f4aefeed62f6', 'e786a4ca-f86a-573e-ba92-f23daee6c141', 'tomas.reyes@example.com', '{argon2@SpringSecurity_v5_8}$argon2id$v=19$m=16384,t=2,p=1$KNQLGa0CKfQV1GrWbGFtLg$Z3g4I0HxjnoFMtEV7wcrUFYMeyuYtWQKc2eiY0/kig4', 'customer'),
    ('8340ec28-c869-5e26-8ec5-72328dc0fabd', '8de0ec80-7381-5bd2-af48-8fcf08e9ed6d', 'amara.lindqvist@example.com', '{argon2@SpringSecurity_v5_8}$argon2id$v=19$m=16384,t=2,p=1$L7fwZP6daJQ/oeonSPPMXA$eEJAI6VEqdhC8c8izAA+gyxPaALZl5n2gQvut4leVvI', 'customer'),
    ('4ff46b59-a37d-5ecd-baa5-46733d73b2a1', '993a5b98-e8a5-5a34-9046-8e20e845f90a', 'jonah.patel@example.com', '{argon2@SpringSecurity_v5_8}$argon2id$v=19$m=16384,t=2,p=1$wAYcGFD1ye3xhpg+aETfGA$P7MGcIUJW4R1/a56S8rQZGmK5CnSWzS3VHMdo5q2SJo', 'customer'),
    ('6235bd02-e259-504c-9b61-b20c1cec0908', '6fc45a06-06c4-5cb6-a204-ff4c73801f12', 'elif.moreau@example.com', '{argon2@SpringSecurity_v5_8}$argon2id$v=19$m=16384,t=2,p=1$x4dlxjyHuKSvXpvr6olmRg$/O2pYXUVVQDsoZRcnELl3B98m56BPILnt6R7Z+ZLF6g', 'customer');
