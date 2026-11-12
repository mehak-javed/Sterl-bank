-- V7: cards for the sample customers. Hand-written (V2 is generated and already applied, and Flyway
-- refuses edits to an applied migration). CardApiTests checks Nikita's four match src/mocks/data/cards.json.
-- Last 4 digits come from published test card numbers only.

INSERT INTO cards (id, account_id, product, brand, name_on_card, last4, expiry_month, expiry_year) VALUES
    -- Nikita Crist, Everyday Account: the same four cards as the website's fixtures.
    ('b0422f68-b03d-4d55-8c41-4607b817b005', 'f9312322-42e1-486f-916f-dd42ae894c25', 'debit',   'Visa',       'NIKITA CRIST', '4242',  9, 2029),
    ('e94b523a-0433-4adb-8ae0-2656328e60b4', 'f9312322-42e1-486f-916f-dd42ae894c25', 'premier', 'Mastercard', 'NIKITA CRIST', '8210',  4, 2030),
    ('5bd9541e-a0a7-4fd2-8b72-b80aa2592d01', 'f9312322-42e1-486f-916f-dd42ae894c25', 'travel',  'Mastercard', 'NIKITA CRIST', '4444', 12, 2029),
    ('8964c140-0534-4d2c-8a58-72e9ed132dd8', 'f9312322-42e1-486f-916f-dd42ae894c25', 'virtual', 'Visa',       'NIKITA CRIST', '5556',  6, 2028),
    -- The four test customers from V5: one Everyday Debit each.
    ('7c1e0f43-5b8a-4d7e-9a61-0b3c5d2e8f01', 'ca507fc3-c825-5c97-a1c1-439ee0f9713d', 'debit',   'Visa',       'TOMAS REYES',     '4242', 6, 2029),
    ('7c1e0f43-5b8a-4d7e-9a61-0b3c5d2e8f02', '25ae0c00-9fc0-55d4-87de-a59256d0e0c8', 'debit',   'Visa',       'AMARA LINDQVIST', '4242', 3, 2030),
    ('7c1e0f43-5b8a-4d7e-9a61-0b3c5d2e8f03', '1feba6c2-3772-5462-af43-0011826b7d7a', 'debit',   'Visa',       'JONAH PATEL',     '4242', 8, 2029),
    ('7c1e0f43-5b8a-4d7e-9a61-0b3c5d2e8f04', '4061db6b-d01e-5b99-8ca1-77f015370101', 'debit',   'Visa',       'ELIF MOREAU',     '4242', 11, 2028);
