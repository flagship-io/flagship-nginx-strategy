import fetch from "node-fetch";

export default class Flagship {

  //initialize a property to store the decision object
  decision = null;

  // constructor function to set envId and apiKey properties
  constructor(envId, apiKey) {
    this.envId = envId;
    this.apiKey = apiKey;
  }

  //Make a POST request to the Flagship Decision API and retrieve the decisions for the visitor.
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

      //check if response is not ok
      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      //store the decision object and return it
      this.decision = await response.json();
      return this.decision;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  //return the decision object
  getDecision() {
    return this.decision;
  }

  // create a hash key for caching the decisions
  getHashKey() {
    if (this.decision == null) {
      return false;
    }
    const experiences = [];

    //iterate over the decision object
    for (const flag of Object.entries(this.decision)) {
      experiences[flag[1].metadata?.campaignId] = flag[1].metadata?.variationId;
    }

    return Object.keys(experiences)
      .map(key => `${key}:${experiences[key]}`)
      .join('|');
  }

  //returns the value of the flag specified by the key.
  //if the key not exists it returns the defaultValue
  getFlag(key, defaultValue) {
    if (this.decision === null || !this.decision[key]) {
      return defaultValue;
    }
    return this.decision[key].value;
  }

  // generate a visitorID 
  generateUID() {
    return `varnish-v${Math.floor(Math.random() * 1000000)}`;
  }
}
