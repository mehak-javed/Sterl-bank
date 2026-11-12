package com.sterl.api.payments;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

/**
 * The words that go with a screening decision. Also the AI's output SCHEMA: the Claude SDK turns this
 * record into a JSON schema, and the answer must match it (structured outputs), so there's no free text
 * to parse and nothing else the model can slip in.
 */
public record Explanation(
		@JsonPropertyDescription("Shown to the customer. At most 2 short sentences, calm and plain English.")
		String customerMessage,
		@JsonPropertyDescription("Shown to the risk officer. At most 3 sentences naming the factors, with the numbers given.")
		String reviewerNote) {
}
