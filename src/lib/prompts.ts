export function generateCodeReviewPrompt(code: string, language: string): string {
  return `You are an expert software engineer and code reviewer.  

I will provide you with some code. Your task is to:

1. Review the code for **correctness, readability, maintainability, performance, and security**.  
2. Point out potential **bugs, edge cases, or unintended behavior**.  
3. Suggest improvements in **code style, structure, or best practices**.  
4. If relevant, suggest alternative implementations that are **simpler, more efficient, or more idiomatic**.  
5. Keep your review **concise but detailed enough to be actionable**.  

Please format your response in **markdown** as follows:

## 📝 Summary  
Overall impression of the code.  

## ✅ Strengths  
- Positive aspects  
- Good practices used  

## ⚠️ Issues  
- Problems, risks, or bad practices found  

## 💡 Suggestions  
- Specific improvements or refactor ideas  

## 🔧 Example Fixes (if applicable)  
\`\`\`${language}
// Short improved code snippets
\`\`\`

---

Here is the code to review:

\`\`\`${language}
${code}
\`\`\`
`;
}
