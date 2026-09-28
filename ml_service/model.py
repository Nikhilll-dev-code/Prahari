import os
import re
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.calibration import CalibratedClassifierCV

# Recognized SIF Hazard Categories per SRS Section 1.3
HAZARD_CATEGORIES = [
    "Work at Height",
    "Line-of-Fire",
    "Confined Space",
    "LOTO Bypass",
    "Struck-By",
    "Uncontrolled Energy",
    "PPE Non-Compliance",
    "Housekeeping"
]

# High SIF Energy Precursor Indicator Rules & Keywords for domain-grounded scoring
SIF_KEYWORD_PATTERNS = {
    "Work at Height": [
        r"scaffold(?:ing)?", r"guard\s*rail", r"harness", r"fall\s*arrest", r"ladder",
        r"height", r"elevat(?:ed|ion)", r"derrick\s*mast", r"monkey\s*board", r"working\s*at\s*height",
        r"catwalk", r"man\s*basket", r"aerial\s*work", r"edge\s*protection", r"safety\s*line"
    ],
    "Line-of-Fire": [
        r"line\s*of\s*fire", r"rotary\s*table", r"swing\s*radius", r"whip\s*check", r"pressuriz(?:ed)?\s*hose",
        r"winch\s*line", r"high\s*tension", r"pinch\s*point", r"snubbing\s*unit", r"iron\s*roughneck",
        r"suspended\s*load", r"wireline\s*break", r"kick\s*back", r"rotating\s*equipment"
    ],
    "Confined Space": [
        r"confined\s*space", r"crude\s*tank", r"storage\s*tank", r"separator\s*vessel", r"manhole",
        r"gas\s*test", r"oxygen\s*deficien(?:t|cy)", r"toxic\s*fumes", r"entry\s*permit", r"standby\s*person",
        r"sump\s*pit", r"trench\s*entry", r"vessel\s*inspection", r"atmosphere\s*test"
    ],
    "LOTO Bypass": [
        r"loto", r"lock\s*out", r"tag\s*out", r"isolation", r"live\s*circuit", r"mcc\s*panel",
        r"415\s*v", r"high\s*voltage", r"energiz(?:ed)?", r"breaker\s*bypass", r"switchgear",
        r"electrical\s*work", r"live\s*feeder", r"lockout\s*padlock", r"valve\s*tagging"
    ],
    "Struck-By": [
        r"struck\s*by", r"dropped\s*object", r"crane\s*lift", r"derrick\s*drop", r"pipe\s*rack",
        r"heavy\s*flange", r"casing\s*elevator", r"forklift", r"overhead\s*load", r"drill\s*collar",
        r"sling\s*failure", r"hoist\s*cable", r"shackle", r"rig\s*floor\s*impact"
    ],
    "Uncontrolled Energy": [
        r"blowout", r"gas\s*leak", r"h2s", r"hydrocarbon", r"high\s*pressure", r"wellhead",
        r"christmas\s*tree", r"bop", r"flange\s*leak", r"steam\s*leak", r"psi", r"kick\s*detection",
        r"mud\s*surge", r"flare\s*pit", r"uncontrolled\s*release", r"pipeline\s*rupture", r"crude\s*spill\s*pressur"
    ],
    "PPE Non-Compliance": [
        r"no\s*ppe", r"no\s*harness", r"without\s*harness", r"face\s*shield", r"breathing\s*apparatus",
        r"escape\s*ba", r"flame\s*retardant", r"safety\s*goggles", r"without\s*helmet", r"no\s*ear\s*plug"
    ],
    "Housekeeping": [
        r"water\s*puddle", r"housekeeping", r"untidy", r"spill\s*water", r"trash", r"dustbin",
        r"sweeping", r"corridor\s*floor", r"tea\s*cup", r"stationery", r"cardboard\s*box", r"slippery\s*office"
    ]
}

# Domain-specific labeled synthetic training samples for Oil India Limited operations
TRAINING_DATA = [
    # High-Risk SIF Precursors (Severity is often disguised as 'Low' by reporter in real logs)
    ("Found scaffolding without a guardrail near tank 4; contractor was standing on it while no harness was worn.", "Work at Height", 88),
    ("Contractor observed standing on top of crude storage tank roof without safety harness or fall arrest lanyard attached to lifeline.", "Work at Height", 92),
    ("Technician climbed up the derrick mast ladder without engaging the fall arrestor sleeve on the safety climb cable.", "Work at Height", 86),
    ("Erected temporary scaffolding on rig floor has missing toe-boards and top rails at 6-meter elevation while workers are painting structure.", "Work at Height", 84),
    ("Painter working on pipe rack elevation at 4.5 meters using an unsecured wooden ladder placed on uneven muddy ground.", "Work at Height", 79),
    ("Man-basket hoisted by mobile crane was swaying violently in high wind near drilling mast with two riggers inside unclipped.", "Work at Height", 94),
    
    ("Roughneck was standing directly in rotary table swing radius while drill string was being hoisted under heavy tension.", "Line-of-Fire", 90),
    ("Operator positioned himself in line of fire of pressurized mud hose with missing whip-check safety cable during pump startup.", "Line-of-Fire", 87),
    ("Worker stood directly behind high-tension winch wire rope while pulling casing pipe into V-door on rig floor.", "Line-of-Fire", 91),
    ("Assistant driller stood in pinch point between iron roughneck and rotary table while torque was being applied to drill collar.", "Line-of-Fire", 89),
    ("Mechanic stood in swing zone of excavator bucket while trenching near live gas pipeline manifold.", "Line-of-Fire", 82),
    
    ("Two contract workers entered crude oil storage tank for sludge cleaning without gas test clearance and no continuous ventilation.", "Confined Space", 96),
    ("Maintenance crew entered low-pressure separator vessel with manway cover open but without atmospheric oxygen test and no standby attendant.", "Confined Space", 93),
    ("Technician climbed down into 2.5-meter deep valve inspection pit where hydrocarbon vapor smell was present without breathing apparatus.", "Confined Space", 89),
    ("Welder entered inside mud tank compartment to repair internal baffle without confined space entry permit and no buddy watch outside.", "Confined Space", 91),
    
    ("Electrician worked on 415V MCC feeder panel without applying lockout tagout padlock as isolation switch was stiff.", "LOTO Bypass", 94),
    ("Mechanic started dismantling pump impeller on crude dispatch pump while suction valve was not positively isolated and tag not placed.", "LOTO Bypass", 88),
    ("Technician bypassed electrical interlock on compressor control panel while testing live 3.3kV switchgear circuit.", "LOTO Bypass", 95),
    ("Maintenance supervisor authorized pipeline valve flange opening without verifying zero energy state and absence of residual line pressure.", "LOTO Bypass", 92),
    ("Instrument fitter troubleshooting gas detector sensor removed barrier tape and energized live terminal block in hazardous Zone-1 area.", "LOTO Bypass", 86),
    
    ("Unsecured heavy flange wrench fell from derrick monkey board 18 meters above rig floor, landing 1 meter from driller console.", "Struck-By", 95),
    ("Crane sling showed frayed steel strands while lifting 3-ton drill collar over active work area on pipe deck.", "Struck-By", 93),
    ("Casing pipe rolled off storage rack toward pedestrian walkway because stop chocks were not placed on pipe rack tier.", "Struck-By", 85),
    ("Dropped 2-inch steel hammer union nut from top platform during vibration on high pressure cementing line near personnel.", "Struck-By", 88),
    ("Forklift moving high pressure blowout preventer component reversed rapidly into blinded blind spot near workshop doorway.", "Struck-By", 81),
    
    ("Observed weeping valve gland packing with continuous hydrocarbon hiss on high pressure wellhead Christmas tree at 3000 PSI.", "Uncontrolled Energy", 95),
    ("H2S portable gas monitor alarmed at 15 PPM near wellhead manifold; operator continued work without donning escape BA set.", "Uncontrolled Energy", 96),
    ("Thermal relief valve on condensate discharge line failed to seat, releasing flammable vapor cloud near boiler area.", "Uncontrolled Energy", 93),
    ("Pressure gauge on mud standpipe spiked suddenly beyond operating limit without overpressure relief valve opening during drilling.", "Uncontrolled Energy", 90),
    ("Subsea blowout preventer accumulator pressure dropped by 400 PSI during hydraulic integrity pressure test on test stump.", "Uncontrolled Energy", 91),
    ("Noticeable pinhole gas leak bubbling through valve sealant on 8-inch high pressure natural gas delivery line near flare header.", "Uncontrolled Energy", 89),

    # Medium Risk Reports (Precursor elements present, moderate exposure or partial controls in place)
    ("Welder grinding pipe support inside fabrication yard without wearing full face shield, using only safety spectacles.", "PPE Non-Compliance", 56),
    ("Technician handling hydrocarbon solvent during pump overhaul without chemical resistant nitrile gloves, skin contact noted.", "PPE Non-Compliance", 48),
    ("Contractor walking across rig yard roadway without reflective high-visibility vest during night shift operations.", "PPE Non-Compliance", 45),
    ("Operator left portable gas detector on workbench inside control room while conducting routine outdoor battery walk-through.", "PPE Non-Compliance", 58),
    ("Safety helmet chin strap unfastened while operating vibrating shaker screen in drilling mud area.", "PPE Non-Compliance", 42),
    ("Electrician's insulated gloves found stored in open toolbox with cracks on surface, required replacement before 230V check.", "PPE Non-Compliance", 52),
    ("Loose electrical extension cord trailing across walkway near workshop bench creating a tripping hazard near power tools.", "LOTO Bypass", 49),
    ("Fire extinguisher in chemical storage bay had inspection tag overdue by 3 weeks, pressure gauge still in green zone.", "Uncontrolled Energy", 44),
    ("Flange insulation jacket displaced on hot steam tracer line, surface temperature elevated to 65C near access walkway.", "Uncontrolled Energy", 46),
    ("Crane hook safety latch spring was weak and did not close automatically unless pushed manually by rigger.", "Struck-By", 55),
    ("Portable ladder stored upright against workshop wall without securing chain or base rubber boots.", "Work at Height", 50),

    # Low Risk Reports (Routine housekeeping, minor administrative, non-SIF conditions)
    ("Small water puddle noticed near administrative corridor entrance due to AC drain overflow in office building.", "Housekeeping", 12),
    ("Office pantry trash bin was overflowing with empty paper tea cups and cardboard snack packets.", "Housekeeping", 8),
    ("Dustbin lid missing in the geological sample archive room, room floor swept and dry.", "Housekeeping", 10),
    ("Whiteboard markers in shift handover briefing room were dried out and replaced from stationery store.", "Housekeeping", 5),
    ("Cardboard carton boxes stacked in photocopier room corner obstructing spare paper ream rack.", "Housekeeping", 14),
    ("Slight oil smudge observed on outer casing of parked non-operational tractor in open grass yard.", "Housekeeping", 18),
    ("Notice board glass frame had fingerprint smudges in front lobby of regional administrative building.", "Housekeeping", 6),
    ("Minor water leakage from garden hose tap outside security guard gate house causing small wet patch on lawn.", "Housekeeping", 11),
    ("Clean empty wooden packing crates left beside warehouse loading bay after unloading office furniture.", "Housekeeping", 15),
    ("Defective ceiling tube light flickering in 2nd floor finance department hallway.", "Housekeeping", 12)
]

class SIFClassifierEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=3000, lowercase=True, stop_words='english')
        self.hazard_model = LogisticRegression(max_iter=1000, C=2.0, class_weight='balanced')
        self.trained = False
        self._train()

    def _train(self):
        texts = [item[0] for item in TRAINING_DATA]
        hazards = [item[1] for item in TRAINING_DATA]
        
        X_vec = self.vectorizer.fit_transform(texts)
        self.hazard_model.fit(X_vec, hazards)
        self.trained = True

    def _extract_sif_rules(self, text: str) -> Tuple[Dict[str, int], List[str], int]:
        """Check text against SIF domain rules, return matched categories, matched terms, and base rule score."""
        text_lower = text.lower()
        matched_categories = {}
        matched_terms = []
        rule_score_boost = 0

        for category, patterns in SIF_KEYWORD_PATTERNS.items():
            cat_matches = 0
            for pattern in patterns:
                matches = re.findall(pattern, text_lower)
                if matches:
                    cat_matches += len(matches)
                    # Find exact substring span for explainability
                    for m in re.finditer(pattern, text, re.IGNORECASE):
                        term = m.group(0).strip()
                        if term and term not in matched_terms:
                            matched_terms.append(term)
            if cat_matches > 0:
                matched_categories[category] = cat_matches

        # SIF Severity Energy heuristics
        # Work at Height, LOTO, Confined Space, Line of Fire, High Pressure / H2S have innate fatality potential
        fatal_cats = ["Work at Height", "Confined Space", "LOTO Bypass", "Uncontrolled Energy", "Line-of-Fire", "Struck-By"]
        
        high_energy_triggers = [
            r"without\s+harness", r"no\s+harness", r"without\s+gas\s+test", r"without\s+lockout", r"without\s+loto",
            r"standing\s+on", r"rotary\s+table", r"h2s", r"3000\s*psi", r"fell\s+from", r"swing\s+radius",
            r"missing\s+guardrail", r"without\s+isolation", r"live\s*circuit", r"live\s*feeder", r"frayed\s+steel",
            r"blowout", r"dropped\s+object", r"unsecured", r"fell"
        ]

        high_energy_count = 0
        for trigger in high_energy_triggers:
            if re.search(trigger, text_lower):
                high_energy_count += 1
                for m in re.finditer(trigger, text, re.IGNORECASE):
                    term = m.group(0).strip()
                    if term and term not in matched_terms:
                        matched_terms.append(term)

        # Base rule scoring
        if any(cat in matched_categories for cat in fatal_cats):
            rule_score_boost += 50
            if high_energy_count > 0:
                rule_score_boost += min(35, high_energy_count * 15)
        elif "PPE Non-Compliance" in matched_categories:
            rule_score_boost += 40 + min(20, high_energy_count * 10)
        elif "Housekeeping" in matched_categories:
            rule_score_boost += 10

        return matched_categories, matched_terms, rule_score_boost

    def classify(self, text: str) -> Dict[str, Any]:
        """
        Classifies input report text and returns:
        - risk_score (0-100)
        - risk_band (High | Medium | Low | Needs Manual Review)
        - hazard_primary
        - hazard_secondary
        - explainability_terms
        - is_manual_review
        """
        words = text.strip().split()
        word_count = len(words)
        
        # Edge case EC-1 / FR-2.6: shorter than 10 words -> Needs Manual Review
        if word_count < 10:
            return {
                "risk_score": None,
                "risk_band": "Needs Manual Review",
                "hazard_primary": "Undetermined",
                "hazard_secondary": [],
                "explainability_terms": [],
                "is_manual_review": True,
                "reason": "Report description contains fewer than 10 words (validation rule FR-2.6 / EC-1)."
            }

        # Vectorize and predict probabilities with ML Model
        X = self.vectorizer.transform([text])
        probs = self.hazard_model.predict_proba(X)[0]
        classes = self.hazard_model.classes_

        # Rank categories by ML probability
        cat_probs = {cls: float(prob) for cls, prob in zip(classes, probs)}
        sorted_cats = sorted(cat_probs.items(), key=lambda x: x[1], reverse=True)

        matched_categories, matched_terms, rule_score_boost = self._extract_sif_rules(text)

        # Primary hazard category determination
        if matched_categories:
            # Pick highest matched category that is also strongly supported
            primary_cat = max(matched_categories.items(), key=lambda x: x[1])[0]
        else:
            primary_cat = sorted_cats[0][0]

        # Secondary hazard categories (up to 2)
        secondary_cats = []
        for cat, _ in sorted_cats:
            if cat != primary_cat and cat != "Housekeeping" and (cat in matched_categories or cat_probs[cat] > 0.20):
                secondary_cats.append(cat)
                if len(secondary_cats) >= 2:
                    break

        # Calculate Calibrated SIF Risk Score (0-100)
        if primary_cat in ["Work at Height", "Confined Space", "LOTO Bypass", "Uncontrolled Energy", "Line-of-Fire", "Struck-By"]:
            # Fatality Mode SIF precursor
            base_score = 70 + (cat_probs.get(primary_cat, 0.5) * 18)
            if rule_score_boost >= 65:
                base_score += 10
            risk_score = int(np.clip(base_score, 72, 98))
        elif primary_cat == "PPE Non-Compliance":
            risk_score = int(np.clip(40 + (cat_probs.get(primary_cat, 0.5) * 25), 42, 68))
        else: # Housekeeping / Routine
            risk_score = int(np.clip(8 + (cat_probs.get("Housekeeping", 0.5) * 20), 5, 35))

        # Determine Risk Band per FR-2.5
        if risk_score >= 70:
            risk_band = "High"
        elif risk_score >= 40:
            risk_band = "Medium"
        else:
            risk_band = "Low"

        # Model feature explainability
        # Extract top contributing TF-IDF terms
        feature_names = np.array(self.vectorizer.get_feature_names_out())
        row_vec = X.toarray()[0]
        top_indices = np.argsort(row_vec)[::-1]
        
        for idx in top_indices:
            if row_vec[idx] > 0:
                feat_name = feature_names[idx]
                if feat_name not in [t.lower() for t in matched_terms] and len(feat_name) > 3:
                    matched_terms.append(feat_name)
            if len(matched_terms) >= 6:
                break

        # Clean explainability terms
        explainability_terms = list(dict.fromkeys(matched_terms))[:8]

        return {
            "risk_score": risk_score,
            "risk_band": risk_band,
            "hazard_primary": primary_cat,
            "hazard_secondary": secondary_cats,
            "explainability_terms": explainability_terms,
            "is_manual_review": False,
            "confidence": round(float(cat_probs.get(primary_cat, 0.85)), 3)
        }

# Global Singleton instance
engine = SIFClassifierEngine()
