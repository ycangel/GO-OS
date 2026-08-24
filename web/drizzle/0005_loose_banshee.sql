CREATE TABLE `cognitive_mcp_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`principal_link_id` text NOT NULL,
	`mission_id` integer NOT NULL,
	`accountable_member_id` integer NOT NULL,
	`source_interface` text NOT NULL,
	`source_thread_key_hash` text NOT NULL,
	`source_title` text NOT NULL,
	`expected_cursor` integer NOT NULL,
	`staged_payload` text,
	`payload_hash` text NOT NULL,
	`expected_checkpoint_request_hash` text NOT NULL,
	`payload_cleared_at` text,
	`idempotency_key_hash` text NOT NULL,
	`status` text DEFAULT 'staged' NOT NULL,
	`authority_grant_id` text NOT NULL,
	`authority_grant_revision` integer NOT NULL,
	`review_requested_at` text,
	`confirmed_checkpoint_receipt_id` text,
	`confirmed_at` text,
	`rejected_at` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`principal_link_id`) REFERENCES `cognitive_mcp_principal_links`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accountable_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authority_grant_id`) REFERENCES `authority_grants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmed_checkpoint_receipt_id`) REFERENCES `cognitive_sync_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cognitive_mcp_drafts_cursor_check" CHECK("cognitive_mcp_drafts"."expected_cursor" >= 0),
	CONSTRAINT "cognitive_mcp_drafts_payload_hash_check" CHECK(length("cognitive_mcp_drafts"."payload_hash") = 64 AND "cognitive_mcp_drafts"."payload_hash" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "cognitive_mcp_drafts_checkpoint_hash_check" CHECK(length("cognitive_mcp_drafts"."expected_checkpoint_request_hash") = 64 AND "cognitive_mcp_drafts"."expected_checkpoint_request_hash" NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "cognitive_mcp_drafts_payload_json_check" CHECK("cognitive_mcp_drafts"."staged_payload" IS NULL OR json_valid("cognitive_mcp_drafts"."staged_payload")),
	CONSTRAINT "cognitive_mcp_drafts_status_check" CHECK("cognitive_mcp_drafts"."status" IN ('staged', 'pending_human_consent', 'confirming', 'confirmed', 'rejected', 'expired')),
	CONSTRAINT "cognitive_mcp_drafts_terminal_check" CHECK(("cognitive_mcp_drafts"."status" = 'confirmed' AND "cognitive_mcp_drafts"."staged_payload" IS NULL AND "cognitive_mcp_drafts"."payload_cleared_at" IS NOT NULL AND "cognitive_mcp_drafts"."confirmed_at" IS NOT NULL AND "cognitive_mcp_drafts"."confirmed_checkpoint_receipt_id" IS NOT NULL AND "cognitive_mcp_drafts"."rejected_at" IS NULL) OR ("cognitive_mcp_drafts"."status" = 'rejected' AND "cognitive_mcp_drafts"."staged_payload" IS NULL AND "cognitive_mcp_drafts"."payload_cleared_at" IS NOT NULL AND "cognitive_mcp_drafts"."rejected_at" IS NOT NULL AND "cognitive_mcp_drafts"."confirmed_at" IS NULL AND "cognitive_mcp_drafts"."confirmed_checkpoint_receipt_id" IS NULL) OR ("cognitive_mcp_drafts"."status" = 'expired' AND "cognitive_mcp_drafts"."staged_payload" IS NULL AND "cognitive_mcp_drafts"."payload_cleared_at" IS NOT NULL AND "cognitive_mcp_drafts"."confirmed_at" IS NULL AND "cognitive_mcp_drafts"."rejected_at" IS NULL AND "cognitive_mcp_drafts"."confirmed_checkpoint_receipt_id" IS NULL) OR ("cognitive_mcp_drafts"."status" IN ('staged', 'pending_human_consent', 'confirming') AND "cognitive_mcp_drafts"."staged_payload" IS NOT NULL AND "cognitive_mcp_drafts"."payload_cleared_at" IS NULL AND "cognitive_mcp_drafts"."confirmed_at" IS NULL AND "cognitive_mcp_drafts"."rejected_at" IS NULL AND "cognitive_mcp_drafts"."confirmed_checkpoint_receipt_id" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_mcp_drafts_idempotency_unique` ON `cognitive_mcp_drafts` (`idempotency_key_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_mcp_drafts_cursor_active_unique` ON `cognitive_mcp_drafts` (`principal_link_id`,`mission_id`,`source_interface`,`source_thread_key_hash`,`expected_cursor`) WHERE "cognitive_mcp_drafts"."status" IN ('staged', 'pending_human_consent', 'confirming');--> statement-breakpoint
CREATE TABLE `cognitive_mcp_principal_links` (
	`id` text PRIMARY KEY NOT NULL,
	`principal_hash` text NOT NULL,
	`member_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`linked_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cognitive_mcp_principal_links_status_check" CHECK("cognitive_mcp_principal_links"."status" IN ('active', 'revoked')),
	CONSTRAINT "cognitive_mcp_principal_links_revocation_check" CHECK(("cognitive_mcp_principal_links"."status" = 'active' AND "cognitive_mcp_principal_links"."revoked_at" IS NULL) OR ("cognitive_mcp_principal_links"."status" = 'revoked' AND "cognitive_mcp_principal_links"."revoked_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_mcp_principal_links_principal_active_unique` ON `cognitive_mcp_principal_links` (`principal_hash`) WHERE "cognitive_mcp_principal_links"."status" = 'active' AND "cognitive_mcp_principal_links"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_mcp_principal_links_member_active_unique` ON `cognitive_mcp_principal_links` (`member_id`) WHERE "cognitive_mcp_principal_links"."status" = 'active' AND "cognitive_mcp_principal_links"."revoked_at" IS NULL;
--> statement-breakpoint
CREATE TRIGGER `cognitive_mcp_principal_links_active_member_insert`
BEFORE INSERT ON `cognitive_mcp_principal_links`
WHEN NOT EXISTS (
	SELECT 1 FROM `members`
	WHERE `id` = NEW.`member_id`
		AND `status` IN ('invited', 'active')
		AND (`expires_at` IS NULL OR julianday(`expires_at`) > julianday(NEW.`linked_at`))
)
BEGIN
	SELECT RAISE(ABORT, 'MCP principal requires an active GO Society member');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_mcp_drafts_authority_insert`
BEFORE INSERT ON `cognitive_mcp_drafts`
WHEN NOT EXISTS (
	SELECT 1
	FROM `cognitive_mcp_principal_links` AS `link`
	JOIN `members` AS `member`
		ON `member`.`id` = NEW.`accountable_member_id`
	JOIN `mission_memberships` AS `membership`
		ON `membership`.`member_id` = NEW.`accountable_member_id`
		AND `membership`.`mission_id` = NEW.`mission_id`
		AND `membership`.`status` = 'active'
		AND `membership`.`can_record` = 1
	JOIN `authority_grants` AS `grant`
		ON `grant`.`id` = NEW.`authority_grant_id`
		AND `grant`.`revision` = NEW.`authority_grant_revision`
	WHERE `link`.`id` = NEW.`principal_link_id`
		AND `link`.`member_id` = NEW.`accountable_member_id`
		AND `link`.`status` = 'active'
		AND `link`.`revoked_at` IS NULL
		AND `member`.`status` IN ('invited', 'active')
		AND (`member`.`expires_at` IS NULL OR julianday(`member`.`expires_at`) > julianday(NEW.`created_at`))
		AND `grant`.`grantee` = 'member:' || NEW.`accountable_member_id`
		AND `grant`.`revoked_at` IS NULL
		AND `grant`.`self_expansion_allowed` = 0
		AND (`grant`.`valid_from` IS NULL OR julianday(`grant`.`valid_from`) <= julianday(NEW.`created_at`))
		AND (`grant`.`expires_at` IS NULL OR julianday(`grant`.`expires_at`) > julianday(NEW.`created_at`))
		AND json_valid(`grant`.`allowed_actions`)
		AND json_valid(`grant`.`prohibited_actions`)
		AND json_valid(`grant`.`resource_rights`)
		AND json_valid(`grant`.`limits`)
		AND EXISTS (
			SELECT 1 FROM json_each(`grant`.`allowed_actions`)
			WHERE json_each.value = 'custom:capture_cognitive_source'
		)
		AND NOT EXISTS (
			SELECT 1 FROM json_each(`grant`.`prohibited_actions`)
			WHERE json_each.value = 'custom:capture_cognitive_source'
		)
		AND (
			EXISTS (
				SELECT 1 FROM json_each(`grant`.`resource_rights`, '$.allowedTargets')
				WHERE json_each.value = 'mission:' || NEW.`mission_id`
			)
			OR EXISTS (
				SELECT 1 FROM json_each(`grant`.`resource_rights`, '$.allowedTargetPrefixes')
				WHERE ('mission:' || NEW.`mission_id`) LIKE (json_each.value || '%')
			)
		)
		AND EXISTS (
			SELECT 1 FROM json_each(`grant`.`limits`, '$.allowedTools')
			WHERE json_each.value = 'mcp-cognitive-bridge'
		)
		AND EXISTS (
			SELECT 1
			FROM json_each(json_extract(`grant`.`limits`, '$.toolActionScopes."mcp-cognitive-bridge"'))
			WHERE json_each.value = 'custom:capture_cognitive_source'
		)
		AND CAST(json_extract(`grant`.`limits`, '$.maxResourceExposure') AS INTEGER) >= 1
		AND json_extract(`grant`.`limits`, '$.maxRiskClass') IN ('low', 'medium', 'high')
		AND `grant`.`reversibility_ceiling` IN (
			'reversible_only', 'costly_to_reverse_allowed', 'irreversible_allowed'
		)
)
BEGIN
	SELECT RAISE(ABORT, 'MCP draft lacks bounded member authority');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_mcp_drafts_staged_only_insert`
BEFORE INSERT ON `cognitive_mcp_drafts`
WHEN NEW.`status` <> 'staged'
	OR NEW.`staged_payload` IS NULL
	OR NEW.`payload_cleared_at` IS NOT NULL
	OR NEW.`review_requested_at` IS NOT NULL
	OR NEW.`confirmed_checkpoint_receipt_id` IS NOT NULL
	OR NEW.`confirmed_at` IS NOT NULL
	OR NEW.`rejected_at` IS NOT NULL
BEGIN
	SELECT RAISE(ABORT, 'MCP drafts must enter through staged state');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_mcp_drafts_boundary_immutable_update`
BEFORE UPDATE OF
	`principal_link_id`, `mission_id`, `accountable_member_id`,
	`source_interface`, `source_thread_key_hash`, `source_title`,
	`expected_cursor`, `staged_payload`, `payload_hash`,
	`expected_checkpoint_request_hash`, `payload_cleared_at`,
	`idempotency_key_hash`, `authority_grant_id`,
	`authority_grant_revision`, `expires_at`, `created_at`
ON `cognitive_mcp_drafts`
WHEN NEW.`principal_link_id` IS NOT OLD.`principal_link_id`
	OR NEW.`mission_id` IS NOT OLD.`mission_id`
	OR NEW.`accountable_member_id` IS NOT OLD.`accountable_member_id`
	OR NEW.`source_interface` IS NOT OLD.`source_interface`
	OR NEW.`source_thread_key_hash` IS NOT OLD.`source_thread_key_hash`
	OR (
		NEW.`source_title` IS NOT OLD.`source_title`
		AND NOT (
			OLD.`source_title` <> '[cleared]'
			AND NEW.`source_title` = '[cleared]'
			AND NEW.`staged_payload` IS NULL
			AND NEW.`status` IN ('confirmed', 'rejected', 'expired')
		)
	)
	OR NEW.`expected_cursor` IS NOT OLD.`expected_cursor`
	OR NEW.`payload_hash` IS NOT OLD.`payload_hash`
	OR NEW.`expected_checkpoint_request_hash` IS NOT OLD.`expected_checkpoint_request_hash`
	OR NEW.`idempotency_key_hash` IS NOT OLD.`idempotency_key_hash`
	OR NEW.`authority_grant_id` IS NOT OLD.`authority_grant_id`
	OR NEW.`authority_grant_revision` IS NOT OLD.`authority_grant_revision`
	OR NEW.`expires_at` IS NOT OLD.`expires_at`
	OR NEW.`created_at` IS NOT OLD.`created_at`
	OR (
		NEW.`staged_payload` IS NOT OLD.`staged_payload`
		AND NOT (
			OLD.`staged_payload` IS NOT NULL
			AND NEW.`staged_payload` IS NULL
			AND NEW.`status` IN ('confirmed', 'rejected', 'expired')
		)
	)
	OR (
		NEW.`payload_cleared_at` IS NOT OLD.`payload_cleared_at`
		AND NOT (
			OLD.`payload_cleared_at` IS NULL
			AND NEW.`payload_cleared_at` IS NOT NULL
			AND NEW.`staged_payload` IS NULL
			AND NEW.`status` IN ('confirmed', 'rejected', 'expired')
		)
	)
BEGIN
	SELECT RAISE(ABORT, 'MCP draft review boundary is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_mcp_drafts_status_transition_update`
BEFORE UPDATE OF `status` ON `cognitive_mcp_drafts`
WHEN NEW.`status` <> OLD.`status`
	AND NOT (
		(OLD.`status` = 'staged' AND NEW.`status` IN ('pending_human_consent', 'rejected', 'expired'))
		OR (OLD.`status` = 'pending_human_consent' AND NEW.`status` IN ('confirming', 'rejected', 'expired'))
		OR (OLD.`status` = 'confirming' AND NEW.`status` IN ('pending_human_consent', 'confirmed', 'expired'))
	)
BEGIN
	SELECT RAISE(ABORT, 'invalid MCP draft state transition');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_mcp_drafts_confirmed_receipt_update`
BEFORE UPDATE OF `status`, `confirmed_checkpoint_receipt_id`, `confirmed_at`
ON `cognitive_mcp_drafts`
WHEN NEW.`status` = 'confirmed'
	AND NOT EXISTS (
		SELECT 1
		FROM `cognitive_sync_receipts` AS `receipt`
		JOIN `cognitive_threads` AS `thread`
			ON `thread`.`id` = `receipt`.`thread_id`
		JOIN `cognitive_checkpoint_claims` AS `claim`
			ON `claim`.`thread_id` = `receipt`.`thread_id`
			AND `claim`.`cursor_from` = `receipt`.`cursor_from`
			AND `claim`.`cursor_to` = `receipt`.`cursor_to`
			AND `claim`.`request_hash` = `receipt`.`request_hash`
		WHERE `receipt`.`id` = NEW.`confirmed_checkpoint_receipt_id`
			AND `receipt`.`operation` = 'checkpoint'
			AND `receipt`.`request_hash` = NEW.`expected_checkpoint_request_hash`
			AND `receipt`.`actor` = 'member:' || NEW.`accountable_member_id`
			AND `receipt`.`cursor_from` = NEW.`expected_cursor`
			AND `receipt`.`cursor_to` = NEW.`expected_cursor` + 1
			AND `thread`.`mission_id` = NEW.`mission_id`
			AND `thread`.`accountable_member_id` = NEW.`accountable_member_id`
			AND `thread`.`source_interface` = NEW.`source_interface`
			AND `thread`.`source_thread_key` = NEW.`source_thread_key_hash`
			AND `claim`.`consent_scope` = 'internal_only'
			AND `claim`.`consent_confirmed_by_member_id` = NEW.`accountable_member_id`
			AND json_valid(`receipt`.`response_payload`)
			AND json_extract(`receipt`.`response_payload`, '$.checkpoint.id') = `receipt`.`id`
			AND json_extract(`receipt`.`response_payload`, '$.checkpoint.missionId') = NEW.`mission_id`
			AND json_extract(`receipt`.`response_payload`, '$.checkpoint.cursorFrom') = NEW.`expected_cursor`
			AND json_extract(`receipt`.`response_payload`, '$.checkpoint.cursorTo') = NEW.`expected_cursor` + 1
	)
BEGIN
	SELECT RAISE(ABORT, 'confirmed MCP draft lacks its exact canonical checkpoint');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_authorization_receipts_mcp_executor_scope_insert`
BEFORE INSERT ON `cognitive_authorization_receipts`
WHEN NEW.`executor` = 'mcp-cognitive-bridge'
	AND (
		NEW.`requested_by` <> 'mcp-runtime'
		OR NEW.`action` NOT IN (
			'custom:read_cognitive_context',
			'custom:capture_cognitive_source'
		)
	)
BEGIN
	SELECT RAISE(ABORT, 'MCP executor cannot cross the conversation bridge boundary');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_sync_receipts_append_only_update`
BEFORE UPDATE ON `cognitive_sync_receipts`
BEGIN
	SELECT RAISE(ABORT, 'cognitive sync receipts are append-only');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_sync_receipts_append_only_delete`
BEFORE DELETE ON `cognitive_sync_receipts`
BEGIN
	SELECT RAISE(ABORT, 'cognitive sync receipts are append-only');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_checkpoint_claims_append_only_update`
BEFORE UPDATE ON `cognitive_checkpoint_claims`
BEGIN
	SELECT RAISE(ABORT, 'cognitive checkpoint claims are append-only');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_checkpoint_claims_append_only_delete`
BEFORE DELETE ON `cognitive_checkpoint_claims`
BEGIN
	SELECT RAISE(ABORT, 'cognitive checkpoint claims are append-only');
END;
--> statement-breakpoint
-- The GO Society owner approves only this append-only executor extension.
-- The active grant keeps its human review powers on web-runtime, while the
-- database trigger above limits mcp-cognitive-bridge to read and private stage.
UPDATE `authority_grants`
SET `revoked_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE `id` = 'authority-member-' || (SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1) || '-v050-cognitive-r1'
	AND `revoked_at` IS NULL
	AND EXISTS (
		SELECT 1 FROM json_each(`authority_grants`.`allowed_actions`)
		WHERE json_each.value = 'custom:capture_cognitive_source'
	)
	AND NOT EXISTS (
		SELECT 1 FROM `authority_grants` AS `new_grant`
		WHERE `new_grant`.`id` = `authority_grants`.`id` || '-mcp-r2'
	);
--> statement-breakpoint
INSERT OR IGNORE INTO `authority_grants` (
	`id`, `grantor`, `grantee`, `accountable_human`, `scope`,
	`allowed_actions`, `prohibited_actions`, `resource_rights`, `limits`,
	`reversibility_ceiling`, `evidence_obligations`, `escalation`,
	`conflict_rules`, `valid_from`, `expires_at`, `revoked_at`,
	`revision`, `self_expansion_allowed`, `created_at`
)
SELECT
	`id` || '-mcp-r2', `grantor`, `grantee`, `accountable_human`,
	'Operate the bounded GO Society alpha, Web Human Gate and native Sites Cognitive Bridge. Conversation tools may read ratified context and stage private drafts only.',
	`allowed_actions`, `prohibited_actions`, `resource_rights`,
	json_set(
		`limits`,
		'$.allowedTools', json_array('web-runtime', 'mcp-cognitive-bridge'),
		'$.toolActionScopes', json_object(
			'web-runtime', json(`allowed_actions`),
			'mcp-cognitive-bridge', json_array(
				'custom:read_cognitive_context',
				'custom:capture_cognitive_source'
			)
		)
	),
	`reversibility_ceiling`, `evidence_obligations`, `escalation`,
	`conflict_rules`, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
	`expires_at`, NULL, `revision` + 1, 0,
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `authority_grants`
WHERE `id` = 'authority-member-' || (SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1) || '-v050-cognitive-r1'
	AND `revoked_at` IS NOT NULL
	AND ABS((julianday('now') - julianday(`revoked_at`)) * 86400) < 5
	AND NOT EXISTS (
		SELECT 1 FROM `authority_grants` AS `new_grant`
		WHERE `new_grant`.`id` = `authority_grants`.`id` || '-mcp-r2'
	);
