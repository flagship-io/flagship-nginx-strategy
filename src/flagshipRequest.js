export default class Flagship {
  constructor(envId, apiKey) {
    this.envId = envId;
    this.apiKey = apiKey;
    this.decision = null;
  }

  async start(visitorID, context) {
    try {
      const response = await fetch(`https://decision.flagship.io/v2/${this.envId}/flags`, {
        method: 'POST',
        headers: {
          'Connection': 'keep-alive',
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitor_id: visitorID,
          context: context,
          trigger_hit: false,
        }),
      });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }
      this.decision = await response.json();
      return this.decision;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  getDecision() {
    return this.decision;
  }

  getHashKey() {
    if (this.decision == null) {
      return false;
    }
    const experiences = [];
    for (const flag of this.decision) {
      experiences[flag.metadata.campaignId] = flag.metadata.variationId;
    }

    return Object.keys(experiences)
      .map(key => `${key}:${experiences[key]}`)
      .join('|');
  }

  getFlag(key, defaultValue) {
    if (this.decision === null || !this.decision[key]) {
      return defaultValue;
    }
    return this.decision[key].value;
  }

  generateUID() {
    return `varnish-v${Math.floor(Math.random() * 1000000)}`;
  }
}

