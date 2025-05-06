/**
 * Given results array and answerKey, compute score
 * @param {Array<{number:number, modelAnswer:string}>} results 
 * @param {{[num:number]:string}} answerKey 
 */
function evaluateResults(results, answerKey) {
  return results.reduce((sum, r) => sum + (r.modelAnswer === answerKey[r.number] ? 1 : 0), 0);
}

module.exports = { evaluateResults }; 