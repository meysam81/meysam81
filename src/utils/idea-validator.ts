/**
 * SaaS Idea Validator - Questions, Scoring Logic, and Recommendations
 *
 * A battle-tested framework for validating startup ideas before building.
 * Based on lessons from successful founders and common failure patterns.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Question {
  id: string;
  text: string;
  category: CategoryId;
  tooltip: string;
  weight: number; // 1-3 importance multiplier
  yesFollowUp?: string; // Encouraging message when yes
  noFollowUp?: string; // Constructive guidance when no
}

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  description: string;
  maxScore: number;
}

export type CategoryId = 'market' | 'problem' | 'solution' | 'distribution' | 'founder';

export type Answer = 'yes' | 'no' | 'skip' | null;

export interface ValidationResult {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  categoryScores: Record<CategoryId, CategoryScore>;
  grade: Grade;
  headline: string;
  recommendations: Recommendation[];
  strengths: string[];
  weaknesses: string[];
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  answeredCount: number;
  totalCount: number;
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: CategoryId;
  text: string;
  action: string;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

// ============================================================================
// CATEGORIES
// ============================================================================

export const categories: Category[] = [
  {
    id: 'market',
    name: 'Market',
    icon: 'M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h2v2H7V7zm4 0h6v2h-6V7zm-4 4h2v2H7v-2zm4 0h6v2h-6v-2zm-4 4h2v2H7v-2zm4 0h6v2h-6v-2z',
    color: '#8b5cf6', // Purple
    description: 'Understanding your target market size, growth, and accessibility',
    maxScore: 0 // Calculated dynamically
  },
  {
    id: 'problem',
    name: 'Problem',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    color: '#f59e0b', // Amber
    description: 'Validating the problem exists and people want it solved',
    maxScore: 0
  },
  {
    id: 'solution',
    name: 'Solution',
    icon: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',
    color: '#10b981', // Emerald
    description: 'Evaluating your solution\'s viability and differentiation',
    maxScore: 0
  },
  {
    id: 'distribution',
    name: 'Distribution',
    icon: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z',
    color: '#3b82f6', // Blue
    description: 'Your ability to reach and acquire customers profitably',
    maxScore: 0
  },
  {
    id: 'founder',
    name: 'Founder Fit',
    icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    color: '#ec4899', // Pink
    description: 'Your unique advantages and commitment to this problem',
    maxScore: 0
  }
];

// ============================================================================
// QUESTIONS
// ============================================================================

export const questions: Question[] = [
  // MARKET (4 questions)
  {
    id: 'market-1',
    text: 'Can you describe your ideal customer in specific detail?',
    category: 'market',
    tooltip: 'Not just demographics — their job title, daily frustrations, what tools they use, where they hang out online. Vague = dangerous.',
    weight: 3,
    yesFollowUp: 'Specific customer knowledge is your compass. It guides every decision.',
    noFollowUp: 'Talk to 10 potential customers this week. Specificity beats assumptions.'
  },
  {
    id: 'market-2',
    text: 'Is there a clear way to estimate your market size?',
    category: 'market',
    tooltip: 'TAM/SAM/SOM thinking. Can you put a number on how many potential customers exist and their willingness to pay?',
    weight: 2,
    yesFollowUp: 'Good. Make sure your SOM is big enough to build a real business.',
    noFollowUp: 'Try bottom-up: count actual customers you could reach, multiply by realistic price.'
  },
  {
    id: 'market-3',
    text: 'Is this market growing or at least stable?',
    category: 'market',
    tooltip: 'Declining markets are graveyards for startups. You want tailwinds, not headwinds.',
    weight: 2,
    yesFollowUp: 'Rising tides lift all boats. Growth markets forgive mistakes.',
    noFollowUp: 'Seriously reconsider. Swimming against currents exhausts even great swimmers.'
  },
  {
    id: 'market-4',
    text: 'Do you have a realistic way to reach this market?',
    category: 'market',
    tooltip: 'Existing audience, partnership opportunities, SEO potential, or marketing budget. "Build it and they will come" is a myth.',
    weight: 3,
    yesFollowUp: 'Distribution advantage is often more valuable than product advantage.',
    noFollowUp: 'This is the #1 startup killer. Solve distribution before building.'
  },

  // PROBLEM (4 questions)
  {
    id: 'problem-1',
    text: 'Have you talked to at least 5 potential customers about this problem?',
    category: 'problem',
    tooltip: 'Real conversations, not surveys. Did they lean in? Did they ask when they could buy? Did they offer to pay for early access?',
    weight: 3,
    yesFollowUp: 'Most founders skip this. You\'re already ahead.',
    noFollowUp: 'Stop everything. Talk to people first. Building without validation is gambling.'
  },
  {
    id: 'problem-2',
    text: 'Are people actively trying to solve this problem today?',
    category: 'problem',
    tooltip: 'Look for evidence: existing solutions (even bad ones), workarounds, spreadsheets, manual processes. No existing solutions often means no real problem.',
    weight: 3,
    yesFollowUp: 'Existing behavior is the strongest signal of real demand.',
    noFollowUp: 'Be cautious. You might be creating a solution looking for a problem.'
  },
  {
    id: 'problem-3',
    text: 'Would customers pay money to solve this problem?',
    category: 'problem',
    tooltip: 'Not "would it be nice" — would they actually pay? Have you tested willingness to pay, not just interest?',
    weight: 3,
    yesFollowUp: 'Payment intent separates tire-kickers from real customers.',
    noFollowUp: 'Nice-to-have problems don\'t build businesses. Find hair-on-fire urgency.'
  },
  {
    id: 'problem-4',
    text: 'Is this a recurring problem, not a one-time fix?',
    category: 'problem',
    tooltip: 'SaaS thrives on recurring value. One-time problems mean one-time payments and constant customer acquisition.',
    weight: 2,
    yesFollowUp: 'Recurring problems = recurring revenue. The SaaS dream.',
    noFollowUp: 'Consider if SaaS is the right model, or if you need a different business structure.'
  },

  // SOLUTION (4 questions)
  {
    id: 'solution-1',
    text: 'Is your solution meaningfully better than what exists?',
    category: 'solution',
    tooltip: '10x better on at least one dimension that matters. "Slightly better" isn\'t enough to overcome switching costs.',
    weight: 3,
    yesFollowUp: 'Clear differentiation is your moat. Protect and communicate it.',
    noFollowUp: 'Why would anyone switch? Find your 10x angle or reconsider.'
  },
  {
    id: 'solution-2',
    text: 'Can you build an MVP and get it to customers within 30 days?',
    category: 'solution',
    tooltip: 'Scope discipline. If it takes 6 months, you\'ll run out of runway, motivation, or both before learning anything.',
    weight: 2,
    yesFollowUp: 'Speed is your competitive advantage as a small team.',
    noFollowUp: 'Scope down ruthlessly. What\'s the smallest thing that delivers value?'
  },
  {
    id: 'solution-3',
    text: 'Are you free from critical dependencies on platforms you don\'t control?',
    category: 'solution',
    tooltip: 'Platform risk is real. API changes, policy shifts, and de-platforming have killed many startups overnight.',
    weight: 2,
    yesFollowUp: 'Independence gives you control over your destiny.',
    noFollowUp: 'Have a contingency plan. Diversify dependencies where possible.'
  },
  {
    id: 'solution-4',
    text: 'Can a single person or small team adopt your product without org-wide buy-in?',
    category: 'solution',
    tooltip: 'Enterprise sales cycles are brutal for bootstrappers. Bottom-up adoption is faster and cheaper.',
    weight: 2,
    yesFollowUp: 'Bottom-up adoption is the bootstrapper\'s secret weapon.',
    noFollowUp: 'Long sales cycles drain resources. Consider if you can start smaller.'
  },

  // DISTRIBUTION (4 questions)
  {
    id: 'distribution-1',
    text: 'Do you have an existing channel to reach potential customers?',
    category: 'distribution',
    tooltip: 'Newsletter, audience, partnerships, community, or meaningful marketing budget. Zero distribution = zero customers.',
    weight: 3,
    yesFollowUp: 'Your existing reach is worth more than you think. Leverage it.',
    noFollowUp: 'Start building distribution now. Content, community, or partnerships.'
  },
  {
    id: 'distribution-2',
    text: 'Can customers find you when searching for solutions to this problem?',
    category: 'distribution',
    tooltip: 'SEO potential, relevant keywords with search volume, ability to rank. Search intent = high-quality leads.',
    weight: 2,
    yesFollowUp: 'SEO is a compounding asset. Start content investment early.',
    noFollowUp: 'You\'ll need alternative channels. Paid, social, or partnerships.'
  },
  {
    id: 'distribution-3',
    text: 'Is your product naturally shareable or referable?',
    category: 'distribution',
    tooltip: 'Network effects, viral loops, or strong word-of-mouth potential. Does using it make people want to share it?',
    weight: 2,
    yesFollowUp: 'Organic growth is the best growth. Nurture and amplify it.',
    noFollowUp: 'You\'ll rely more on paid acquisition. Make sure unit economics work.'
  },
  {
    id: 'distribution-4',
    text: 'Can you acquire customers for less than their lifetime value?',
    category: 'distribution',
    tooltip: 'CAC < LTV is the fundamental equation. Without it, you\'re subsidizing every customer.',
    weight: 3,
    yesFollowUp: 'Profitable unit economics unlock sustainable growth.',
    noFollowUp: 'This breaks businesses. Find cheaper channels or increase LTV.'
  },

  // FOUNDER FIT (4 questions)
  {
    id: 'founder-1',
    text: 'Do you have relevant expertise or unfair advantage in this space?',
    category: 'founder',
    tooltip: 'Domain knowledge, industry connections, technical edge, or unique insight. Why are YOU the one to build this?',
    weight: 3,
    yesFollowUp: 'Your unfair advantage is why you\'ll win where others failed.',
    noFollowUp: 'Consider partnering with someone who has domain expertise.'
  },
  {
    id: 'founder-2',
    text: 'Could you work on this problem for 5+ years without burning out?',
    category: 'founder',
    tooltip: 'Startups take longer than expected. Passion for the problem (not just the solution) sustains you through hard times.',
    weight: 2,
    yesFollowUp: 'Genuine passion is the ultimate competitive advantage.',
    noFollowUp: 'Consider if this is the hill you want to climb. Commitment matters.'
  },
  {
    id: 'founder-3',
    text: 'Can you build and ship the first version yourself?',
    category: 'founder',
    tooltip: 'Technical founders who can ship have a massive advantage. Dependency on others slows everything down.',
    weight: 2,
    yesFollowUp: 'Maker skills are superpowers. Ship fast, learn faster.',
    noFollowUp: 'Find a technical co-founder or learn to code. This is critical.'
  },
  {
    id: 'founder-4',
    text: 'Does this business fit your life constraints?',
    category: 'founder',
    tooltip: 'Time availability, financial runway, family obligations, location requirements. Misalignment here creates unsustainable stress.',
    weight: 2,
    yesFollowUp: 'Sustainable founder life = sustainable company building.',
    noFollowUp: 'Adjust the model or your constraints. Burnout kills more startups than competition.'
  }
];

// Calculate max scores for each category
categories.forEach(cat => {
  cat.maxScore = questions
    .filter(q => q.category === cat.id)
    .reduce((sum, q) => sum + q.weight * 2, 0); // weight * 2 because yes = 2 points per weight
});

// ============================================================================
// SCORING LOGIC
// ============================================================================

export function calculateResults(answers: Record<string, Answer>): ValidationResult {
  const categoryScores: Record<CategoryId, CategoryScore> = {} as Record<CategoryId, CategoryScore>;

  // Calculate scores per category
  for (const category of categories) {
    const categoryQuestions = questions.filter(q => q.category === category.id);
    let score = 0;
    let maxScore = 0;
    let answeredCount = 0;

    for (const question of categoryQuestions) {
      const answer = answers[question.id];
      const questionMaxScore = question.weight * 2;
      maxScore += questionMaxScore;

      if (answer === 'yes') {
        score += questionMaxScore;
        answeredCount++;
      } else if (answer === 'no') {
        score += 0;
        answeredCount++;
      } else if (answer === 'skip') {
        // Skip gives 25% of possible points (benefit of doubt, but not full credit)
        score += questionMaxScore * 0.25;
        answeredCount++;
      }
      // null answers don't add to score or answered count
    }

    categoryScores[category.id] = {
      score,
      maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      answeredCount,
      totalCount: categoryQuestions.length
    };
  }

  // Calculate total score
  const totalScore = Object.values(categoryScores).reduce((sum, cs) => sum + cs.score, 0);
  const maxPossibleScore = Object.values(categoryScores).reduce((sum, cs) => sum + cs.maxScore, 0);
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  // Determine grade and headline
  const { grade, headline } = getGradeAndHeadline(percentage, categoryScores);

  // Generate recommendations
  const recommendations = generateRecommendations(answers, categoryScores);

  // Identify strengths and weaknesses
  const { strengths, weaknesses } = identifyStrengthsWeaknesses(categoryScores);

  return {
    totalScore,
    maxPossibleScore,
    percentage,
    categoryScores,
    grade,
    headline,
    recommendations,
    strengths,
    weaknesses
  };
}

function getGradeAndHeadline(
  percentage: number,
  categoryScores: Record<CategoryId, CategoryScore>
): { grade: Grade; headline: string } {
  // Find weakest category
  const weakestCategory = Object.entries(categoryScores)
    .sort((a, b) => a[1].percentage - b[1].percentage)[0];
  const weakestCatName = categories.find(c => c.id === weakestCategory[0])?.name || '';

  if (percentage >= 85) {
    return {
      grade: 'A',
      headline: 'Exceptional foundation. This idea has serious potential.'
    };
  } else if (percentage >= 70) {
    return {
      grade: 'B',
      headline: `Strong idea. Focus on strengthening ${weakestCatName.toLowerCase()} to level up.`
    };
  } else if (percentage >= 55) {
    return {
      grade: 'C',
      headline: `Promising concept with gaps. ${weakestCatName} needs immediate attention.`
    };
  } else if (percentage >= 40) {
    return {
      grade: 'D',
      headline: 'Significant validation needed. Don\'t build yet — talk to more customers.'
    };
  } else {
    return {
      grade: 'F',
      headline: 'Major red flags. Pivot or dig deeper before investing time.'
    };
  }
}

function generateRecommendations(
  answers: Record<string, Answer>,
  categoryScores: Record<CategoryId, CategoryScore>
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Critical: Problem validation questions answered 'no'
  if (answers['problem-1'] === 'no') {
    recommendations.push({
      priority: 'critical',
      category: 'problem',
      text: 'You haven\'t validated the problem with real customers',
      action: 'Schedule 5 customer conversations this week. No building until you\'ve talked to people.'
    });
  }

  if (answers['problem-3'] === 'no') {
    recommendations.push({
      priority: 'critical',
      category: 'problem',
      text: 'No evidence customers will pay',
      action: 'Test willingness to pay by asking for pre-orders or deposits before building.'
    });
  }

  // Critical: Distribution
  if (answers['distribution-1'] === 'no' && answers['distribution-2'] === 'no') {
    recommendations.push({
      priority: 'critical',
      category: 'distribution',
      text: 'No clear path to customers',
      action: 'Build distribution before product. Start a newsletter, join communities, or find partners.'
    });
  }

  // High: Market understanding
  if (answers['market-1'] === 'no') {
    recommendations.push({
      priority: 'high',
      category: 'market',
      text: 'Customer profile is too vague',
      action: 'Create a detailed ideal customer profile. Name them. Describe their day.'
    });
  }

  // High: Solution differentiation
  if (answers['solution-1'] === 'no') {
    recommendations.push({
      priority: 'high',
      category: 'solution',
      text: 'No clear differentiation from alternatives',
      action: 'Find your 10x angle. Speed? Price? Simplicity? Specific niche?'
    });
  }

  // High: Founder fit
  if (answers['founder-1'] === 'no') {
    recommendations.push({
      priority: 'high',
      category: 'founder',
      text: 'No unfair advantage in this space',
      action: 'Consider partnering with a domain expert or building expertise first.'
    });
  }

  // Medium: Various areas
  if (answers['solution-2'] === 'no') {
    recommendations.push({
      priority: 'medium',
      category: 'solution',
      text: 'MVP timeline is too long',
      action: 'Cut scope by 80%. What\'s the smallest version that delivers value?'
    });
  }

  if (answers['distribution-4'] === 'no') {
    recommendations.push({
      priority: 'medium',
      category: 'distribution',
      text: 'Unit economics may not work',
      action: 'Model your CAC and LTV. Find cheaper acquisition channels.'
    });
  }

  if (answers['problem-4'] === 'no') {
    recommendations.push({
      priority: 'medium',
      category: 'problem',
      text: 'One-time problem limits SaaS potential',
      action: 'Explore adjacent recurring pain points or different business models.'
    });
  }

  // Low: Nice to improve
  if (answers['market-3'] === 'no') {
    recommendations.push({
      priority: 'low',
      category: 'market',
      text: 'Market may be declining',
      action: 'Research market trends. Consider adjacent growing segments.'
    });
  }

  if (answers['founder-4'] === 'no') {
    recommendations.push({
      priority: 'low',
      category: 'founder',
      text: 'Life constraints may cause friction',
      action: 'Adjust timeline expectations or restructure commitments.'
    });
  }

  // Add category-specific recommendations for low scores
  for (const [catId, score] of Object.entries(categoryScores)) {
    if (score.percentage < 40 && !recommendations.some(r => r.category === catId && r.priority === 'critical')) {
      const category = categories.find(c => c.id === catId)!;
      recommendations.push({
        priority: 'high',
        category: catId as CategoryId,
        text: `${category.name} score is critically low`,
        action: `Review all ${category.name.toLowerCase()} questions and address gaps systematically.`
      });
    }
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

function identifyStrengthsWeaknesses(
  categoryScores: Record<CategoryId, CategoryScore>
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const sortedCategories = Object.entries(categoryScores)
    .map(([id, score]) => ({
      category: categories.find(c => c.id === id)!,
      score
    }))
    .sort((a, b) => b.score.percentage - a.score.percentage);

  // Top 2 are strengths if above 60%
  for (const { category, score } of sortedCategories.slice(0, 2)) {
    if (score.percentage >= 60) {
      if (category.id === 'market') strengths.push('Strong market understanding');
      if (category.id === 'problem') strengths.push('Well-validated problem');
      if (category.id === 'solution') strengths.push('Compelling solution approach');
      if (category.id === 'distribution') strengths.push('Clear path to customers');
      if (category.id === 'founder') strengths.push('Strong founder-market fit');
    }
  }

  // Bottom 2 are weaknesses if below 50%
  for (const { category, score } of sortedCategories.slice(-2).reverse()) {
    if (score.percentage < 50) {
      if (category.id === 'market') weaknesses.push('Market definition needs work');
      if (category.id === 'problem') weaknesses.push('Problem validation is lacking');
      if (category.id === 'solution') weaknesses.push('Solution differentiation unclear');
      if (category.id === 'distribution') weaknesses.push('Distribution strategy is weak');
      if (category.id === 'founder') weaknesses.push('Founder fit concerns');
    }
  }

  return { strengths, weaknesses };
}

// ============================================================================
// UTILITIES
// ============================================================================

export function getQuestionsForCategory(categoryId: CategoryId): Question[] {
  return questions.filter(q => q.category === categoryId);
}

export function getCategoryById(categoryId: CategoryId): Category | undefined {
  return categories.find(c => c.id === categoryId);
}

export function getQuestionById(questionId: string): Question | undefined {
  return questions.find(q => q.id === questionId);
}

export function getProgressPercentage(answers: Record<string, Answer>): number {
  const answeredCount = Object.values(answers).filter(a => a !== null).length;
  return Math.round((answeredCount / questions.length) * 100);
}

export function isValidationComplete(answers: Record<string, Answer>): boolean {
  return Object.values(answers).filter(a => a !== null).length === questions.length;
}

export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'A': return '#10b981'; // Emerald
    case 'B': return '#3b82f6'; // Blue
    case 'C': return '#f59e0b'; // Amber
    case 'D': return '#f97316'; // Orange
    case 'F': return '#ef4444'; // Red
  }
}

export function getScoreEmoji(percentage: number): string {
  if (percentage >= 85) return '🚀';
  if (percentage >= 70) return '💪';
  if (percentage >= 55) return '🎯';
  if (percentage >= 40) return '🔍';
  return '⚠️';
}

// ============================================================================
// PERSISTENCE
// ============================================================================

const STORAGE_KEY = 'saas-idea-validator';

interface SavedState {
  ideaName: string;
  answers: Record<string, Answer>;
  timestamp: number;
}

export function saveProgress(ideaName: string, answers: Record<string, Answer>): void {
  try {
    const state: SavedState = {
      ideaName,
      answers,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage not available (private browsing, etc.)
  }
}

export function loadProgress(): SavedState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // localStorage not available
  }
  return null;
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // localStorage not available
  }
}

// ============================================================================
// SHARING
// ============================================================================

export function generateShareText(ideaName: string, result: ValidationResult): string {
  const emoji = getScoreEmoji(result.percentage);
  const name = ideaName ? `"${ideaName}"` : 'My SaaS idea';
  return `${emoji} Just validated ${name} using @meysamazing's SaaS Idea Validator

Score: ${result.percentage}/100 (Grade ${result.grade})
${result.headline}

Validate your idea: https://meysam.io/tools/saas-idea-validator`;
}

export function generateShareUrl(answers: Record<string, Answer>, ideaName: string): string {
  try {
    const data = { a: answers, n: ideaName };
    const encoded = btoa(JSON.stringify(data));
    return `https://meysam.io/tools/saas-idea-validator?r=${encoded}`;
  } catch {
    return 'https://meysam.io/tools/saas-idea-validator';
  }
}

export function parseShareUrl(encoded: string): { answers: Record<string, Answer>; ideaName: string } | null {
  try {
    const decoded = atob(encoded);
    const data = JSON.parse(decoded);
    return { answers: data.a, ideaName: data.n || '' };
  } catch {
    return null;
  }
}
