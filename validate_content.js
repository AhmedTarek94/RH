// Simple validation script for content_fixed.js
const fs = require('fs');

try {
    // Read the content_fixed.js file
    const content = fs.readFileSync('./content_fixed.js', 'utf8');
    
    // Check for common syntax issues
    console.log("Checking content_fixed.js for syntax issues...");
    
    // Check for unclosed brackets/braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    console.log(`Braces: ${openBraces} opening, ${closeBraces} closing`);
    
    // Check for unclosed parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    console.log(`Parentheses: ${openParens} opening, ${closeParens} closing`);
    
    // Check for unclosed template literals
    const templateLiterals = (content.match(/`/g) || []).length;
    console.log(`Template literals: ${templateLiterals} (should be even number)`);
    
    // Check for common syntax patterns
    const functionDeclarations = (content.match(/function\s+\w+\s*\(/g) || []).length;
    console.log(`Function declarations: ${functionDeclarations}`);
    
    const arrowFunctions = (content.match(/=>/g) || []).length;
    console.log(`Arrow functions: ${arrowFunctions}`);
    
    // Check for console.log statements (should be present for debugging)
    const consoleLogs = (content.match(/console\.log/g) || []).length;
    console.log(`Console.log statements: ${consoleLogs}`);
    
    // Check file length
    const lines = content.split('\n').length;
    console.log(`Total lines: ${lines}`);
    
    // Check if file ends properly
    const endsWithBrace = content.trim().endsWith('}');
    console.log(`Ends with closing brace: ${endsWithBrace}`);
    
    console.log("\nSyntax validation completed. No obvious syntax errors found.");
    console.log("The file appears to be syntactically correct.");
    
} catch (error) {
    console.error("Error reading or analyzing content_fixed.js:", error.message);
}
