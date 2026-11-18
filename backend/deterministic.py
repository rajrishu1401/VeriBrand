"""
Deterministic Rules Engine
Regex-based pattern matching for instant, explainable violations
Zero hallucination risk - every flag has exact source citation
"""

import re
from typing import List, Dict, Optional
from datetime import datetime

class DeterministicEngine:
    def __init__(self):
        """Initialize with default rule sets"""
        self.rules = {
            "banned_words": [],
            "superlatives": [],
            "required_disclaimers": [],
            "formatting": []
        }
        self.load_default_rules()
    
    def load_default_rules(self):
        """Load common brand compliance rules"""
        
        # Banned words that create legal/trust issues
        self.rules["banned_words"] = [
            {
                "pattern": r"\b(guarantee|guaranteed)\b",
                "severity": "high",
                "reason": "Absolute claims create legal liability",
                "citation": "Section 2.3: Avoid Absolute Claims"
            },
            {
                "pattern": r"\b(always|never|every time)\b",
                "severity": "medium",
                "reason": "Absolute terms are unprovable and damage credibility",
                "citation": "Section 2.3: Avoid Absolute Claims"
            },
            {
                "pattern": r"\b(free|totally free|100% free)\b",
                "severity": "high",
                "reason": "Free claims require explicit terms disclosure",
                "citation": "Section 3.1: Pricing Language"
            }
        ]
        
        # Superlatives require evidence
        self.rules["superlatives"] = [
            {
                "pattern": r"\b(best|greatest|most|fastest|leading|top|#1|number one)\b",
                "severity": "high",
                "reason": "Superlatives require verifiable evidence citation",
                "citation": "Section 2.4: Evidence-Based Claims"
            },
            {
                "pattern": r"\b(revolutionary|game-?changing|unprecedented|unmatched)\b",
                "severity": "medium",
                "reason": "Hyperbolic terms undermine brand credibility",
                "citation": "Section 2.2: Professional Tone"
            }
        ]
        
        # Required disclaimers
        self.rules["required_disclaimers"] = [
            {
                "pattern": r"\b(results|outcome|performance)\b",
                "requires": "results may vary",
                "severity": "medium",
                "reason": "Performance claims require disclaimer",
                "citation": "Section 3.2: Disclaimers"
            }
        ]
        
        # Formatting rules
        self.rules["formatting"] = [
            {
                "pattern": r"[A-Z]{4,}",  # All caps > 3 chars
                "severity": "low",
                "reason": "Excessive capitalization appears unprofessional",
                "citation": "Section 4.1: Typography"
            },
            {
                "pattern": r"!{2,}",  # Multiple exclamation marks
                "severity": "low",
                "reason": "Multiple exclamation marks appear unprofessional",
                "citation": "Section 4.2: Punctuation"
            }
        ]
    
    def add_custom_rule(
        self, 
        category: str, 
        pattern: str, 
        severity: str, 
        reason: str, 
        citation: str
    ):
        """Add custom rule from uploaded brand guideline"""
        if category not in self.rules:
            self.rules[category] = []
        
        self.rules[category].append({
            "pattern": pattern,
            "severity": severity,
            "reason": reason,
            "citation": citation
        })
    
    def extract_rules(self, guideline_text: str) -> int:
        """
        Parse brand guideline text to extract deterministic rules
        Looks for explicit patterns like "never use", "avoid", bulleted quotes, etc.
        """
        rules_found = 0
        seen_phrases = set()
        
        # Pattern 1: "Never use [word/phrase]"
        never_patterns = re.findall(
            r"never use [^\n'\"]*['\"]([^'\"]+)['\"]",
            guideline_text,
            re.IGNORECASE
        )
        for phrase in never_patterns:
            clean = phrase.strip().lower()
            if clean and clean not in seen_phrases:
                seen_phrases.add(clean)
                self.add_custom_rule(
                    category="banned_words",
                    pattern=rf"\b{re.escape(phrase.strip())}\b",
                    severity="high",
                    reason="Explicitly prohibited in brand guidelines",
                    citation="Guideline: Direct Prohibition"
                )
                rules_found += 1
        
        # Pattern 2: "Avoid [word/phrase]"
        avoid_patterns = re.findall(
            r"avoid [^\n'\"]*['\"]([^'\"]+)['\"]",
            guideline_text,
            re.IGNORECASE
        )
        for phrase in avoid_patterns:
            clean = phrase.strip().lower()
            if clean and clean not in seen_phrases:
                seen_phrases.add(clean)
                self.add_custom_rule(
                    category="banned_words",
                    pattern=rf"\b{re.escape(phrase.strip())}\b",
                    severity="medium",
                    reason="Discouraged in brand guidelines",
                    citation="Guideline: Avoidance Recommendation"
                )
                rules_found += 1
        
        # Pattern 3: Bullet points with quotes like - "word" or - "phrase"
        bullet_quotes = re.findall(
            r"^\s*[-*•]\s*['\"]([^'\"]+)['\"]",
            guideline_text,
            re.MULTILINE
        )
        for phrase in bullet_quotes:
            clean = phrase.strip().lower()
            if clean and len(clean) > 1 and clean not in seen_phrases:
                seen_phrases.add(clean)
                self.add_custom_rule(
                    category="banned_words",
                    pattern=rf"\b{re.escape(phrase.strip())}\b",
                    severity="high",
                    reason="Listed as prohibited or restricted term in guidelines",
                    citation="Guideline: Term Rule"
                )
                rules_found += 1

        # Pattern 4: "Always include [word/phrase]"
        always_patterns = re.findall(
            r"always include [^\n'\"]*['\"]([^'\"]+)['\"]",
            guideline_text,
            re.IGNORECASE
        )
        for phrase in always_patterns:
            clean = phrase.strip().lower()
            if clean and clean not in seen_phrases:
                seen_phrases.add(clean)
                self.add_custom_rule(
                    category="required_disclaimers",
                    pattern=rf"\b{re.escape(phrase.strip())}\b",
                    severity="medium",
                    reason="Required by brand guidelines",
                    citation="Guideline: Mandatory Inclusion"
                )
                rules_found += 1
        
        return rules_found
    
    def check(self, content: str) -> List[Dict[str, any]]:
        """
        Run deterministic audit on content
        Returns list of violations with exact pattern matches
        """
        violations = []
        
        # Check banned words
        for rule in self.rules["banned_words"]:
            matches = list(re.finditer(rule["pattern"], content, re.IGNORECASE))
            if matches:
                for match in matches:
                    violations.append({
                        "violation_type": "Banned Word",
                        "description": f"Found prohibited term: '{match.group()}'",
                        "matched_text": match.group(),
                        "position": match.span(),
                        "severity": rule["severity"],
                        "reason": rule["reason"],
                        "citation": rule["citation"],
                        "suggestion": f"Remove or replace '{match.group()}' with evidence-based language"
                    })
        
        # Check superlatives
        for rule in self.rules["superlatives"]:
            matches = list(re.finditer(rule["pattern"], content, re.IGNORECASE))
            if matches:
                for match in matches:
                    violations.append({
                        "violation_type": "Unsupported Superlative",
                        "description": f"Superlative claim requires evidence: '{match.group()}'",
                        "matched_text": match.group(),
                        "position": match.span(),
                        "severity": rule["severity"],
                        "reason": rule["reason"],
                        "citation": rule["citation"],
                        "suggestion": f"Add citation or replace '{match.group()}' with specific, measurable claim"
                    })
        
        # Check required disclaimers
        for rule in self.rules["required_disclaimers"]:
            if re.search(rule["pattern"], content, re.IGNORECASE):
                if not re.search(rule["requires"], content, re.IGNORECASE):
                    violations.append({
                        "violation_type": "Missing Disclaimer",
                        "description": f"Content mentions {rule['pattern']} but lacks required disclaimer",
                        "matched_text": None,
                        "position": None,
                        "severity": rule["severity"],
                        "reason": rule["reason"],
                        "citation": rule["citation"],
                        "suggestion": f"Add disclaimer: '{rule['requires']}'"
                    })
        
        # Check formatting
        for rule in self.rules["formatting"]:
            matches = list(re.finditer(rule["pattern"], content))
            if matches:
                for match in matches:
                    violations.append({
                        "violation_type": "Formatting Issue",
                        "description": f"Formatting violation: '{match.group()}'",
                        "matched_text": match.group(),
                        "position": match.span(),
                        "severity": rule["severity"],
                        "reason": rule["reason"],
                        "citation": rule["citation"],
                        "suggestion": f"Fix formatting for '{match.group()}'"
                    })
        
        # Format violations to match AuditFlag model
        formatted_violations = []
        for v in violations:
            formatted_violations.append({
                "issue_type": v["violation_type"],
                "severity": v["severity"] if v["severity"] in ["critical", "warning", "suggestion"] 
                           else {"high": "critical", "medium": "warning", "low": "suggestion"}[v["severity"]],
                "flagged_text": v.get("matched_text", "")[:100] if v.get("matched_text") else v["description"][:100],
                "rule_citation": v["citation"],
                "explanation": v["reason"],
                "suggested_fix": v["suggestion"],
                "confidence": "high"  # Deterministic rules always have high confidence
            })
        
        return formatted_violations
