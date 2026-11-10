package com.sterl.api.common;

import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns errors into RFC 9457 problem details. Spring already does this for every standard error;
 * we only improve one: a failed parameter check now says WHICH parameter and why
 * ("size: must be less than or equal to 100") instead of just "Validation failure".
 *
 * <p>The detail only ever contains the caller's own input names and the rule they broke,
 * never internals or stack traces.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	@Override
	protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		String detail = ex.getParameterValidationResults().stream()
				.flatMap(result -> result.getResolvableErrors().stream()
						.map(error -> result.getMethodParameter().getParameterName() + ": " + error.getDefaultMessage()))
				.sorted()
				.collect(Collectors.joining("; "));
		ProblemDetail body = ProblemDetail.forStatusAndDetail(status, detail);
		return handleExceptionInternal(ex, body, headers, status, request);
	}
}
