const SIGNAL_PATTERNS = {
  urgency: /\b(urgent|immediately|right now|asap|now|locked|suspended|final notice)\b/i,
  secrecy: /\b(don't tell|do not tell|keep this secret|secret|private)\b/i,
  payment_pressure: /\b(gift card|wire transfer|bank transfer|bitcoin|crypto|payment|send money|pay now)\b/i,
  impersonation: /\b(bank|irs|medicare|support|daughter|son|grandson|granddaughter|family|account team)\b/i,
  suspicious_link: /\b(https?:\/\/|www\.|bit\.ly|tinyurl|secure-login|verify-account|account-secure|login)\b/i,
};

function collectText({ event, evidence }) {
  return [
    evidence?.content,
    event?.payload?.caller_name,
    event?.payload?.transcript,
    event?.payload?.body,
    event?.payload?.subject,
  ].filter(Boolean).join(' ');
}

function recommendedAction(severity) {
  if (severity === 'high') {
    return 'Do not engage. Verify through a known-good number and alert the household.';
  }
  if (severity === 'medium') {
    return 'Pause and verify the request through a known-good channel before responding.';
  }
  return 'Log the interaction and verify identity before sharing money or sensitive information.';
}

export function analyzeFraudCase({ event, evidence, household = null }) {
  const text = collectText({ event, evidence });
  const signals = [];
  let score = 0;

  for (const [signal, pattern] of Object.entries(SIGNAL_PATTERNS)) {
    if (pattern.test(text)) {
      signals.push(signal);
      score += signal === 'payment_pressure' || signal === 'suspicious_link' ? 2 : 1;
    }
  }

  if (event?.source === 'twilio' && event?.payload?.from) {
    signals.push('live_call');
  }
  if (household?.twilio_number && event?.payload?.to === household.twilio_number) {
    signals.push('household_match');
  }

  const uniqueSignals = [...new Set(signals)];
  const severity = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  const rationale = uniqueSignals.length > 0
    ? `Observed risk signals: ${uniqueSignals.join(', ')}. This is a heuristic household-risk summary, not a definitive fraud verdict.`
    : 'Limited signals were found. Treat this as a verification prompt, not a definitive fraud verdict.';

  return {
    severity,
    score,
    signals: uniqueSignals,
    rationale,
    recommended_action: recommendedAction(severity),
  };
}

export default analyzeFraudCase;
