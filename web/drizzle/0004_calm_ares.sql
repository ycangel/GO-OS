CREATE TABLE `cognitive_authorization_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`authority_grant_id` text NOT NULL,
	`grant_revision` integer NOT NULL,
	`member_id` integer NOT NULL,
	`mission_id` integer NOT NULL,
	`action` text NOT NULL,
	`resource_risk` text NOT NULL,
	`resource_exposure` integer NOT NULL,
	`reversibility` text NOT NULL,
	`executor` text NOT NULL,
	`requested_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`authority_grant_id`) REFERENCES `authority_grants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cognitive_candidate_decisions` (
	`candidate_id` text PRIMARY KEY NOT NULL,
	`decision` text NOT NULL,
	`decided_by_member_id` integer NOT NULL,
	`rationale` text NOT NULL,
	`authorization_receipt_id` text NOT NULL,
	`decided_at` text NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `cognitive_objects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authorization_receipt_id`) REFERENCES `cognitive_authorization_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cognitive_candidate_decisions_decision_check" CHECK("cognitive_candidate_decisions"."decision" IN ('ratify', 'reject'))
);
--> statement-breakpoint
CREATE TABLE `cognitive_checkpoint_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`cursor_from` integer NOT NULL,
	`cursor_to` integer NOT NULL,
	`request_hash` text NOT NULL,
	`consent_scope` text NOT NULL,
	`consent_confirmed_by_member_id` integer NOT NULL,
	`consent_confirmed_at` text NOT NULL,
	`authorization_receipt_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `cognitive_threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`consent_confirmed_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authorization_receipt_id`) REFERENCES `cognitive_authorization_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cognitive_checkpoint_claims_cursor_step" CHECK("cognitive_checkpoint_claims"."cursor_to" = "cognitive_checkpoint_claims"."cursor_from" + 1),
	CONSTRAINT "cognitive_checkpoint_claims_consent_scope" CHECK("cognitive_checkpoint_claims"."consent_scope" = 'internal_only')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_checkpoint_claims_thread_cursor_unique` ON `cognitive_checkpoint_claims` (`thread_id`,`cursor_from`);--> statement-breakpoint
CREATE TABLE `cognitive_fragments` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`source_turn_ref` text NOT NULL,
	`speaker_type` text NOT NULL,
	`speaker_ref` text,
	`verbatim_text` text NOT NULL,
	`content_hash` text NOT NULL,
	`content_kind` text DEFAULT 'narrative' NOT NULL,
	`provenance_trust` text DEFAULT 'model_reported' NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`occurred_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `cognitive_threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_fragments_thread_turn_unique` ON `cognitive_fragments` (`thread_id`,`source_turn_ref`);--> statement-breakpoint
CREATE TABLE `cognitive_head_transitions` (
	`id` text PRIMARY KEY NOT NULL,
	`mission_id` integer NOT NULL,
	`previous_revision` integer NOT NULL,
	`next_revision` integer NOT NULL,
	`version_id` text NOT NULL,
	`authorization_receipt_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authorization_receipt_id`) REFERENCES `cognitive_authorization_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cognitive_head_transitions_revision_step" CHECK("cognitive_head_transitions"."next_revision" = "cognitive_head_transitions"."previous_revision" + 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_head_transitions_revision_unique` ON `cognitive_head_transitions` (`mission_id`,`previous_revision`);--> statement-breakpoint
CREATE TABLE `cognitive_heads` (
	`mission_id` integer PRIMARY KEY NOT NULL,
	`ratified_version_id` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ratified_version_id`) REFERENCES `cognitive_objects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cognitive_object_links` (
	`id` text PRIMARY KEY NOT NULL,
	`from_object_id` text NOT NULL,
	`to_object_id` text,
	`fragment_id` text,
	`relation_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`from_object_id`) REFERENCES `cognitive_objects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_object_id`) REFERENCES `cognitive_objects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fragment_id`) REFERENCES `cognitive_fragments`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cognitive_object_links_one_target" CHECK(("cognitive_object_links"."to_object_id" IS NULL) <> ("cognitive_object_links"."fragment_id" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_object_links_object_unique` ON `cognitive_object_links` (`from_object_id`,`to_object_id`,`relation_type`) WHERE "cognitive_object_links"."to_object_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_object_links_fragment_unique` ON `cognitive_object_links` (`from_object_id`,`fragment_id`,`relation_type`) WHERE "cognitive_object_links"."fragment_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `cognitive_objects` (
	`id` text PRIMARY KEY NOT NULL,
	`object_type` text NOT NULL,
	`schema_version` text DEFAULT '0.5.0' NOT NULL,
	`mission_id` integer NOT NULL,
	`thread_id` text NOT NULL,
	`decision_state` text DEFAULT 'candidate' NOT NULL,
	`canonical_payload` text NOT NULL,
	`payload_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`accountable_member_id` integer NOT NULL,
	`authority_grant_id` text NOT NULL,
	`authorization_receipt_id` text,
	`decided_by_member_id` integer,
	`decision_rationale` text,
	`decided_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`thread_id`) REFERENCES `cognitive_threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accountable_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authority_grant_id`) REFERENCES `authority_grants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authorization_receipt_id`) REFERENCES `cognitive_authorization_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cognitive_sync_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`thread_id` text NOT NULL,
	`operation` text NOT NULL,
	`request_hash` text NOT NULL,
	`response_payload` text NOT NULL,
	`cursor_from` integer NOT NULL,
	`cursor_to` integer NOT NULL,
	`actor` text NOT NULL,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `cognitive_threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_sync_receipts_idempotency_unique` ON `cognitive_sync_receipts` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `cognitive_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`source_interface` text NOT NULL,
	`source_thread_key` text NOT NULL,
	`source_title` text NOT NULL,
	`mission_id` integer NOT NULL,
	`accountable_member_id` integer NOT NULL,
	`capture_mode` text DEFAULT 'selected_checkpoint' NOT NULL,
	`consent_scope` text DEFAULT 'internal_only' NOT NULL,
	`last_cursor` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accountable_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_threads_source_unique` ON `cognitive_threads` (`source_interface`,`source_thread_key`);--> statement-breakpoint
ALTER TABLE `authority_grants` ADD `revision` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE TRIGGER `cognitive_authorization_receipts_valid_insert`
BEFORE INSERT ON `cognitive_authorization_receipts`
WHEN NOT EXISTS (
	SELECT 1
	FROM `authority_grants` AS `grant`
	JOIN `mission_memberships` AS `membership`
		ON `membership`.`member_id` = NEW.`member_id`
		AND `membership`.`mission_id` = NEW.`mission_id`
		AND `membership`.`status` = 'active'
	WHERE `grant`.`id` = NEW.`authority_grant_id`
		AND `grant`.`revision` = NEW.`grant_revision`
		AND `grant`.`grantee` = 'member:' || NEW.`member_id`
		AND `grant`.`revoked_at` IS NULL
		AND `grant`.`self_expansion_allowed` = 0
		AND (`grant`.`valid_from` IS NULL OR julianday(`grant`.`valid_from`) <= julianday(NEW.`created_at`))
		AND (`grant`.`expires_at` IS NULL OR julianday(`grant`.`expires_at`) > julianday(NEW.`created_at`))
		AND json_valid(`grant`.`allowed_actions`)
		AND json_valid(`grant`.`prohibited_actions`)
		AND json_valid(`grant`.`resource_rights`)
		AND json_valid(`grant`.`limits`)
		AND EXISTS (SELECT 1 FROM json_each(`grant`.`allowed_actions`) WHERE json_each.value = NEW.`action`)
		AND NOT EXISTS (SELECT 1 FROM json_each(`grant`.`prohibited_actions`) WHERE json_each.value = NEW.`action`)
		AND (
			EXISTS (SELECT 1 FROM json_each(`grant`.`resource_rights`, '$.allowedTargets') WHERE json_each.value = 'mission:' || NEW.`mission_id`)
			OR EXISTS (SELECT 1 FROM json_each(`grant`.`resource_rights`, '$.allowedTargetPrefixes') WHERE ('mission:' || NEW.`mission_id`) LIKE (json_each.value || '%'))
		)
		AND EXISTS (SELECT 1 FROM json_each(`grant`.`limits`, '$.allowedTools') WHERE json_each.value = NEW.`executor`)
		AND NEW.`resource_exposure` >= 0
		AND NEW.`resource_exposure` <= CAST(json_extract(`grant`.`limits`, '$.maxResourceExposure') AS INTEGER)
		AND CASE NEW.`resource_risk` WHEN 'low' THEN 0 WHEN 'medium' THEN 1 WHEN 'high' THEN 2 ELSE 99 END
			<= CASE json_extract(`grant`.`limits`, '$.maxRiskClass') WHEN 'low' THEN 0 WHEN 'medium' THEN 1 WHEN 'high' THEN 2 ELSE -1 END
		AND CASE NEW.`reversibility` WHEN 'reversible_only' THEN 0 WHEN 'costly_to_reverse_allowed' THEN 1 WHEN 'irreversible_allowed' THEN 2 ELSE 99 END
			<= CASE `grant`.`reversibility_ceiling` WHEN 'reversible_only' THEN 0 WHEN 'costly_to_reverse_allowed' THEN 1 WHEN 'irreversible_allowed' THEN 2 ELSE -1 END
		AND CASE
			WHEN NEW.`action` IN ('create_evidence','create_exception','create_cognitive_event','create_deliberation_session','create_learning_record','create_evolution_proposal','custom:capture_cognitive_source') THEN `membership`.`can_record` = 1
			WHEN NEW.`action` IN ('approve_evolution_proposal','create_cognitive_commit','create_cognitive_version','custom:review_cognition') THEN `membership`.`can_review` = 1
			ELSE 1
		END
)
BEGIN
	SELECT RAISE(ABORT, 'authority changed before cognitive write');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_objects_authorization_insert`
BEFORE INSERT ON `cognitive_objects`
WHEN NEW.`authorization_receipt_id` IS NULL OR NOT EXISTS (
	SELECT 1 FROM `cognitive_authorization_receipts`
	WHERE `id` = NEW.`authorization_receipt_id`
		AND `authority_grant_id` = NEW.`authority_grant_id`
		AND `member_id` = CASE
			WHEN NEW.`decision_state` = 'candidate' THEN NEW.`accountable_member_id`
			ELSE NEW.`decided_by_member_id`
		END
		AND `mission_id` = NEW.`mission_id`
		AND `action` = CASE
			WHEN NEW.`object_type` = 'CognitiveEvent' AND NEW.`decision_state` = 'candidate' THEN 'create_cognitive_event'
			WHEN NEW.`object_type` = 'DeliberationSession' AND NEW.`decision_state` = 'candidate' THEN 'create_deliberation_session'
			WHEN NEW.`object_type` = 'LearningRecord' AND NEW.`decision_state` = 'candidate' THEN 'create_learning_record'
			WHEN NEW.`object_type` = 'EvolutionProposal' AND NEW.`decision_state` = 'candidate' THEN 'create_evolution_proposal'
			WHEN NEW.`object_type` = 'EvolutionProposal' AND NEW.`decision_state` = 'ratified' THEN 'approve_evolution_proposal'
			WHEN NEW.`object_type` IN ('CognitiveEvent','DeliberationSession','LearningRecord') AND NEW.`decision_state` = 'ratified' THEN 'custom:review_cognition'
			WHEN NEW.`object_type` = 'CognitiveCommit' THEN 'create_cognitive_commit'
			WHEN NEW.`object_type` = 'CognitiveVersion' THEN 'create_cognitive_version'
			ELSE '__invalid_cognitive_object_action__'
		END
)
BEGIN
	SELECT RAISE(ABORT, 'cognitive object lacks atomic authorization');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_objects_thread_boundary_insert`
BEFORE INSERT ON `cognitive_objects`
WHEN NOT EXISTS (
	SELECT 1 FROM `cognitive_threads`
	WHERE `id` = NEW.`thread_id`
		AND `mission_id` = NEW.`mission_id`
		AND (NEW.`decision_state` <> 'candidate' OR `accountable_member_id` = NEW.`accountable_member_id`)
)
BEGIN
	SELECT RAISE(ABORT, 'cognitive object crossed its private thread boundary');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_objects_thread_boundary_update`
BEFORE UPDATE OF `thread_id`, `mission_id`, `accountable_member_id` ON `cognitive_objects`
WHEN NOT EXISTS (
	SELECT 1 FROM `cognitive_threads`
	WHERE `id` = NEW.`thread_id`
		AND `mission_id` = NEW.`mission_id`
		AND (NEW.`decision_state` <> 'candidate' OR `accountable_member_id` = NEW.`accountable_member_id`)
)
BEGIN
	SELECT RAISE(ABORT, 'cognitive object crossed its private thread boundary');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_candidate_decisions_valid_insert`
BEFORE INSERT ON `cognitive_candidate_decisions`
WHEN NOT EXISTS (
	SELECT 1
	FROM `cognitive_objects` AS `candidate`
	JOIN `cognitive_authorization_receipts` AS `authorization`
		ON `authorization`.`id` = NEW.`authorization_receipt_id`
	WHERE `candidate`.`id` = NEW.`candidate_id`
		AND `candidate`.`decision_state` = 'candidate'
		AND `candidate`.`mission_id` = `authorization`.`mission_id`
		AND NEW.`decided_by_member_id` = `authorization`.`member_id`
		AND `authorization`.`action` = 'custom:review_cognition'
)
BEGIN
	SELECT RAISE(ABORT, 'candidate decision is stale or unauthorized');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_objects_candidate_decision_update`
BEFORE UPDATE OF `decision_state` ON `cognitive_objects`
WHEN OLD.`decision_state` = 'candidate'
	AND NEW.`decision_state` IN ('rejected', 'superseded')
	AND NOT EXISTS (SELECT 1 FROM `cognitive_candidate_decisions` WHERE `candidate_id` = OLD.`id`)
BEGIN
	SELECT RAISE(ABORT, 'candidate state changed without a human decision claim');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_checkpoint_claims_current_cursor_insert`
BEFORE INSERT ON `cognitive_checkpoint_claims`
WHEN NOT EXISTS (
	SELECT 1
	FROM `cognitive_threads` AS `thread`
	JOIN `cognitive_authorization_receipts` AS `authorization`
		ON `authorization`.`id` = NEW.`authorization_receipt_id`
	WHERE `thread`.`id` = NEW.`thread_id`
		AND `thread`.`last_cursor` = NEW.`cursor_from`
		AND `thread`.`accountable_member_id` = NEW.`consent_confirmed_by_member_id`
		AND `authorization`.`member_id` = NEW.`consent_confirmed_by_member_id`
		AND `authorization`.`mission_id` = `thread`.`mission_id`
		AND `authorization`.`action` = 'custom:capture_cognitive_source'
		AND NEW.`consent_scope` = 'internal_only'
		AND julianday(NEW.`consent_confirmed_at`) <= julianday(NEW.`created_at`)
)
BEGIN
	SELECT RAISE(ABORT, 'stale cursor or invalid source consent');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_threads_cursor_claim_update`
BEFORE UPDATE OF `last_cursor` ON `cognitive_threads`
WHEN NEW.`last_cursor` <> OLD.`last_cursor`
	AND NOT EXISTS (
		SELECT 1 FROM `cognitive_checkpoint_claims`
		WHERE `thread_id` = OLD.`id`
			AND `cursor_from` = OLD.`last_cursor`
			AND `cursor_to` = NEW.`last_cursor`
	)
BEGIN
	SELECT RAISE(ABORT, 'cognitive cursor advanced without an atomic claim');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_heads_transition_insert`
BEFORE INSERT ON `cognitive_heads`
WHEN NOT EXISTS (
	SELECT 1 FROM `cognitive_head_transitions`
	WHERE `mission_id` = NEW.`mission_id`
		AND `previous_revision` = 0
		AND `next_revision` = NEW.`revision`
		AND `version_id` = NEW.`ratified_version_id`
)
BEGIN
	SELECT RAISE(ABORT, 'cognitive head lacks an atomic transition');
END;
--> statement-breakpoint
CREATE TRIGGER `cognitive_heads_transition_update`
BEFORE UPDATE ON `cognitive_heads`
WHEN NOT EXISTS (
	SELECT 1 FROM `cognitive_head_transitions`
	WHERE `mission_id` = OLD.`mission_id`
		AND `previous_revision` = OLD.`revision`
		AND `next_revision` = NEW.`revision`
		AND `version_id` = NEW.`ratified_version_id`
)
BEGIN
	SELECT RAISE(ABORT, 'cognitive head lacks an atomic transition');
END;
--> statement-breakpoint
-- The GO Society alpha owner explicitly approved this bounded append-only
-- authority transition for Cognitive Bridge v0.5. No other grant is changed.
UPDATE `authority_grants`
SET `revoked_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE `id` = 'authority-member-' || (SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1) || '-v050'
	AND `revoked_at` IS NULL
	AND EXISTS (SELECT 1 FROM json_each(`authority_grants`.`allowed_actions`) WHERE json_each.value = 'custom:manage_membership')
	AND NOT EXISTS (SELECT 1 FROM `authority_grants` AS `new_grant` WHERE `new_grant`.`id` = `authority_grants`.`id` || '-cognitive-r1');
--> statement-breakpoint
INSERT OR IGNORE INTO `authority_grants` (
	`id`, `grantor`, `grantee`, `accountable_human`, `scope`,
	`allowed_actions`, `prohibited_actions`, `resource_rights`, `limits`,
	`reversibility_ceiling`, `evidence_obligations`, `escalation`,
	`conflict_rules`, `valid_from`, `expires_at`, `revoked_at`,
	`revision`, `self_expansion_allowed`, `created_at`
)
SELECT
	`id` || '-cognitive-r1', `grantor`, `grantee`, `accountable_human`,
	'Operate the bounded GO Society alpha and its private Cognitive Bridge. Agents remain candidate-only; named human review is required for every cognitive head transition.',
	'["create_evidence","create_exception","create_cognitive_event","create_deliberation_session","create_learning_record","create_evolution_proposal","approve_evolution_proposal","create_cognitive_commit","create_cognitive_version","update_mission","custom:capture_cognitive_source","custom:read_cognitive_context","custom:review_cognition","custom:manage_membership"]',
	`prohibited_actions`, `resource_rights`, `limits`, `reversibility_ceiling`,
	'["Keep Narrative Anchors distinct from Reality Evidence; preserve provenance, consent, uncertainty and decision impact."]',
	'["Escalate actions outside the grant, private source boundary, cognitive head or reversibility ceiling."]',
	`conflict_rules`, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), `expires_at`, NULL,
	`revision` + 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `authority_grants`
WHERE `id` = 'authority-member-' || (SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1) || '-v050'
	AND `revoked_at` IS NOT NULL
	AND ABS((julianday('now') - julianday(`revoked_at`)) * 86400) < 5
	AND EXISTS (SELECT 1 FROM json_each(`authority_grants`.`allowed_actions`) WHERE json_each.value = 'custom:manage_membership');
