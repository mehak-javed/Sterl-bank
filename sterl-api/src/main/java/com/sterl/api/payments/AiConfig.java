package com.sterl.api.payments;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.anthropic.client.okhttp.AnthropicOkHttpClient;

/**
 * Chooses the explainer. Fixed wording (the template) by default. Claude only when BOTH are set:
 * sterl.ai.enabled=true (STERL_AI_ENABLED) and an API key (ANTHROPIC_API_KEY, never committed).
 * Two switches on purpose: the API is paid per use, so a key that happens to be in the environment
 * must never start spending on its own.
 */
@Configuration(proxyBeanMethods = false)
public class AiConfig {

	private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

	@Bean
	PaymentExplainer paymentExplainer(@Value("${sterl.ai.enabled:false}") boolean enabled,
			@Value("${sterl.ai.anthropic-api-key:}") String apiKey,
			@Value("${sterl.ai.model}") String model, @Value("${sterl.ai.timeout}") Duration timeout) {
		if (!enabled || apiKey == null || apiKey.isBlank()) {
			log.info("AI explanations off (sterl.ai.enabled={}, key {}): payment explanations use the fixed wording",
					enabled, apiKey == null || apiKey.isBlank() ? "absent" : "present");
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
