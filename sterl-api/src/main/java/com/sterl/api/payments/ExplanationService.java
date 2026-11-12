package com.sterl.api.payments;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import tools.jackson.databind.json.JsonMapper;

/**
 * Writes and records the explanation of a decision that has ALREADY been made and committed.
 * The AI is asked only when there's something to explain (a hold, or risk factors); a clean payment
 * gets the template. Whatever happens, one row goes into ai_audit_logs: who explained it, what they
 * were shown, how long it took, and any error.
 */
@Service
public class ExplanationService {

	private static final Logger log = LoggerFactory.getLogger(ExplanationService.class);
	private static final PaymentExplainer TEMPLATE = new TemplatePaymentExplainer();

	private final PaymentRepository payments;
	private final PaymentExplainer explainer;
	private final JsonMapper json = JsonMapper.builder().build();

	public ExplanationService(PaymentRepository payments, PaymentExplainer explainer) {
		this.payments = payments;
		this.explainer = explainer;
	}

	public Explanation explainAndRecord(UUID paymentId, ScreeningFacts facts, ScreeningResult result) {
		boolean nothingToExplain = result.decision() == ScreeningResult.Decision.APPROVE && result.hits().isEmpty();
		return explainWith(nothingToExplain ? TEMPLATE : explainer, paymentId, facts, result);
	}

	/** Package-private so tests can pass an explainer that fails. */
	Explanation explainWith(PaymentExplainer chosen, UUID paymentId, ScreeningFacts facts, ScreeningResult result) {
		ExplainerInput input = ExplainerInput.of(facts, result);
		long started = System.nanoTime();
		PaymentExplainer by = chosen;
		Explanation explanation;
		String error = null;
		try {
			explanation = chosen.explain(input);
		}
		catch (RuntimeException e) {
			// The AI is a nice-to-have: on ANY failure, the fixed wording takes over and the error is recorded.
			log.warn("AI explanation failed for payment {}: {}", paymentId, e.getClass().getSimpleName());
			error = (e.getClass().getSimpleName() + ": " + e.getMessage());
			error = error.length() > 300 ? error.substring(0, 300) : error;
			by = TEMPLATE;
			explanation = TEMPLATE.explain(input);
		}
		long latencyMs = (System.nanoTime() - started) / 1_000_000;
		payments.insertAiLog(paymentId, result, by, explanation, json.writeValueAsString(input), latencyMs, error);
		return explanation;
	}

	/** For a replayed request: the explanation recorded the first time (the template if none was). */
	public Explanation recorded(UUID paymentId, PaymentRepository.PaymentRow payment) {
		return payments.latestExplanation(paymentId).orElseGet(() -> TEMPLATE.explain(new ExplainerInput(
				"settled".equals(payment.status()) ? "approve" : "hold", payment.riskScore(), "", "", 0, 0, 0, "", java.util.List.of())));
	}
}
