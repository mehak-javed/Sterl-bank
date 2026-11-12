package com.sterl.api.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** The encryption on its own: no database needed. */
class DataCipherTests {

	private static final String KEY_A = Base64.getEncoder().encodeToString(new byte[32]);
	private static final String KEY_B = Base64.getEncoder().encodeToString("another 32-byte key for testing!".getBytes());

	@TempDir
	Path temp;

	private DataCipher cipher(String key) {
		return new DataCipher(key, temp.resolve("unused"));
	}

	@Test
	void whatGoesInComesBackOut() {
		DataCipher cipher = cipher(KEY_A);
		String stored = cipher.encrypt("Mehak", "customers.first_name:1");
		assertThat(stored).startsWith("enc:v1:").doesNotContain("Mehak");
		assertThat(cipher.decrypt(stored, "customers.first_name:1")).isEqualTo("Mehak");
	}

	@Test
	void theSameNameEncryptsDifferentlyEveryTime() {
		DataCipher cipher = cipher(KEY_A);
		// A fresh random IV each time: two customers called Alex can't be spotted as the same.
		assertThat(cipher.encrypt("Alex", "c")).isNotEqualTo(cipher.encrypt("Alex", "c"));
	}

	@Test
	void aValueCopiedToAnotherRowCantBeRead() {
		DataCipher cipher = cipher(KEY_A);
		String tomas = cipher.encrypt("Tomas", "customers.first_name:tomas-id");
		assertThatThrownBy(() -> cipher.decrypt(tomas, "customers.first_name:nikita-id"))
				.hasMessageContaining("wrong key or altered data")
				.hasMessageNotContaining("Tomas");
	}

	@Test
	void anAlteredValueOrTheWrongKeyFailsInsteadOfReturningGarbage() {
		String stored = cipher(KEY_A).encrypt("4242", "cards.details:1");
		int at = stored.length() - 3;
		String altered = stored.substring(0, at) + (stored.charAt(at) == 'A' ? 'B' : 'A') + stored.substring(at + 1);

		assertThatThrownBy(() -> cipher(KEY_A).decrypt(altered, "cards.details:1")).isInstanceOf(IllegalStateException.class);
		assertThatThrownBy(() -> cipher(KEY_B).decrypt(stored, "cards.details:1")).isInstanceOf(IllegalStateException.class);
	}

	@Test
	void withoutAKeySettingALaptopGetsItsOwnPrivateKeyFileThatIsReusedNextTime() throws Exception {
		Path file = temp.resolve(".sterl/data-key");
		String stored = new DataCipher("", file).encrypt("Amara", "c");

		assertThat(file).exists();
		assertThat(Files.getPosixFilePermissions(file).toString()).isEqualTo("[OWNER_READ, OWNER_WRITE]");
		assertThat(new DataCipher("", file).decrypt(stored, "c")).isEqualTo("Amara"); // same key after a restart
	}

	@Test
	void aKeyOfTheWrongSizeIsRefusedAtStartup() {
		String short16 = Base64.getEncoder().encodeToString(new byte[16]);
		assertThatThrownBy(() -> cipher(short16)).hasMessageContaining("must be 32 bytes");
	}
}
