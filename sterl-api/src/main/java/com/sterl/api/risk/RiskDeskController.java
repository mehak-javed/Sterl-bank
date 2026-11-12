package com.sterl.api.risk;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sterl.api.auth.SterlUser;

/**
 * The Credit Risk desk's API: staff only (risk officers and admins, see SecurityConfig).
 * Counterparties, exposure and reports arrive in the next stories; this first endpoint lets the
 * website check it is talking to the desk as a risk officer.
 */
@RestController
@RequestMapping("/api/risk")
public class RiskDeskController {

	/** Who is at the desk. Never anything about customers. */
	public record DeskSession(String email, String role) {
	}

	@GetMapping("/desk")
	public DeskSession desk(@AuthenticationPrincipal SterlUser staff) {
		return new DeskSession(staff.email(), staff.role());
	}
}
