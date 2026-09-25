/**
 * AI / NLP Distress Call Processor & Fleet Advisor
 * Extracts structured intelligence from free-form captain distress messages:
 * - severity (CRITICAL, HIGH, MEDIUM, LOW)
 * - incidentType (e.g., Drone / Missile Attack, Hull Breach, Engine Failure, Fire, Medical, Piracy)
 * - quantifiableImpact (casualties, injuries, hull damage %, fuel loss, propulsion lost, sinking risk)
 * - recommendedAction
 *
 * Supports Gemini API / OpenAI API when key is available,
 * with a high-fidelity local deterministic NLP rule engine for 100% reliable offline operation.
 */

export async function parseDistressMessage(messageText, ship) {
  const text = (messageText || '').trim();
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (apiKey && text.length > 5) {
    try {
      const prompt = `You are a real-time maritime crisis AI analyst. Analyze this distress message from captain of cargo ship "${ship?.name || 'Vessel'}" carrying "${ship?.cargo || 'cargo'}":
Distress text: "${text}"

Respond ONLY with valid JSON conforming to this schema:
{
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "incidentType": "string describing type of crisis",
  "summary": "1 sentence operational summary",
  "quantifiableImpact": {
    "injuries": number,
    "fatalities": number,
    "damagePercent": number,
    "propulsionLost": boolean,
    "sinkingRisk": boolean,
    "fuelLeak": boolean
  },
  "recommendedAction": "Concrete tactical directive for Fleet Command"
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const data = await res.json();
        const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonStr) {
          const cleanJson = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          console.log('[Gemini 2.5 Flash AI] Real-time distress triage complete:', parsed.incidentType, `(${parsed.severity})`);
          return parsed;
        }
      } else {
        console.warn(`[Gemini API] Returned status ${res.status} ${res.statusText}, falling back to local NLP.`);
      }
    } catch (err) {
      console.warn('[Gemini API] Network/parsing notice, falling back to local NLP engine:', err.message);
    }
  }

  // Local deterministic NLP analysis engine (Fast, accurate, works offline on laptop)
  return runLocalNLPExtraction(text, ship);
}

function runLocalNLPExtraction(text, ship) {
  const lower = text.toLowerCase();

  // 1. Quantifiable Impact Extraction
  const injuryMatch = lower.match(/(\d+)\s*(crew|sailor|people|men|person|persons)?\s*(injured|hurt|wounded|casualties|casualty)/i) ||
                      lower.match(/(injured|wounded|hurt|casualties)\s*[:=]?\s*(\d+)/i);
  const fatalityMatch = lower.match(/(\d+)\s*(killed|dead|fatalities|deceased)/i) ||
                        lower.match(/(dead|fatalities)\s*[:=]?\s*(\d+)/i);
  const damageMatch = lower.match(/(\d+)%\s*(damage|hull|structural|flooding)/i) ||
                      lower.match(/(damage|loss)\s*[:=]?\s*(\d+)%/i);

  const injuries = injuryMatch ? parseInt(injuryMatch[1] || injuryMatch[2], 10) : 
                   (lower.includes('injured') || lower.includes('injury') ? 1 : 0);
  const fatalities = fatalityMatch ? parseInt(fatalityMatch[1] || fatalityMatch[2], 10) : 0;
  const damagePercent = damageMatch ? parseInt(damageMatch[1] || damageMatch[2], 10) : 
                        (lower.includes('heavy damage') || lower.includes('catastrophic') ? 75 : 
                         lower.includes('moderate damage') ? 40 : 20);

  const propulsionLost = lower.includes('propulsion') || lower.includes('engine') || lower.includes('blackout') || 
                         lower.includes('dead in water') || lower.includes('drifting') || lower.includes('no power');
  const sinkingRisk = lower.includes('sink') || lower.includes('taking on water') || lower.includes('flooding') || 
                      lower.includes('hull breach') || lower.includes('abandon ship');
  const fuelLeak = lower.includes('fuel leak') || lower.includes('losing fuel') || lower.includes('oil slick') || 
                   lower.includes('spill') || lower.includes('tank ruptured');

  // 2. Incident Category Identification
  let incidentType = 'General Maritime Distress';
  if (lower.includes('drone') || lower.includes('missile') || lower.includes('torpedo') || lower.includes('attack') || lower.includes('warship') || lower.includes('blockade')) {
    incidentType = 'Naval Hostility / Drone Strike';
  } else if (lower.includes('pirat') || lower.includes('boarded') || lower.includes('armed men') || lower.includes('hostage')) {
    incidentType = 'Armed Interception / Piracy';
  } else if (lower.includes('flood') || lower.includes('breach') || lower.includes('taking on water') || lower.includes('sink')) {
    incidentType = 'Severe Hull Breach & Flooding';
  } else if (lower.includes('fire') || lower.includes('explosion') || lower.includes('smoke')) {
    incidentType = 'Uncontrolled Fire in Cargo / Engine Room';
  } else if (lower.includes('engine') || lower.includes('blackout') || lower.includes('generator') || lower.includes('propeller')) {
    incidentType = 'Catastrophic Engine Failure / Blackout';
  } else if (lower.includes('medic') || lower.includes('injured') || lower.includes('doctor') || lower.includes('evac')) {
    incidentType = 'Critical Crew Medical Emergency';
  } else if (lower.includes('reef') || lower.includes('shallow') || lower.includes('grounded') || lower.includes('collision')) {
    incidentType = 'Collision / Vessel Grounding';
  }

  // 3. Severity Calculation
  let severity = 'MEDIUM';
  if (sinkingRisk || fatalities > 0 || incidentType.includes('Hostility') || damagePercent >= 60 || (propulsionLost && injuries > 0)) {
    severity = 'CRITICAL';
  } else if (injuries > 0 || propulsionLost || fuelLeak || incidentType.includes('Fire') || damagePercent >= 30) {
    severity = 'HIGH';
  } else if (lower.includes('minor') || lower.includes('advisory') || lower.includes('caution')) {
    severity = 'LOW';
  }

  // 4. Recommended Action Recommendation
  let recommendedAction = 'Maintain radio contact and stand by for fleet directive.';
  if (incidentType.includes('Hostility')) {
    recommendedAction = `Immediate evasive maneuvers outside active zone. Request naval coalition escort and prepare safe haven diversion.`;
  } else if (sinkingRisk) {
    recommendedAction = `Order crew to muster stations. Dispatch nearest fleet vessel for emergency SAR and life-raft assistance.`;
  } else if (propulsionLost) {
    recommendedAction = `Divert nearest capable fleet ship or request emergency tug assistance from closest accessible port.`;
  } else if (injuries > 0) {
    recommendedAction = `Prepare helipad/forward deck for emergency medevac. Re-route towards closest port with advanced trauma care.`;
  } else if (fuelLeak) {
    recommendedAction = `Seal auxiliary fuel valves. Flag insufficient fuel alert and adjust cruising speed to 8 knots for fuel preservation.`;
  }

  return {
    severity,
    incidentType,
    summary: `Ship ${ship?.name || 'Vessel'} reports ${incidentType.toLowerCase()} with ${injuries} injured and ${damagePercent}% structural damage.`,
    quantifiableImpact: {
      injuries,
      fatalities,
      damagePercent,
      propulsionLost,
      sinkingRisk,
      fuelLeak
    },
    recommendedAction,
    timestamp: Date.now()
  };
}

/**
 * Bonus: AI Fleet Advisor
 * Proactively inspects fleet state, active zones, weather, and proximity to suggest tactical actions.
 */
export function generateFleetAdvisorRecommendations(ships, zones, alerts, weatherData) {
  const recommendations = [];

  // Check vessels low on fuel
  for (const ship of ships) {
    if (ship.fuel < 1000 && ship.status !== 'stranded' && ship.status !== 'arrived') {
      recommendations.push({
        id: `adv-fuel-${ship.shipId}`,
        targetShipId: ship.shipId,
        type: 'FUEL_CRITICAL',
        title: `Low Fuel Alert for ${ship.name}`,
        reason: `Vessel has only ${Math.round(ship.fuel)} tons fuel remaining for journey to ${ship.destination}.`,
        suggestion: `Divert to closer intermediate port or throttle down speed to 10 knots to save 40% burn rate.`,
        actionType: 'REROUTE_PORT',
        priority: 'HIGH'
      });
    }
  }

  // Check distressed ships needing escort
  const distressedShips = ships.filter(s => s.status === 'distressed');
  for (const distressed of distressedShips) {
    // Find closest healthy ship
    let closestShip = null;
    let minDist = Infinity;
    for (const other of ships) {
      if (other.shipId !== distressed.shipId && other.status === 'normal') {
        const dLat = (other.position[0] - distressed.position[0]) * 111;
        const dLng = (other.position[1] - distressed.position[1]) * 111;
        const d = Math.sqrt(dLat * dLat + dLng * dLng);
        if (d < minDist) {
          minDist = d;
          closestShip = other;
        }
      }
    }

    if (closestShip && minDist < 80) {
      recommendations.push({
        id: `adv-escort-${distressed.shipId}`,
        targetShipId: closestShip.shipId,
        distressedShipId: distressed.shipId,
        type: 'MUTUAL_AID',
        title: `Task ${closestShip.name} to Assist ${distressed.name}`,
        reason: `${distressed.name} is in distress (${distressed.distressReason || 'Emergency'}). ${closestShip.name} is only ${minDist.toFixed(1)} km away.`,
        suggestion: `Issue waypoint diversion to ${closestShip.name} to rendezvous at [${distressed.position[0].toFixed(2)}, ${distressed.position[1].toFixed(2)}].`,
        actionType: 'DIVERT_WAYPOINT',
        coordinates: distressed.position,
        priority: 'CRITICAL'
      });
    }
  }

  return recommendations.slice(0, 4);
}
