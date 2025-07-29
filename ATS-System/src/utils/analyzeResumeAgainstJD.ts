import stringSimilarity from "string-similarity";
import natural from "natural";

interface MatchResult {
  matchPercentage: string;
  similarityScore: number;
  matchedKeywords: string[];
}

export function analyzeResumeAgainstJD(resumeText: string, jd: string): MatchResult {
  const similarityScore = stringSimilarity.compareTwoStrings(resumeText, jd);
  const matchPercentage = (similarityScore * 100).toFixed(2) + "%";

  const tfidf = new natural.TfIdf();
  tfidf.addDocument(jd);
  tfidf.addDocument(resumeText);

  const matchedKeywords: string[] = tfidf
    .listTerms(0) // terms from JD
    .filter(item => item.tfidf > 0.1)
    .map(item => item.term)
    .filter(term => resumeText.toLowerCase().includes(term.toLowerCase()));

  return {
    matchPercentage,
    similarityScore,
    matchedKeywords,
  };
}
