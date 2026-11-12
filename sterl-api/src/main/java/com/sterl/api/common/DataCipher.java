package com.sterl.api.common;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Encrypts personal data before it goes into PostgreSQL, so a copied database, a backup or someone
 * reading the tables sees only {@code enc:v1:...} instead of names and card details.
 *
 * <p>AES-256-GCM: the standard choice. GCM also detects tampering: change one byte of the stored
 * value and decryption fails instead of returning garbage.
 * <ul>
 * <li>A fresh random 12-byte IV for every value, so two customers called "Alex" never look the same.</li>
 * <li>"Associated data" ties each value to its row and column (e.g. {@code customers.first_name:<id>}).
 * Copying an encrypted name onto another customer's row makes decryption FAIL, not show it.</li>
 * <li>"v1" in the prefix names the key version, so keys can be rotated later.</li>
 * </ul>
 *
 * <p>The key lives outside the database and the repository: {@code STERL_DATA_KEY} on a server (a
 * secrets manager in a real bank), or a random file in your home folder on a laptop.
 */
@Component
public class DataCipher {

	public static final String PREFIX = "enc:v1:";

	private static final Logger log = LoggerFactory.getLogger(DataCipher.class);
	private static final int KEY_BYTES = 32; // AES-256
	private static final int IV_BYTES = 12; // the size GCM is designed for
	private static final int TAG_BITS = 128;

	private final SecretKey key;
	private final SecureRandom random = new SecureRandom();

	public DataCipher(@Value("${sterl.data-key:}") String base64Key, @Value("${sterl.data-key-file}") Path keyFile) {
		this.key = new SecretKeySpec(loadKey(base64Key, keyFile), "AES");
	}

	/** @param context where the value lives, e.g. "customers.first_name:" + id */
	public String encrypt(String plaintext, String context) {
		try {
			byte[] iv = new byte[IV_BYTES];
			random.nextBytes(iv);
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
			cipher.updateAAD(context.getBytes(StandardCharsets.UTF_8));
			byte[] sealed = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
			return PREFIX + Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + sealed.length).put(iv).put(sealed).array());
		}
		catch (GeneralSecurityException e) {
			throw new IllegalStateException("Encryption failed", e);
		}
	}

	/** Fails loudly on a wrong key, a tampered value or a value moved from another row. */
	public String decrypt(String stored, String context) {
		if (stored == null || !stored.startsWith(PREFIX)) {
			throw new IllegalStateException("Expected an encrypted value for " + context);
		}
		try {
			byte[] all = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
			Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
			cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES));
			cipher.updateAAD(context.getBytes(StandardCharsets.UTF_8));
			return new String(cipher.doFinal(all, IV_BYTES, all.length - IV_BYTES), StandardCharsets.UTF_8);
		}
		catch (GeneralSecurityException | IllegalArgumentException e) {
			// Never include the value or the key in the message.
			throw new IllegalStateException("Could not decrypt " + context + " (wrong key or altered data)", e);
		}
	}

	private static byte[] loadKey(String base64Key, Path keyFile) {
		if (base64Key != null && !base64Key.isBlank()) {
			return checked(Base64.getDecoder().decode(base64Key.strip()), "STERL_DATA_KEY");
		}
		try {
			if (!Files.exists(keyFile)) {
				byte[] fresh = new byte[KEY_BYTES];
				new SecureRandom().nextBytes(fresh);
				Files.createDirectories(keyFile.getParent());
				Files.writeString(keyFile, Base64.getEncoder().encodeToString(fresh));
				try {
					Files.setPosixFilePermissions(keyFile, PosixFilePermissions.fromString("rw-------"));
				}
				catch (UnsupportedOperationException notPosix) {
					// Windows: the file stays in the user's own profile folder.
				}
				log.warn("No STERL_DATA_KEY set: created a local development key at {}. Servers must set STERL_DATA_KEY.", keyFile);
			}
			return checked(Base64.getDecoder().decode(Files.readString(keyFile).strip()), keyFile.toString());
		}
		catch (IOException e) {
			throw new UncheckedIOException("Can't read or create the data key file " + keyFile, e);
		}
	}

	private static byte[] checked(byte[] key, String source) {
		if (key.length != KEY_BYTES) {
			throw new IllegalStateException(source + " must be " + KEY_BYTES + " bytes, base64-encoded (e.g. openssl rand -base64 32)");
		}
		return key;
	}
}
