package com.sterl.api.common;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns errors into RFC 9457 problem details. Spring already does this for every standard error;
 * we only improve validation errors: they now say WHICH input is wrong and why
 * ("size: must be less than or equal to 100", "amountPence: must be greater than 0")
 * instead of just "Validation failure".
 *
 * <p>The detail only ever contains the caller's own input names and the rule they broke,
 * never internals or stack traces.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	/** Query parameters, headers, and (when a method also has those) the JSON body. */
	@Override
	protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		String detail = ex.getParameterValidationResults().stream()
				.flatMap(ApiExceptionHandler::describe)
				.sorted()
				.collect(Collectors.joining("; "));
		return handleExceptionInternal(ex, ProblemDetail.forStatusAndDetail(status, detail), headers, status, request);
	}

	/** A JSON body checked with @Valid on its own. */
	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldError> fields = ex.getBindingResult().getFieldErrors();
		String detail = describeFields(fields).sorted().collect(Collectors.joining("; "));
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
		// Also as a map, field -> message, so a form can show each message under the right box
		// (e.g. the sign-up form). The first message per field wins.
		problem.setProperty("errors", fields.stream().collect(Collectors.toMap(
				FieldError::getField, error -> String.valueOf(error.getDefaultMessage()), (first, second) -> first,
				java.util.TreeMap::new)));
		return handleExceptionInternal(ex, problem, headers, status, request);
	}

	private static Stream<String> describe(ParameterValidationResult result) {
		if (result instanceof ParameterErrors body) {
			return describeFields(body.getFieldErrors()); // a JSON body: name the fields inside it
		}
		String name = result.getMethodParameter().getParameterName();
		return result.getResolvableErrors().stream().map(error -> name + ": " + error.getDefaultMessage());
	}

	private static Stream<String> describeFields(List<FieldError> errors) {
		return errors.stream().map(error -> error.getField() + ": " + error.getDefaultMessage());
	}
}
