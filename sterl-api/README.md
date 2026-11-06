# sterl-api

The Java back end for Sterl: Spring Boot 4.1 on Java 25 (LTS), built with Maven.

> Sterl is a portfolio demo. Not a real bank. All data is fake.

It will own everything a bank must get right: the double-entry ledger, transfers with
idempotency keys, the audit log, and the credit risk calculations (exposure, limit utilisation,
breaches). Money is always integer pence (`long`), never `double`. See `../docs/adr/`.

## Run it

Needs a JDK 25 (Temurin). No Maven install needed: `./mvnw` downloads the right version.

```bash
./mvnw verify            # compile + JUnit tests + package
./mvnw spring-boot:run   # start on http://localhost:8080
```

## Endpoints so far

| Endpoint | What it's for |
| --- | --- |
| `GET /actuator/health` | Is the API up? (`{"status":"UP"}`) |
| `GET /actuator/health/liveness` | Is the process healthy, or should it be restarted? |
| `GET /actuator/health/readiness` | Can it take traffic right now? |
| `GET /actuator/info` | Name and demo disclaimer |

Other Actuator endpoints (`env`, `beans`, `heapdump`…) are deliberately not exposed: they would
reveal configuration and internals. A test (`HealthEndpointTests`) keeps it that way.
