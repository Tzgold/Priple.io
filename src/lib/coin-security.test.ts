import assert from "node:assert/strict";
import { buildSecurityDesk } from "./coin-analysis";
import type { TokenSecurity } from "./token-info";

const clean: TokenSecurity = {
  gtScore: 78,
  verified: true,
  mintAuthority: "false",
  freezeAuthority: "null",
  isHoneypot: false,
  developerHoldingPct: 2.5,
};

const cleanDesk = buildSecurityDesk(clean);
assert.equal(cleanDesk.level, "low");
assert.equal(cleanDesk.checks.find((c) => c.id === "honeypot")?.status, "pass");
assert.equal(cleanDesk.checks.find((c) => c.id === "mint")?.status, "pass");
assert.equal(cleanDesk.checks.find((c) => c.id === "freeze")?.status, "pass");
assert.match(cleanDesk.gtScoreLabel, /78/);

const bad: TokenSecurity = {
  gtScore: 22,
  verified: false,
  mintAuthority: "SomeMintPubkey11111111111111111111111111111",
  freezeAuthority: "false",
  isHoneypot: "true",
  developerHoldingPct: 25,
};

const badDesk = buildSecurityDesk(bad);
assert.equal(badDesk.level, "high");
assert.equal(badDesk.checks.find((c) => c.id === "honeypot")?.status, "fail");
assert.equal(badDesk.checks.find((c) => c.id === "mint")?.status, "fail");
assert.equal(badDesk.checks.find((c) => c.id === "gtScore")?.status, "fail");
assert.equal(badDesk.checks.find((c) => c.id === "devHolding")?.status, "fail");

const missing = buildSecurityDesk(null);
assert.equal(missing.level, "unknown");
assert.match(missing.summary, /not available/i);

const cex = buildSecurityDesk(null, { cexMajor: true });
assert.equal(cex.level, "unknown");
assert.match(cex.summary, /CEX/i);

console.log("coin-security tests passed");
