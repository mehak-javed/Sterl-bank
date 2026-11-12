package com.sterl.api.payments;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.anthropic.client.okhttp.AnthropicOkHttpClient;

/**
 * Chooses the explainer. With an API key (ANTHROPIC_API_KEY, never committed): Claude. Without one:
 * the fixed template, so the app (and every test) runs with no key and no network.
 */
@Configuration(proxyBeanMethods = false)
public class AiConfig {

	private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

	@Bean
	PaymentExplainer paymentExplainer(@Value("${sterl.ai.anthropic-api-key:}") String apiKey,
			@Value("${sterl.ai.model}") String model, @Value("${sterl.ai.timeout}") Duration timeout) {
		if (apiKey == null || apiKey.isBlank()) {
			log.info("No ANTHROPIC_API_KEY: payment explanations use the built-in template");
			return new TemplatePaymentExplainer();
		}
		// A short timeout and one retry: a held payment's explanation is not worth a long wait, and the
		// template is always there as a fallback.
		return new ClaudePaymentExplainer(AnthropicOkHttpClient.builder()
				.apiKey(apiKey)
				.timeout(timeout)
				.maxRetries(1)
				.build(), model);
	}
}
