// lib/aqlToMql/translator/index.js
import { translateSingle } from "./1-single-match.js";
import { translateSingleSearch } from "./2-single-search.js";

export const translateASTToMQL = (ast, modelKey = "1-single-match") => {
  switch (modelKey) {
    case "distributed":
      throw new Error("Distributed translator not implemented yet");
    case "2-single-search":
      return translateSingleSearch(ast);
    case "1-single-match":
    default:
      return translateSingle(ast);
  }
};