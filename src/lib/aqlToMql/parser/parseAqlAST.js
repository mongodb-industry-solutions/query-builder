//src/app/lib/aqlToMql/parser/parseAqlAST.js

import antlr4 from "antlr4";
import AqlParserVisitor from "../grammar/AqlParserVisitor.js";
import AqlLexer from "../grammar/AqlLexer.js";
import AqlParser from "../grammar/AqlParser.js";

/**
 * Parses a raw FROM clause string into a structured object.
 * Expected raw format (without the leading "FROM"): 
 *   "EHReCONTAINSCOMPOSITIONc[openEHR-EHR-COMPOSITION.probs_base_composition.v0]CONTAINS(CLUSTERt[openEHR-EHR-CLUSTER.test_request_screen.v0])"
 * Returns:
 * {
 *   from: { rmType: "EHR", alias: "e", archetype_node_id: "" },
 *   contains: [
 *     { rmType: "COMPOSITION", alias: "c", archetype_node_id: "openEHR-EHR-COMPOSITION.probs_base_composition.v0" },
 *     { rmType: "CLUSTER", alias: "t", archetype_node_id: "openEHR-EHR-CLUSTER.test_request_screen.v0" }
 *   ]
 * }
 */
const parseFromClauseString = (fromClauseStr) => {
  const trimmed = fromClauseStr.trim();
  const withoutFrom = trimmed.replace(/^FROM\s*/i, "").trim();
  const tokens = withoutFrom.split(/CONTAINS/i).map(token => token.trim());
  
  const mainToken = tokens[0];
  const tokenRegex = /^([A-Z]+)\s*([a-z]+)(?:\[(.*?)\])?$/;
  
  const mainMatch = tokenRegex.exec(mainToken);
  const from = mainMatch 
    ? { rmType: mainMatch[1], alias: mainMatch[2], archetype_node_id: mainMatch[3] || "" }
    : { rmType: "", alias: "", archetype_node_id: "" };
  
  const contains = [];
  for (let i = 1; i < tokens.length; i++) {
    let token = tokens[i];
    if (token.startsWith("(") && token.endsWith(")")) {
      token = token.slice(1, -1).trim();
    }
    const match = tokenRegex.exec(token);
    if (match) {
      contains.push({
        rmType: match[1],
        alias: match[2],
        archetype_node_id: match[3] || ""
      });
    }
  }
  
  return { from, contains };
};

/* 
  The canonical AST will include the following keys:
    - select (as extracted by our visitor)
    - from (structured main rmType)
    - contains (structured contained entities as an array)
    - where
    - orderBy
    - limit
    - offset
*/

export default class AqlToIntermediateAstVisitor extends AqlParserVisitor {
  visitAqlQuery(ctx) {
    const result = {
      select: {},
      from: null,
      where: {},
      orderBy: {},
      limit: null,
      offset: null,
    };

    if (ctx.selectClause()) {
      result.select = this.visitSelectClause(ctx.selectClause());
    }
    if (ctx.fromClause()) {
      result.from = this.visitFromClause(ctx.fromClause());
    }
    if (ctx.whereClause()) {
      result.where = this.visitWhereClause(ctx.whereClause());
    }
    if (ctx.limitClause()) {
      // Visit limitClause to extract both limit and offset
      const limOff = this.visitLimitClause(ctx.limitClause());
      result.limit = limOff.limit;
      result.offset = limOff.offset;
    }
    if (ctx.orderByClause()) {
      result.orderBy = this.visitOrderByClause(ctx.orderByClause());
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SELECT and Column Specification
  // ─────────────────────────────────────────────────────────────────────────────
  visitSelectClause(ctx) {
    if (!ctx.resultTable || !ctx.resultTable()) {
      console.error("Error: No result table found in SELECT clause.");
      return {};
    }
    const resultTable = ctx.resultTable();
    if (!resultTable.columnSpec) {
      console.error("Error: columnSpec() is missing in SELECT clause.");
      return {};
    }
    const columns = resultTable.columnSpec().map((colSpecCtx) => 
      this.visitColumnSpec(colSpecCtx)
    );
    const result = {};
    columns.forEach((col, idx) => {
      result[idx] = col;
    });
    return result;
  }

  visitColumnSpec(ctx) {
    const columnValueCtx = ctx.columnValue();
    const aliasCtx = ctx.columnAlias();
    if (!columnValueCtx) return null;
    const value = this.visitColumnValue(columnValueCtx);
    const alias = aliasCtx ? aliasCtx.getText() : null;
    return { value, alias };
  }

  visitColumnValue(ctx) {
    if (ctx.dataMatchPath()) {
      return { type: "dataMatchPath", path: ctx.dataMatchPath().getText() };
    }
    const aggCallCtx = ctx.aggregateFunctionCall();
    if (aggCallCtx) {
      const aggCall = this.visitAggregateFunctionCall(aggCallCtx);
      return { type: "aggregateFunctionCall", path: aggCallCtx.getText(), function: aggCall.function };
    }
    if (ctx.functionCall()) {
      const funcCall = this.visitFunctionCall(ctx.functionCall());
      return { type: "functionCall", path: ctx.functionCall().getText(), function: funcCall };
    }
    if (ctx.primitiveLiteral()) {
      return { type: "literal", path: ctx.primitiveLiteral().getText(), value: ctx.primitiveLiteral().getText() };
    }
    return { type: "unknown", path: ctx.getText() };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FROM Clause – returns raw text for further processing.
  // ─────────────────────────────────────────────────────────────────────────────
  visitFromClause(ctx) {
    if (!ctx.children) return "";
    return ctx.children
      .map((child) => child.getText())
      .join(" ")
      .replace(/\s+/g, "")
      .trim();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WHERE Clause – enhanced for operators and function calls.
  // ─────────────────────────────────────────────────────────────────────────────
  visitWhereClause(ctx) {
    if (!ctx.whereExpr()) return {};
    const conditions = this.visitWhereExpr(ctx.whereExpr());
    if (Array.isArray(conditions)) {
      const obj = {};
      conditions.forEach((cond, idx) => (obj[idx] = cond));
      return obj;
    }
    return conditions;
  }

// Revised visitWhereExpr: 
visitWhereExpr(ctx) {
  if (!ctx) return null;
  
  // If the expression is wrapped in parentheses, unwrap it.
  if (ctx.getChildCount() === 3 &&
      ctx.getChild(0).getText() === '(' &&
      ctx.getChild(ctx.getChildCount() - 1).getText() === ')') {
    return this.visitWhereExpr(ctx.getChild(1));
  }
  
  // If we have exactly 3 children, treat it as a binary operation.
  if (ctx.getChildCount() === 3) {
    const left = this.visitWhereExpr(ctx.getChild(0));
    const op = ctx.getChild(1).getText().toUpperCase(); // e.g., "AND" or "OR"
    const right = this.visitWhereExpr(ctx.getChild(2));
    // Ensure left and right are wrapped in arrays.
    const leftArr = this.flattenWhereCondition(left);
    const rightArr = this.flattenWhereCondition(right);
    return {
      operator: op,
      conditions: [...leftArr, ...rightArr]
    };
  }
  
  // Otherwise, assume it is a leaf (or a simple expression)
  return this.visit(ctx.getChild(0));
}

flattenWhereCondition(condition) {
  // If condition is already an array, return it.
  if (Array.isArray(condition)) return condition;
  // If condition is non-null object, wrap it in an array.
  if (condition !== null && typeof condition === "object") return [condition];
  return [];
}

// Revised visitWhereBooleanLeaf: returns an object (not an array)
visitWhereBooleanLeaf(ctx) {
  if (!ctx) return null;
  // If the EXISTS operator is used:
  if (ctx.SYM_EXISTS()) {
    const path = ctx.dataMatchPath().getText();
    return { path, operator: "EXISTS", value: null };
  }
  // Attempt to get a left-hand expression:
  let leftExpr = null;
  if (ctx.arithmeticExpr()) {
    leftExpr = this.visitArithmeticExpr(ctx.arithmeticExpr());
  } else if (ctx.dataMatchPath()) {
    leftExpr = ctx.dataMatchPath().getText();
  } else if (ctx.functionCall()) {
    leftExpr = ctx.functionCall().getText();
  }
  const operator = ctx.comparisonOperator() ? ctx.comparisonOperator().getText() : null;
  let rightValue = null;
  if (ctx.comparisonOperand()) {
    rightValue = this.visitComparisonOperand(ctx.comparisonOperand());
  }
  if (leftExpr == null) {
    if (typeof rightValue === "string") {
      rightValue = rightValue.replace(/^'|'$/g, "");
    }
    return { path: "archetype_node_id", operator, value: rightValue };
  }
  return { path: leftExpr, operator, value: rightValue };
}

flattenWhereCondition(condition) {
  // If condition is already an array, return it.
  if (Array.isArray(condition)) return condition;
  // If condition is non-null object, wrap it in an array.
  if (condition !== null && typeof condition === "object") return [condition];
  return [];
}

// Revised visitWhereBooleanLeaf: returns an object (not an array)
visitWhereBooleanLeaf(ctx) {
  if (!ctx) return [];
  if (ctx.SYM_EXISTS()) {
    const path = ctx.dataMatchPath().getText();
    return [{ path, operator: "EXISTS", value: null }];
  }
  // Use dataMatchPath or functionCall if available; otherwise, if a comparisonOperand exists, use it.
  let leftExpr = null;
  if (ctx.dataMatchPath()) {
    leftExpr = ctx.dataMatchPath().getText();
  } else if (ctx.functionCall()) {
    leftExpr = ctx.functionCall().getText();
  } else if (ctx.comparisonOperand()) {
    leftExpr = this.visitComparisonOperand(ctx.comparisonOperand());
  }
  const operator = ctx.comparisonOperator() ? ctx.comparisonOperator().getText() : null;
  let rightValue = null;
  if (ctx.comparisonOperand()) {
    rightValue = this.visitComparisonOperand(ctx.comparisonOperand());
  }
  if (leftExpr == null) {
    if (typeof rightValue === "string") {
      rightValue = rightValue.replace(/^'|'$/g, "");
    }
    return [{ path: "archetype_node_id", operator, value: rightValue }];
  }
  return [{ path: leftExpr, operator, value: rightValue }];
}

  visitComparisonOperand(ctx) {
    if (ctx.value()) return this.visitValue(ctx.value());
    if (ctx.arithmeticExpr()) return this.visitArithmeticExpr(ctx.arithmeticExpr());
    return ctx.getText();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Limit, Offset, and OrderBy Clause
  visitLimitClause(ctx) {
    console.log("limitClause text:", ctx.getText());
    const ints = ctx.INTEGER();
    if (!ints) {
      console.log("No INTEGER tokens found in limitClause");
      return { limit: 0, offset: 0 };
    }
    console.log("INTEGER tokens:", ints.map(i => i.getText()));
    const limitVal = ints && ints.length > 0 ? parseInt(ints[0].getText(), 10) : 0;
    const offsetVal = ints && ints.length > 1 ? parseInt(ints[1].getText(), 10) : 0;
    return { limit: limitVal, offset: offsetVal };
  }

  visitOrderByClause(ctx) {
    if (!ctx || !ctx.orderByExpr()) return {};
    const orders = ctx.orderByExpr().map((order) => {
      const columnNode = order.modelPath();
      let direction = "ASC";
      const orderText = order.getText().toUpperCase();
      if (orderText.includes("DESC")) {
        direction = "DESC";
      }
      return {
        path: columnNode.getText(),
        direction
      };
    });
    const result = {};
    orders.forEach((order, idx) => {
      result[idx] = order;
    });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Additional Methods for Enhanced Operator and Function Support
  // ─────────────────────────────────────────────────────────────────────────────

  visitFunctionCall(ctx) {
    const funcCall = {};
    if (ctx.terminologyFunctionCall()) {
      funcCall.type = "terminologyFunctionCall";
      funcCall.text = ctx.terminologyFunctionCall().getText();
    } else if (ctx.builtInFunction() && ctx.functionArgs()) {
      funcCall.type = "builtInFunction";
      funcCall.name = ctx.builtInFunction().getText();
      funcCall.args = this.visitFunctionArgs(ctx.functionArgs());
    } else if (ctx.LC_ID() && ctx.functionArgs()) {
      funcCall.type = "genericFunctionCall";
      funcCall.name = ctx.LC_ID().getText();
      funcCall.args = this.visitFunctionArgs(ctx.functionArgs());
    } else {
      funcCall.type = "functionCall";
      funcCall.text = ctx.getText();
    }
    return funcCall;
  }

  visitFunctionArgs(ctx) {
    if (!ctx) return [];
    const values = [];
    if (ctx.value()) {
      ctx.value().forEach((val) => {
        values.push(this.visitValue(val));
      });
    }
    return values;
  }

  visitValue(ctx) {
    if (ctx.dataMatchPath()) {
      return { type: "dataMatchPath", value: ctx.dataMatchPath().getText() };
    }
    if (ctx.primitiveLiteral()) {
      return { type: "literal", value: ctx.primitiveLiteral().getText() };
    }
    if (ctx.functionCall()) {
      return this.visitFunctionCall(ctx.functionCall());
    }
    if (ctx.arithmeticExpr()) {
      return this.visitArithmeticExpr(ctx.arithmeticExpr());
    }
    return { type: "value", value: ctx.getText() };
  }

  visitAggregateFunctionCall(ctx) {
    const func = {};
    if (ctx.name && typeof ctx.name.getText === "function") {
      func.name = ctx.name.getText();
    } else if (ctx.aggregateMathFunction() && typeof ctx.aggregateMathFunction().getText === "function") {
      func.name = ctx.aggregateMathFunction().getText();
    } else {
      func.name = ctx.getText();
    }
    const augmentedAdlPathNode = ctx.augmentedAdlPath ? ctx.augmentedAdlPath() : null;
    func.args = augmentedAdlPathNode ? augmentedAdlPathNode.getText() : null;
    return { type: "aggregateFunctionCall", function: func };
  }

  visitArithmeticExpr(ctx) {
    if (ctx.getChildCount() === 1) {
      return this.visitArithmeticLeaf(ctx.getChild(0));
    } else if (ctx.getChildCount() === 3) {
      return {
        type: "arithmeticExpr",
        left: this.visitArithmeticExpr(ctx.getChild(0)),
        operator: ctx.getChild(1).getText(),
        right: this.visitArithmeticExpr(ctx.getChild(2))
      };
    } else {
      return { type: "arithmeticExpr", text: ctx.getText() };
    }
  }

  visitArithmeticLeaf(ctx) {
    if (ctx.arithmeticLiteral()) {
      return { type: "literal", value: ctx.arithmeticLiteral().getText() };
    }
    if (ctx.value()) {
      return this.visitValue(ctx.value());
    }
    if (ctx.getChildCount() === 3) {
      return this.visitArithmeticExpr(ctx.getChild(1));
    }
    return { type: "arithmeticLeaf", text: ctx.getText() };
  }
}

//
// ─── PARSING FUNCTION AND CANONICAL AST CONSTRUCTION ──────────────────────────
//
export const parseAqlToCustomAst = (aqlInput) => {
  const chars = new antlr4.InputStream(aqlInput);
  const lexer = new AqlLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new AqlParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.aqlQuery();
  const visitor = new AqlToIntermediateAstVisitor();
  const rawAst = visitor.visit(tree);
  
  const fromData = parseFromClauseString(rawAst.from);
  
  const ast = {
    select: rawAst.select,
    from: fromData.from,
    contains: fromData.contains,
    where: rawAst.where,
    orderBy: rawAst.orderBy,
    limit: rawAst.limit,
    offset: rawAst.offset
  };
  
  return ast;
};

export const parseAql = (aqlInput) => {
  return parseAqlToCustomAst(aqlInput);
};