export type FixStrategy = 'minimal' | 'comprehensive' | 'refactor';

export const getFixGenerationPrompt = (issueDescription: string, analysis: string, context: string, strategy: FixStrategy): string => {
  const strategyInstructions = {
    minimal: 'Focus on the smallest possible change to fix the bug. Do not touch unrelated code.',
    comprehensive: 'Fix the bug and address edge cases or logical gaps identified in the analysis.',
    refactor: 'Fix the bug while improving code readability and following best practices.',
  };

  return `
ACT AS: Senior Software Engineer
TASK: Generate a code fix for the reported issue.

### ISSUE DESCRIPTION
${issueDescription}

### ANALYSIS
${analysis}

### CODE CONTEXT
${context}

### STRATEGY
${strategyInstructions[strategy]}

### OUTPUT REQUIREMENTS
You must return a valid JSON object. Do not include markdown code blocks (like \`\`\`json).
The JSON must follow this structure:
{
  "explanation": "Detailed explanation of the fix",
  "confidenceScore": 0.95,
  "changes": [
    {
      "filePath": "path/to/file.ts",
      "originalCode": "exact snippet to replace",
      "replacementCode": "new code snippet"
    }
  ]
}

### CRITICAL RULES
1. "originalCode" must be an EXACT substring match of the code provided in the context.
2. Ensure the "replacementCode" maintains existing indentation and coding style.
3. If multiple files need changes, include them all in the "changes" array.
`;
};
