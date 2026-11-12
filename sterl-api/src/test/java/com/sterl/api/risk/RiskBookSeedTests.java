package com.sterl.api.risk;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionTemplate;

import com.sterl.api.support.SterlIntegrationTest;

/**
 * The Credit Risk desk's lending book (V11 schema + V12 generated seed) against a real PostgreSQL:
 * the size and shape the desk needs, and the rules the database enforces on its own.
 *
 * <p>Exposure is calculated here in plain SQL (SUM of movements) only to check the DATA. The desk's real
 * exposure and utilisation logic is CR3's ExposureService, with its own edge-case tests.
 */
@SterlIntegrationTest
class RiskBookSeedTests {

	/** Exposure and utilisation per facility, in integer maths: basis points, 10,000 = 100%. */
	private static final String UTILISATION = """
			WITH exposure AS (
			    SELECT f.id, f.limit_pence, COALESCE(SUM(d.amount_pence), 0) AS exposure_pence
			      FROM facilities f LEFT JOIN drawdowns d ON d.facility_id = f.id
			     GROUP BY f.id, f.limit_pence)
			SELECT id, limit_pence, exposure_pence,
			       CASE WHEN limit_pence > 0 THEN exposure_pence * 10000 / limit_pence END AS basis_points
			  FROM exposure
			""";

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private TransactionTemplate transaction;

	private long count(String sql) {
		return jdbc.sql(sql).query(Long.class).single();
	}

	// ---------- Size ----------

	@Test
	void theBookHas500CompaniesAndOver2000Facilities() {
		assertThat(count("SELECT count(*) FROM counterparties")).isEqualTo(500);
		assertThat(count("SELECT count(*) FROM facilities")).isEqualTo(2_236).isGreaterThanOrEqualTo(2_000);
		assertThat(count("SELECT count(*) FROM drawdowns")).isEqualTo(9_462);
	}

	@Test
	void everyCompanyHasThreeToSixFacilities() {
		List<Long> perCompany = jdbc.sql("""
				SELECT count(f.id) FROM counterparties c LEFT JOIN facilities f ON f.counterparty_id = c.id GROUP BY c.id
				""").query(Long.class).list();
		assertThat(perCompany).hasSize(500).allSatisfy(n -> assertThat(n).isBetween(3L, 6L));
	}

	// ---------- Shape: what the desk needs to find ----------

	@Test
	void theBookHasFineWarningAndBreachedFacilities() {
		List<Map<String, Object>> rows = jdbc.sql(UTILISATION).query().listOfRows();
		long fine = rows.stream().filter(r -> bp(r) != null && bp(r) < 7_500).count();
		long warning = rows.stream().filter(r -> bp(r) != null && bp(r) >= 7_500 && bp(r) <= 10_000).count();
		long breach = rows.stream().filter(r -> bp(r) != null && bp(r) > 10_000).count();

		// Most lending comfortably inside its limit; a real minority near or over it.
		assertThat(fine).isGreaterThan(rows.size() / 2);
		assertThat(warning).isBetween(100L, 700L);
		assertThat(breach).isBetween(40L, 300L);
	}

	@Test
	void cancelledFacilitiesHaveAZeroLimitAndOweNothing() {
		List<Map<String, Object>> cancelled = jdbc.sql(UTILISATION + " WHERE limit_pence = 0").query().listOfRows();
		assertThat(cancelled).hasSize(5).allSatisfy(r -> assertThat(((Number) r.get("exposure_pence")).longValue()).isZero());
	}

	@Test
	void noFacilityOwesANegativeAmount() {
		assertThat(count("SELECT count(*) FROM (" + UTILISATION + ") u WHERE exposure_pence < 0")).isZero();
	}

	@Test
	void someFacilitiesMovedInTheLastWeek() {
		// "Breaches this week" (CR4) needs recent activity. "Today" for the seed is 2026-11-01.
		assertThat(count("SELECT count(DISTINCT facility_id) FROM drawdowns WHERE occurred_on >= DATE '2026-10-25'"))
				.isGreaterThan(100);
	}

	@Test
	void ratingsSpreadLikeARealCorporateBook() {
		Map<String, Long> byRating = jdbc.sql("SELECT rating, count(*) AS n FROM counterparties GROUP BY rating")
				.query((rs, i) -> Map.entry(rs.getString(1), rs.getLong(2))).list().stream()
				.collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
		assertThat(byRating.keySet()).containsExactlyInAnyOrder("AAA", "AA", "A", "BBB", "BB", "B", "CCC");
		assertThat(byRating.get("BBB")).isGreaterThan(byRating.get("AAA")); // most around BBB, few at the top
	}

	@Test
	void companyNamesAreInventedAndUnique() {
		List<String> names = jdbc.sql("SELECT name FROM counterparties").query(String.class).list();
		assertThat(names).doesNotHaveDuplicates()
				.allSatisfy(n -> assertThat(n).matches("[A-Z][a-z]+ [A-Za-z ]+ (Ltd|PLC|LLP|Group)"));
	}

	@Test
	void moneyIsWholePenceNeverFloats() {
		List<String> types = jdbc.sql("""
				SELECT data_type FROM information_schema.columns
				 WHERE table_name IN ('facilities', 'drawdowns') AND column_name LIKE '%pence'
				""").query(String.class).list();
		assertThat(types).containsExactlyInAnyOrder("bigint", "bigint");
	}

	// ---------- Rules the database enforces ----------

	@Test
	void aRepaymentLargerThanWhatIsOwedIsRefusedAtCommit() {
		String undrawn = jdbc.sql("SELECT id::text FROM (" + UTILISATION + ") u WHERE exposure_pence = 0 AND limit_pence > 0 LIMIT 1")
				.query(String.class).single();
		assertThatThrownBy(() -> transaction.executeWithoutResult(status -> jdbc.sql("""
				INSERT INTO drawdowns (id, facility_id, kind, amount_pence, occurred_on)
				VALUES (gen_random_uuid(), CAST(:facility AS uuid), 'repayment', -100, DATE '2026-11-01')
				""").param("facility", undrawn).update()))
				.rootCause().hasMessageContaining("repaid more than was drawn"); // PostgreSQL's own message
	}

	@Test
	void aMovementMustCarryTheRightSign() {
		String facility = jdbc.sql("SELECT id::text FROM facilities LIMIT 1").query(String.class).single();
		assertThatThrownBy(() -> jdbc.sql("""
				INSERT INTO drawdowns (id, facility_id, kind, amount_pence, occurred_on)
				VALUES (gen_random_uuid(), CAST(:facility AS uuid), 'drawdown', -500, DATE '2026-11-01')
				""").param("facility", facility).update())
				.hasMessageContaining("drawdowns_sign_matches_kind");
	}

	@Test
	void movementsCantBeChangedOrDeleted() {
		assertThatThrownBy(() -> jdbc.sql("UPDATE drawdowns SET amount_pence = amount_pence + 1").update())
				.rootCause().hasMessageContaining("append-only");
		assertThatThrownBy(() -> jdbc.sql("DELETE FROM drawdowns").update()).rootCause().hasMessageContaining("append-only");
	}

	@Test
	void onlyKnownRatingsAndSectorsAreAccepted() {
		assertThatThrownBy(() -> jdbc.sql("""
				INSERT INTO counterparties (id, name, sector, country, rating)
				VALUES (gen_random_uuid(), 'Testmere Labs Ltd', 'Technology', 'GB', 'D')
				""").update()).hasMessageContaining("counterparties_rating_check");
		assertThatThrownBy(() -> jdbc.sql("""
				INSERT INTO counterparties (id, name, sector, country, rating)
				VALUES (gen_random_uuid(), 'Testmere Labs Ltd', 'Gambling', 'GB', 'BB')
				""").update()).hasMessageContaining("counterparties_sector_check");
	}

	private static Long bp(Map<String, Object> row) {
		Object value = row.get("basis_points");
		return value == null ? null : ((Number) value).longValue();
	}
}
