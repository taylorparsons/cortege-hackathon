import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export class FraudCaseStore {
  constructor(dataDir = 'data/fraud-cases') {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async createCase({ household_id, event_id, evidence, analysis, linked_event = null }) {
    const fraudCase = {
      case_id: `case_${randomUUID().slice(0, 8)}`,
      household_id,
      event_id,
      evidence,
      analysis,
      linked_event,
      created_at: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(this.dataDir, `${fraudCase.case_id}.json`),
      JSON.stringify(fraudCase, null, 2)
    );

    return fraudCase;
  }

  async listCases(householdId) {
    const files = fs.readdirSync(this.dataDir).filter((file) => file.endsWith('.json'));
    const cases = files.map((file) => JSON.parse(
      fs.readFileSync(path.join(this.dataDir, file), 'utf8')
    ));

    return cases
      .filter((fraudCase) => !householdId || fraudCase.household_id === householdId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export default FraudCaseStore;
