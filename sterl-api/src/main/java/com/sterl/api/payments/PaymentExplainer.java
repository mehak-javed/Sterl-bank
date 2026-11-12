package com.sterl.api.payments;

/** Writes the explanation of a decision the rules have ALREADY made. It can't change the decision. */
public interface PaymentExplainer {

	Explanation explain(ExplainerInput input);

	/** "ai" or "template", as recorded in ai_audit_logs.explained_by. */
	String source();

	/** The model id when an AI writes it; null for the template. */
	String model();
}
