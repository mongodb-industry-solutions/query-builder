// AQL Query Formatter Utility Functions

// Helper: Splits a line on commas only when those commas are outside square brackets, curly braces, and quotes.
export const splitByCommaOutsideBrackets = (line) => {
    let parts = [];
    let current = "";
    let squareDepth = 0;
    let curlyDepth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
  
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
  
      // Toggle quote states.
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      }
  
      // Update bracket and curly brace depth if not inside quotes.
      if (!inSingleQuote && !inDoubleQuote) {
        if (char === '[') {
          squareDepth++;
        } else if (char === ']') {
          squareDepth = Math.max(0, squareDepth - 1);
        } else if (char === '{') {
          curlyDepth++;
        } else if (char === '}') {
          curlyDepth = Math.max(0, curlyDepth - 1);
        }
      }
  
      // If we encounter a comma outside brackets/curly braces/quotes, split here.
      if (char === ',' && squareDepth === 0 && curlyDepth === 0 && !inSingleQuote && !inDoubleQuote) {
        parts.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    if (current) parts.push(current);
    return parts;
  };
  
  // Helper: Formats a FROM/CONTAINS block with hierarchical indentation.
  export const formatFromContainsBlock = (line) => {
    if (!/^FROM\s+/i.test(line)) return line;
    
    // Remove the FROM keyword.
    let content = line.replace(/^FROM\s+/i, '').trim();
    // Split by "CONTAINS" (ignoring case).
    let tokens = content.split(/\bCONTAINS\b/i).map(token => token.trim());
    
    // Indentation helper: 4 spaces per level.
    const indent = (n) => '    '.repeat(n);
    
    let result = "FROM";
    if (tokens[0]) {
      // The first token is indented 1 level.
      result += "\n" + indent(1) + tokens[0];
    }
    // For each subsequent token, indent increasingly.
    for (let i = 1; i < tokens.length; i++) {
      result += "\n" + indent(2 * i) + "CONTAINS";
      result += "\n" + indent(2 * i + 1) + tokens[i];
    }
    return result;
  };
  
  /**
   * Formats an AQL query with improved readability
   * @param {string} query - The input AQL query to format
   * @returns {string} Formatted AQL query
   */
  export const formatAQLQuery = (query) => {
    // Normalize the input by replacing newlines and extra spaces.
    query = query.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  
    // 1. Ensure a space after CONTAINS when missing.
    query = query.replace(/\bCONTAINS(?=\S)/gi, 'CONTAINS ');
  
    // 2. Basic keyword formatting: uppercase keywords and insert newlines for main clauses.
    query = query
      .replace(/\bselect\b/gi, '\nSELECT\n')
      .replace(/\bfrom\b/gi, '\nFROM ')
      .replace(/\bcontains\b/gi, '\nCONTAINS ')
      .replace(/\bwhere\b/gi, '\nWHERE\n')
      .replace(/\border by\b/gi, '\nORDER BY\n')
      .replace(/\boffset\b/gi, '\nOFFSET ')
      .replace(/\blimit\b/gi, '\nLIMIT ');
  
    // 3. Process each line.
    let lines = query.split('\n');
    lines = lines.map(line => {
      // Special handling for the WHERE clause.
      if (/^WHERE\s+/i.test(line)) {
        let conditions = line.replace(/^WHERE\s*/i, '').trim();
        // Insert a newline after each AND or OR.
        conditions = conditions.replace(/\s+(AND|OR)\s+/gi, ' $1 \n    ');
        return "WHERE\n    " + conditions;
      }
      // Process the FROM/CONTAINS block.
      if (/^FROM\s+/i.test(line)) {
        return formatFromContainsBlock(line);
      }
      // For lines containing commas and paths, use the helper.
      if (line.includes(',') && /\/[^,\s]+/.test(line)) {
        const clauseMatch = line.match(/^(SELECT|FROM|CONTAINS|WHERE|ORDER BY|OFFSET|LIMIT)/i);
        const clause = clauseMatch ? clauseMatch[0] : '';
        const parts = splitByCommaOutsideBrackets(line).map(part => part.trim());
        if (clause && parts[0].toUpperCase().startsWith(clause.toUpperCase())) {
          parts[0] = parts[0].replace(new RegExp(`^${clause}\\s*`, 'i'), '');
        }
        if (clause.toUpperCase() === 'SELECT') {
          return "SELECT\n" + parts.map(part => "    " + part).join(",\n");
        }
        return parts
          .map((part, index) => index === 0 ? `${clause} ${part}` : '    ' + part)
          .join(",\n");
      }
      return line;
    });
  
    query = lines.join('\n').trim();
  
    // 4. For COUNT (or similar function calls), collapse content inside the parentheses to a single line.
    query = query.replace(/COUNT\(([\s\S]*?)\)(\s+AS\s+\w+)/gi, (match, content, alias) => {
      const singleLineContent = content.replace(/\n\s*/g, ' ').trim();
      return `COUNT(${singleLineContent})${alias}`;
    });
  
    return query.trim();
  };