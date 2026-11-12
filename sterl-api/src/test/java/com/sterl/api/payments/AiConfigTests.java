package com.sterl.api.payments;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;

/** The AI is paid per use, so it must be switched on deliberately: fixed wording otherwise. */
class AiConfigTests {

	private final AiConfig config = new AiConfig();
	private final Duration timeout = Duration.ofSeconds(20);

	@Test
	void fixedWordingByDefaultEvenWhenAKeyIsLyingAroundInTheEnvironment() {
		assertThat(config.paymentExplainer(false, "sk-ant-not-a-real-key", "claude-opus-5-5", timeout))
				.isInstanceOf(TemplatePaymentExplainer.class);
	}

	@Test
	void switchedOnButWithoutAKeyStillUsesFixedWording() {
		assertThat(config.paymentExplainer(true, "", "claude-opus-5-5", timeout)).isInstanceOf(TemplatePaymentExplainer.class);
	}

	@Test
	void onlyBothSwitchesTogetherUseClaude() {
		PaymentExplainer explainer = config.paymentExplainer(true, "sk-ant-not-a-real-key", "claude-opus-5-5", timeout);
		assertThat(explainer).isInstanceOf(ClaudePaymentExplainer.class);
		assertThat(explainer.model()).isEqualTo("claude-opus-5-5");
	}
}
