package com.sterl.api.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * One annotation for every test that needs the whole app and a real PostgreSQL:
 * the full Spring context, plus a freshly migrated sterl_test database.
 * (Maven Surefire already turns on the "test" profile, see pom.xml.)
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest
@Import(FreshDatabase.class)
public @interface SterlIntegrationTest {
}
