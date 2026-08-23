/**
 * Compatibility export for the v0.3.1 module path.
 *
 * v0.5 has one canonical AuthorityGrant contract and evaluator. New code
 * should import from `./authority-grants`; this file remains so historical
 * imports do not silently acquire a second, weaker authority model.
 */
export {
  authorityGrantSchema,
  canPerformAction,
  findUnambiguousActiveGrant,
  hasUnambiguousAuthority,
  isGrantActiveForActor,
  parseAuthorityGrant,
} from "./authority-grants";
export type {
  AuthorityAction,
  AuthorityCheckRequest,
  AuthorityGrant,
  AuthorityLimits,
  AuthorityResourceRights,
} from "./authority-grants";
