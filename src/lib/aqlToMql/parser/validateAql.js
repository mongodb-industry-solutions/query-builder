import antlr4 from "antlr4";
import AqlLexer from "../grammar/AqlLexer.js";
import AqlParser from "../grammar/AqlParser.js";

class AqlErrorListener extends antlr4.error.ErrorListener {
  constructor() {
    super();
    this.errors = [];
  }

  syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
    console.error(`Syntax Error at line ${line}:${column} - ${msg}`);
    this.errors.push({ line, column, message: msg });
  }

  getErrors() {
    return this.errors;
  }
}

const validateAQL = (aqlInput) => {
  console.log("Validating AQL:", aqlInput);

  if (!aqlInput || aqlInput.trim() === "") {
    return { success: false, message: "AQL query is empty.", errors: [] }; // Ensure `errors` exists
  }

  try {
    const chars = new antlr4.InputStream(aqlInput);
    const lexer = new AqlLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new AqlParser(tokens);

    // Attach error listener
    const errorListener = new AqlErrorListener();
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);

    parser.buildParseTrees = true;
    const tree = parser.aqlQuery(); // Start parsing from AQL Query rule

    const errors = errorListener.getErrors(); // Get collected errors
    console.log("AQL Errors:", errors);

    return {
      success: errors.length === 0,
      message: errors.length > 0 ? "AQL syntax errors detected." : "Valid AQL query ✅",
      errors: errors || [], // Ensure it is always an array
    };
  } catch (error) {
    console.error("Validation failed:", error);
    return { success: false, message: "Unexpected error during validation.", errors: [error.message] };
  }
};

export default validateAQL;