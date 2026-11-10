-- =====================================================================================
-- V4: logins (Auth sprint A).
-- =====================================================================================

-- ---------- Users: who can log in ----------
-- A user is a LOGIN. A customer is a BANKING RELATIONSHIP (accounts, payees...). They're separate
-- because staff (risk officers, traders, admins, coming in Week 3) log in but have no accounts.

CREATE TABLE app_users (
    id              UUID        PRIMARY KEY,
    customer_id     UUID        UNIQUE REFERENCES customers (id),
    -- Stored in lower case and compared in lower case: Ana@example.com and ana@example.com are one person.
    email           TEXT        NOT NULL UNIQUE CHECK (email = lower(email) AND email LIKE '%_@_%'),
    -- Never the password itself: an Argon2id hash, prefixed with the algorithm id, e.g.
    -- "{argon2@SpringSecurity_v5_8}$argon2id$v=19$m=16384,t=2,p=1$<salt>$<hash>". The prefix lets us
    -- move to a stronger algorithm later and re-hash each user's password at their next login.
    password_hash   TEXT        NOT NULL CHECK (password_hash LIKE '{%}%'),
    role            TEXT        NOT NULL CHECK (role IN ('customer', 'risk_officer', 'trader', 'admin')),
    enabled         BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,

    -- Customers are linked to their banking record; staff never are.
    CONSTRAINT app_users_customer_link CHECK ((role = 'customer') = (customer_id IS NOT NULL))
);

-- ---------- Sessions (Spring Session JDBC) ----------
-- Who is logged in, stored in PostgreSQL rather than in one server's memory: a restart doesn't log
-- everyone out, several API servers share the same sessions, and a user's sessions can be listed
-- and ended ("sign out of all devices", Auth sprint B).
-- The browser only ever holds a random session id in an HttpOnly cookie, never the user's data.
-- Table layout is Spring Session 4.1's own (schema-postgresql.sql), created here so Flyway owns it.

CREATE TABLE spring_session (
    primary_id             CHAR(36)     NOT NULL,
    session_id             CHAR(36)     NOT NULL,
    creation_time          BIGINT       NOT NULL,
    last_access_time       BIGINT       NOT NULL,
    max_inactive_interval  INT          NOT NULL,
    expiry_time            BIGINT       NOT NULL,
    principal_name         VARCHAR(100),
    CONSTRAINT spring_session_pk PRIMARY KEY (primary_id)
);

CREATE UNIQUE INDEX spring_session_ix1 ON spring_session (session_id);
CREATE INDEX spring_session_ix2 ON spring_session (expiry_time);
CREATE INDEX spring_session_ix3 ON spring_session (principal_name);

CREATE TABLE spring_session_attributes (
    session_primary_id  CHAR(36)     NOT NULL,
    attribute_name      VARCHAR(200) NOT NULL,
    attribute_bytes     BYTEA        NOT NULL,
    CONSTRAINT spring_session_attributes_pk PRIMARY KEY (session_primary_id, attribute_name),
    CONSTRAINT spring_session_attributes_fk FOREIGN KEY (session_primary_id)
        REFERENCES spring_session (primary_id) ON DELETE CASCADE
);
